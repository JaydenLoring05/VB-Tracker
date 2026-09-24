import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Never talk to Supabase: replace the server client and control what it returns.
type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};
type GetUserResult = { data: { user: { id: string } | null }; error: unknown };

const getUser = vi.fn<() => Promise<GetUserResult>>();
const createServerClient = vi.fn((_url: string, _key: string, _options: { cookies: CookieAdapter }) => ({
  auth: { getUser }
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: Parameters<typeof createServerClient>) => createServerClient(...args)
}));

import { config, proxy } from "@/proxy";

const signedIn: GetUserResult = { data: { user: { id: "user-1" } }, error: null };
const signedOut: GetUserResult = { data: { user: null }, error: null };
const deadSession: GetUserResult = {
  data: { user: null },
  error: { name: "AuthApiError", code: "refresh_token_not_found", message: "Invalid Refresh Token: Refresh Token Not Found" }
};
const networkError: GetUserResult = {
  data: { user: null },
  error: { name: "AuthRetryableFetchError", message: "fetch failed", status: 0 }
};

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`https://nextrep.test${path}`, cookie ? { headers: { cookie } } : undefined);
}

const isRedirect = (response: Response) => response.status >= 300 && response.status < 400;
const location = (response: Response) => new URL(response.headers.get("location") as string);
const isCleared = (response: Awaited<ReturnType<typeof proxy>>, name: string) => {
  const cookie = response.cookies.get(name);
  return cookie !== undefined && cookie.value === "" && (response.headers.get("set-cookie") ?? "").includes(`${name}=;`);
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder");
  getUser.mockResolvedValue(signedOut);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("proxy: /demo", () => {
  it("passes through without touching Supabase, signed in or out", async () => {
    for (const result of [signedOut, signedIn, deadSession]) {
      getUser.mockResolvedValue(result);
      const response = await proxy(request("/demo", { "sb-x-auth-token": "stale" }));

      expect(isRedirect(response)).toBe(false);
      expect(response.status).toBe(200);
    }
    expect(createServerClient).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe("proxy: signed out", () => {
  it.each(["/", "/login", "/pilot", "/privacy", "/terms", "/auth/callback"])("lets a visitor open %s", async (path) => {
    const response = await proxy(request(path));
    expect(isRedirect(response)).toBe(false);
  });

  it.each(["/dashboard", "/coach", "/stats", "/workouts", "/settings", "/pilot/extra", "/demo/extra", "/login/x"])(
    "redirects %s to /login",
    async (path) => {
      const response = await proxy(request(`${path}?tab=1`));

      expect(isRedirect(response)).toBe(true);
      expect(location(response).pathname).toBe("/login");
      expect(location(response).search).toBe("");
      expect(location(response).host).toBe("nextrep.test");
    }
  );

  it("does not clear cookies for an ordinary signed-out visit", async () => {
    const response = await proxy(request("/dashboard", { "sb-x-auth-token": "fine" }));
    expect(isCleared(response, "sb-x-auth-token")).toBe(false);
  });
});

describe("proxy: signed in", () => {
  beforeEach(() => getUser.mockResolvedValue(signedIn));

  it.each(["/", "/login"])("sends %s to the dashboard", async (path) => {
    const response = await proxy(request(path));

    expect(isRedirect(response)).toBe(true);
    expect(location(response).pathname).toBe("/dashboard");
  });

  it.each(["/dashboard", "/coach", "/pilot", "/privacy", "/terms", "/auth/callback"])(
    "lets a signed-in user open %s",
    async (path) => {
      expect(isRedirect(await proxy(request(path)))).toBe(false);
    }
  );
});

describe("proxy: dead sessions", () => {
  const cookies = { "sb-x-auth-token": "stale", "sb-x-auth-token-code-verifier": "v", theme: "dark" };

  it("clears Supabase cookies when redirecting to /login", async () => {
    getUser.mockResolvedValue(deadSession);
    const response = await proxy(request("/dashboard", cookies));

    expect(isRedirect(response)).toBe(true);
    expect(location(response).pathname).toBe("/login");
    expect(isCleared(response, "sb-x-auth-token")).toBe(true);
    expect(isCleared(response, "sb-x-auth-token-code-verifier")).toBe(true);
    expect(response.cookies.get("theme")).toBeUndefined();
  });

  it("clears the stale cookies on a public page instead of redirecting", async () => {
    getUser.mockResolvedValue(deadSession);
    const response = await proxy(request("/login", cookies));

    expect(isRedirect(response)).toBe(false);
    expect(isCleared(response, "sb-x-auth-token")).toBe(true);
    expect(response.cookies.get("theme")).toBeUndefined();
  });

  it("leaves the session alone on a transient Supabase network error", async () => {
    getUser.mockResolvedValue(networkError);
    const response = await proxy(request("/dashboard", cookies));

    expect(location(response).pathname).toBe("/login");
    expect(isCleared(response, "sb-x-auth-token")).toBe(false);
  });

  it("does not crash when the session check throws, and keeps the cookies", async () => {
    getUser.mockRejectedValue(new Error("socket hang up"));

    const publicResponse = await proxy(request("/login", cookies));
    expect(isRedirect(publicResponse)).toBe(false);
    expect(isCleared(publicResponse, "sb-x-auth-token")).toBe(false);

    const privateResponse = await proxy(request("/dashboard", cookies));
    expect(location(privateResponse).pathname).toBe("/login");
    expect(isCleared(privateResponse, "sb-x-auth-token")).toBe(false);
  });
});

describe("proxy: refreshed cookies", () => {
  it("carries cookies Supabase rotated during the check onto a redirect", async () => {
    getUser.mockImplementation(async () => {
      const { cookies } = createServerClient.mock.calls[0][2];
      cookies.setAll([{ name: "sb-x-auth-token", value: "rotated", options: { path: "/" } }]);
      return signedIn;
    });

    const response = await proxy(request("/login", { "sb-x-auth-token": "old" }));

    expect(location(response).pathname).toBe("/dashboard");
    expect(response.cookies.get("sb-x-auth-token")?.value).toBe("rotated");
  });

  it("sets rotated cookies on the normal response too", async () => {
    getUser.mockImplementation(async () => {
      const { cookies } = createServerClient.mock.calls[0][2];
      cookies.setAll([{ name: "sb-x-auth-token", value: "rotated", options: { path: "/" } }]);
      return signedIn;
    });

    const response = await proxy(request("/dashboard", { "sb-x-auth-token": "old" }));

    expect(isRedirect(response)).toBe(false);
    expect(response.cookies.get("sb-x-auth-token")?.value).toBe("rotated");
  });

  it("hands the request's cookies to the Supabase client", async () => {
    await proxy(request("/login", { "sb-x-auth-token": "abc" }));

    const { cookies } = createServerClient.mock.calls[0][2];
    expect(cookies.getAll()).toEqual([{ name: "sb-x-auth-token", value: "abc" }]);
    expect(createServerClient.mock.calls[0][0]).toBe("https://placeholder.supabase.co");
  });
});

// Next compiles a matcher string with path-to-regexp; its single custom group
// is a plain JS regex, so anchoring it reproduces which paths run the proxy.
describe("proxy matcher", () => {
  const pattern = new RegExp(`^${config.matcher[0]}$`);
  const runs = (path: string) => pattern.test(path);

  it("declares a single matcher", () => {
    expect(config.matcher).toHaveLength(1);
  });

  it.each([
    "/sw.js",
    "/manifest.webmanifest",
    "/icons/icon-192.png",
    "/icons/apple-touch-icon.png",
    "/offline",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/api/pilot",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/icon",
    "/icon-1a2b3c",
    "/apple-icon",
    "/opengraph-image",
    "/opengraph-image-9f8e7d",
    "/twitter-image",
    "/some/logo.svg",
    "/photo.webp"
  ])("skips %s so signed-out visitors can fetch it", (path) => {
    expect(runs(path), path).toBe(false);
  });

  it.each([
    "/",
    "/login",
    "/pilot",
    "/demo",
    "/dashboard",
    "/coach/roster",
    "/auth/callback",
    "/privacy",
    "/api/other",
    "/api/pilot/extra",
    "/offline/extra",
    "/sw.jsx",
    "/iconography",
    "/icons-page",
    "/opengraph-image/extra"
  ])("still runs the proxy for %s", (path) => {
    expect(runs(path), path).toBe(true);
  });
});
