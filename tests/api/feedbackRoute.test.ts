import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach real Supabase or Resend.
const getUser = vi.fn();
const inserted: unknown[] = [];
let insertError: { code: string } | null = null;

function builder(table: string) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "limit"]) chain[method] = () => chain;
  chain.then = (resolve: (value: unknown) => unknown) =>
    resolve({ data: [{ team_id: "t1", role: "athlete", teams: { name: "Varsity" } }], error: null });
  chain.insert = (row: unknown) => {
    if (table === "feedback") inserted.push(row);
    return Promise.resolve({ error: insertError });
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from: (table: string) => builder(table) })
}));

const fetchMock = vi.fn();
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://nextrep.test/api/feedback", {
    method: "POST",
    headers: { host: "nextrep.test", "user-agent": IPHONE, "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/feedback/route")).POST;
}

beforeEach(() => {
  inserted.length = 0;
  insertError = null;
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("DAILY_SUMMARY_FROM", "");
  vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abcdef1234567");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("POST /api/feedback", () => {
  it("requires a signed-in user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const POST = await loadRoute();
    expect((await POST(post({ message: "hi" }))).status).toBe(401);
  });

  it("rejects cross-origin posts and empty messages", async () => {
    const POST = await loadRoute();
    expect((await POST(post({ message: "hi" }, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(post({ message: "   " }))).status).toBe(400);
    expect(inserted).toEqual([]);
  });

  it("saves the message with context worked out on the server", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ message: "Timer froze", page: "/workout/abc?x=1", role: "coach" }));
    expect(await response.json()).toEqual({ ok: true, emailed: false });
    expect(inserted).toEqual([
      {
        user_id: "u1",
        message: "Timer froze",
        page: "/workout/abc",
        role: "athlete",
        team_id: "t1",
        app_version: expect.stringMatching(/^\d+\.\d+\.\d+\+abcdef1$/),
        device: "iPhone · Safari"
      }
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails CONTACT_EMAIL when Resend is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("DAILY_SUMMARY_FROM", "NextRep <x@nextrep.test>");
    const POST = await loadRoute();
    expect(await (await POST(post({ message: "Love it" }))).json()).toEqual({ ok: true, emailed: true });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(["jaydenloring05@gmail.com"]);
    expect(body.text).toContain("Love it");
  });

  it("reports a save failure without emailing", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("DAILY_SUMMARY_FROM", "NextRep <x@nextrep.test>");
    insertError = { code: "42P01" };
    const POST = await loadRoute();
    expect((await POST(post({ message: "hi" }))).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
