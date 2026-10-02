import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach real Supabase or Resend: replace the client and fetch.
const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ rpc })) }));

const fetchMock = vi.fn();

function get(authorization?: string) {
  const headers: Record<string, string> = {};
  if (authorization) headers.authorization = authorization;
  return new NextRequest("https://nextrep.test/api/daily-summary", { headers });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/daily-summary/route")).GET;
}

function enable() {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("DAILY_SUMMARY_FROM", "NextRep <summary@nextrep.test>");
  vi.stubEnv("CRON_SECRET", "cron-secret");
}

const TEAM = {
  team_id: "t1",
  team_name: "Varsity",
  coach_email: "coach@nextrep.test",
  coach_name: "Coach",
  team_program_days: null,
  today_events: [],
  athletes: []
};

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("DAILY_SUMMARY_FROM", "");
  vi.stubEnv("CRON_SECRET", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubGlobal("fetch", fetchMock);
  rpc.mockResolvedValue({ data: [TEAM], error: null });
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/daily-summary", () => {
  it("is a no-op when the env vars are missing", async () => {
    const GET = await loadRoute();
    const response = await GET(get("Bearer anything"));
    expect(await response.json()).toEqual({ ok: true, skipped: true });
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a request without the cron secret", async () => {
    enable();
    const GET = await loadRoute();
    expect((await GET(get())).status).toBe(401);
    expect((await GET(get("Bearer wrong"))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("loads data with the secret and emails each opted-in coach", async () => {
    enable();
    const GET = await loadRoute();
    const response = await GET(get("Bearer cron-secret"));
    expect(await response.json()).toEqual({ ok: true, teams: 1, sent: 1, failed: 0 });
    expect(rpc).toHaveBeenCalledWith("daily_summary_data", expect.objectContaining({ p_secret: "cron-secret" }));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body).to).toEqual(["coach@nextrep.test"]);
  });

  it("reports a data error without sending anything", async () => {
    enable();
    rpc.mockResolvedValue({ data: null, error: { message: "not authorized" } });
    const GET = await loadRoute();
    const response = await GET(get("Bearer cron-secret"));
    expect(response.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("counts failed sends", async () => {
    enable();
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    const GET = await loadRoute();
    expect(await (await GET(get("Bearer cron-secret"))).json()).toEqual({ ok: false, teams: 1, sent: 0, failed: 1 });
  });
});
