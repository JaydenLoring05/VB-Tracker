import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach real Supabase or Google.
const getUser = vi.fn();
let memberships: { team_id: string }[] = [];

function builder() {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "limit"]) chain[method] = () => chain;
  chain.then = (resolve: (value: unknown) => unknown) => resolve({ data: memberships, error: null });
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from: () => builder() })
}));

const fetchMock = vi.fn();
const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abc";
const LINK = `https://docs.google.com/spreadsheets/d/${ID}/edit#gid=3`;

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://nextrep.test/api/import-sheet", {
    method: "POST",
    headers: { host: "nextrep.test", "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/import-sheet/route")).POST;
}

beforeEach(() => {
  memberships = [{ team_id: "t1" }];
  getUser.mockResolvedValue({ data: { user: { id: "coach-1" } } });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response("Monday\nSquat,3,5", { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/import-sheet", () => {
  it("is for signed-in coaches only, from this site", async () => {
    const POST = await loadRoute();
    expect((await POST(post({ url: LINK }, { origin: "https://evil.example" }))).status).toBe(403);

    getUser.mockResolvedValue({ data: { user: null } });
    expect((await POST(post({ url: LINK }))).status).toBe(401);

    getUser.mockResolvedValue({ data: { user: { id: "athlete-1" } } });
    memberships = [];
    expect((await POST(post({ url: LINK }))).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses anything that isn't a Google Sheets link, without fetching it", async () => {
    const POST = await loadRoute();
    for (const url of ["https://evil.example/x.csv", "http://169.254.169.254/latest", `https://docs.google.com/document/d/${ID}`, 42]) {
      expect((await POST(post({ url }))).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches the CSV address built from the id, with no redirects and a timeout, and returns it", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ url: LINK }));
    expect(await response.json()).toEqual({ ok: true, csv: "Monday\nSquat,3,5" });
    const [address, init] = fetchMock.mock.calls[0];
    expect(address).toBe(`https://docs.google.com/spreadsheets/d/${ID}/gviz/tq?tqx=out:csv&gid=3`);
    expect(init).toMatchObject({ redirect: "manual" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("says how to share a private sheet", async () => {
    const POST = await loadRoute();
    fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://accounts.google.com/..." } }));
    const redirected = await POST(post({ url: LINK }));
    expect(redirected.status).toBe(422);
    expect((await redirected.json()).error).toMatch(/Anyone with the link/);

    fetchMock.mockResolvedValue(new Response("<html>Sign in</html>", { status: 200, headers: { "content-type": "text/html" } }));
    expect((await POST(post({ url: LINK }))).status).toBe(422);
  });

  it("gives up on a slow or unreachable Google, and on a huge sheet", async () => {
    const POST = await loadRoute();
    fetchMock.mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    const slow = await POST(post({ url: LINK }));
    expect(slow.status).toBe(502);
    expect((await slow.json()).error).toMatch(/too long/);

    fetchMock.mockResolvedValue(
      new Response("x".repeat(1024 * 1024 + 1), { status: 200, headers: { "content-type": "text/csv" } })
    );
    expect((await POST(post({ url: LINK }))).status).toBe(413);
  });
});
