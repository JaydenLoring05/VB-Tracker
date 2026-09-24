import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

import { beforeEach, describe, expect, it, vi } from "vitest";

// public/sw.js is plain script, not a module. Run it in a sandbox with a fake
// worker scope, cache storage and fetch, then drive its event listeners.

const ORIGIN = "https://nextrep.test";
const SOURCE = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

type Listener = (event: unknown) => void;
type FakeResponse = {
  ok: boolean;
  redirected: boolean;
  type: string;
  status: number;
  headers: { get: (name: string) => string | null };
  clone: () => FakeResponse;
  body?: string;
};

function response({
  ok = true,
  redirected = false,
  type = "basic",
  contentType = "text/html; charset=utf-8",
  body = "body"
}: { ok?: boolean; redirected?: boolean; type?: string; contentType?: string | null; body?: string } = {}): FakeResponse {
  const value: FakeResponse = {
    ok,
    redirected,
    type,
    status: ok ? 200 : 500,
    headers: { get: (name) => (name.toLowerCase() === "content-type" ? contentType : null) },
    clone: () => value,
    body
  };
  return value;
}

function urlOf(input: unknown): string {
  return typeof input === "string" ? input : (input as { url: string }).url;
}

function createHarness() {
  const listeners: Record<string, Listener> = {};
  const stores = new Map<string, Map<string, FakeResponse>>();
  const puts: { cache: string; url: string }[] = [];
  const deleted: string[] = [];
  const state = { failPuts: false };

  const openCache = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name) as Map<string, FakeResponse>;
    return {
      match: async (input: unknown) => store.get(urlOf(input).replace(ORIGIN, "")) ?? store.get(urlOf(input)),
      put: async (input: unknown, value: FakeResponse) => {
        if (state.failPuts) throw new Error("QuotaExceededError");
        const key = urlOf(input).replace(ORIGIN, "");
        puts.push({ cache: name, url: key });
        store.set(key, value);
      }
    };
  };

  const fetchMock = vi.fn<(input: unknown) => Promise<FakeResponse>>();
  const claim = vi.fn(async () => undefined);
  const skipWaiting = vi.fn(async () => undefined);

  const scope = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    clients: { claim },
    skipWaiting
  };

  const sandbox = {
    self: scope,
    caches: {
      open: async (name: string) => openCache(name),
      keys: async () => [...stores.keys()],
      delete: async (name: string) => {
        deleted.push(name);
        return stores.delete(name);
      }
    },
    fetch: fetchMock,
    Request: class {
      url: string;
      constructor(url: string, public init?: unknown) {
        this.url = url;
      }
    },
    Response,
    URL,
    Promise
  };
  vm.runInNewContext(SOURCE, sandbox);

  /** Dispatches a lifecycle event and waits for whatever it passed to waitUntil. */
  async function lifecycle(type: "install" | "activate") {
    let pending: Promise<unknown> = Promise.resolve();
    listeners[type]({ waitUntil: (promise: Promise<unknown>) => (pending = promise) });
    await pending;
  }

  /** Dispatches a fetch event. Resolves to the response, or "passthrough" if the worker did not respond. */
  async function request(url: string, { method = "GET", mode = "cors" }: { method?: string; mode?: string } = {}) {
    let responded: Promise<unknown> | null = null;
    listeners.fetch({
      request: { method, mode, url: url.startsWith("http") ? url : `${ORIGIN}${url}` },
      respondWith: (promise: Promise<unknown>) => (responded = promise)
    });
    if (!responded) return "passthrough" as const;
    return (await responded) as FakeResponse | Response;
  }

  return { lifecycle, request, fetch: fetchMock, stores, puts, deleted, claim, skipWaiting, state };
}

let sw: ReturnType<typeof createHarness>;

beforeEach(() => {
  sw = createHarness();
});

describe("service worker install", () => {
  it("precaches only the /offline page, bypassing the HTTP cache", async () => {
    sw.fetch.mockResolvedValue(response());
    await sw.lifecycle("install");

    expect(sw.fetch).toHaveBeenCalledTimes(1);
    const [requested] = sw.fetch.mock.calls[0] as [{ url: string; init: { cache: string } }];
    expect(requested.url).toBe("/offline");
    expect(requested.init).toEqual({ cache: "reload" });
    expect(sw.puts).toEqual([{ cache: "nextrep-static-v1", url: "/offline" }]);
    expect(sw.skipWaiting).toHaveBeenCalled();
  });

  it("refuses to store a redirected /offline response (could be a user-specific page)", async () => {
    sw.fetch.mockResolvedValue(response({ redirected: true }));
    await sw.lifecycle("install");
    expect(sw.puts).toEqual([]);
  });

  it("refuses to store a failed or non-HTML /offline response", async () => {
    sw.fetch.mockResolvedValue(response({ ok: false }));
    await sw.lifecycle("install");
    sw.fetch.mockResolvedValue(response({ contentType: "application/json" }));
    await sw.lifecycle("install");
    sw.fetch.mockResolvedValue(response({ contentType: null }));
    await sw.lifecycle("install");

    expect(sw.puts).toEqual([]);
  });

  it("still installs when the offline page cannot be fetched", async () => {
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sw.lifecycle("install")).resolves.toBeUndefined();
    expect(sw.skipWaiting).toHaveBeenCalled();
  });
});

describe("service worker activate", () => {
  it("deletes stale NextRep caches, keeps the current one and unrelated ones, and claims clients", async () => {
    sw.stores.set("nextrep-static-v0", new Map());
    sw.stores.set("nextrep-static-v1", new Map());
    sw.stores.set("nextrep-other", new Map());
    sw.stores.set("someone-elses-cache", new Map());

    await sw.lifecycle("activate");

    expect(sw.deleted.sort()).toEqual(["nextrep-other", "nextrep-static-v0"]);
    expect([...sw.stores.keys()].sort()).toEqual(["nextrep-static-v1", "someone-elses-cache"]);
    expect(sw.claim).toHaveBeenCalled();
  });
});

describe("service worker fetch: never handled", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("ignores %s requests, even to cacheable paths", async (method) => {
    expect(await sw.request("/_next/static/app.js", { method })).toBe("passthrough");
    expect(await sw.request("/api/pilot", { method })).toBe("passthrough");
    expect(sw.fetch).not.toHaveBeenCalled();
  });

  it("ignores Supabase and every other cross-origin request", async () => {
    for (const url of [
      "https://abc.supabase.co/rest/v1/stats_history?select=*",
      "https://abc.supabase.co/auth/v1/token?grant_type=refresh_token",
      "https://cdn.example.com/_next/static/app.js",
      "https://cdn.example.com/icons/icon-192.png"
    ]) {
      expect(await sw.request(url), url).toBe("passthrough");
    }
    expect(await sw.request("https://abc.supabase.co/auth/v1/user", { mode: "navigate" })).toBe("passthrough");
    expect(sw.fetch).not.toHaveBeenCalled();
    expect(sw.puts).toEqual([]);
  });

  it("ignores same-origin API calls, RSC payloads, images and data requests", async () => {
    for (const url of [
      "/api/pilot",
      "/dashboard?_rsc=abc123",
      "/coach",
      "/auth/callback?code=secret",
      "/_next/image?url=%2Ficons%2Ficon-192.png&w=64&q=75",
      "/_next/data/build/dashboard.json",
      "/manifest.webmanifest",
      "/sw.js"
    ]) {
      expect(await sw.request(url), url).toBe("passthrough");
    }
    expect(sw.fetch).not.toHaveBeenCalled();
    expect(sw.puts).toEqual([]);
  });
});

describe("service worker fetch: navigations", () => {
  it("is network-first and never stores the page, including authenticated routes", async () => {
    for (const path of ["/dashboard", "/coach", "/auth/callback?code=x", "/login", "/", "/offline"]) {
      const page = response({ body: `<html>${path}</html>` });
      sw.fetch.mockResolvedValue(page);

      expect(await sw.request(path, { mode: "navigate" }), path).toBe(page);
    }
    expect(sw.puts).toEqual([]);
  });

  it("serves the cached /offline page when the network is down", async () => {
    sw.fetch.mockResolvedValueOnce(response({ body: "offline page" }));
    await sw.lifecycle("install");

    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const result = (await sw.request("/dashboard", { mode: "navigate" })) as FakeResponse;

    expect(result.body).toBe("offline page");
  });

  it("falls back to a plain 503 when nothing was precached", async () => {
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const result = (await sw.request("/dashboard", { mode: "navigate" })) as Response;

    expect(result.status).toBe(503);
    expect(await result.text()).toBe("You are offline.");
  });

  it("never falls back to a cached copy of any page other than /offline", async () => {
    sw.stores.set("nextrep-static-v1", new Map([["/dashboard", response({ body: "someone's dashboard" })]]));
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = (await sw.request("/dashboard", { mode: "navigate" })) as Response;
    expect(result.status).toBe(503);
  });
});

describe("service worker fetch: static assets", () => {
  it.each(["/_next/static/chunks/app-1a2b.js", "/_next/static/css/app.css", "/icons/icon-192.png"])(
    "caches %s on first fetch and serves it from cache afterwards",
    async (path) => {
      const asset = response({ contentType: "application/javascript", body: path });
      sw.fetch.mockResolvedValue(asset);

      expect(await sw.request(path)).toBe(asset);
      expect(sw.puts).toEqual([{ cache: "nextrep-static-v1", url: path }]);

      sw.fetch.mockClear();
      expect(await sw.request(path)).toBe(asset);
      expect(sw.fetch).not.toHaveBeenCalled();
    }
  );

  it("does not cache failed, opaque or cross-origin-typed responses", async () => {
    sw.fetch.mockResolvedValue(response({ ok: false }));
    await sw.request("/_next/static/missing.js");
    sw.fetch.mockResolvedValue(response({ type: "opaque" }));
    await sw.request("/_next/static/opaque.js");
    sw.fetch.mockResolvedValue(response({ type: "cors" }));
    await sw.request("/icons/cors.png");

    expect(sw.puts).toEqual([]);
  });

  it("returns the network response even when the cache write fails", async () => {
    const asset = response();
    sw.fetch.mockResolvedValue(asset);
    sw.state.failPuts = true;

    expect(await sw.request("/_next/static/a.js")).toBe(asset);
    // Let the fire-and-forget rejection settle: it must be swallowed, not unhandled.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("propagates a network failure for uncached static assets", async () => {
    sw.fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sw.request("/_next/static/a.js")).rejects.toThrow("Failed to fetch");
  });
});
