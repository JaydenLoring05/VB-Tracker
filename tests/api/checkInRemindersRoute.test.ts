import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach real Supabase or Resend: replace the client and fetch.
const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ rpc })) }));

const fetchMock = vi.fn();
const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

function cronRequest(authorization?: string) {
  const headers: Record<string, string> = {};
  if (authorization) headers.authorization = authorization;
  return new NextRequest("https://nextrep.test/api/checkin-reminders", { headers });
}

async function loadRoutes() {
  vi.resetModules();
  return {
    reminders: (await import("@/app/api/checkin-reminders/route")).GET,
    unsubscribe: (await import("@/app/api/reminders/unsubscribe/route")).POST
  };
}

function enable() {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("DAILY_SUMMARY_FROM", "NextRep <summary@nextrep.test>");
  vi.stubEnv("CRON_SECRET", "cron-secret");
}

beforeEach(() => {
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("DAILY_SUMMARY_FROM", "");
  vi.stubEnv("CRON_SECRET", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  vi.stubGlobal("fetch", fetchMock);
  rpc.mockResolvedValue({
    data: [{ user_id: "a", email: "ava@nextrep.test", display_name: "Ava", team_name: "Varsity", unsubscribe_token: TOKEN }],
    error: null
  });
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GET /api/checkin-reminders", () => {
  it("is off until Resend and the cron secret are configured", async () => {
    const { reminders } = await loadRoutes();
    expect(await (await reminders(cronRequest("Bearer x"))).json()).toEqual({ ok: true, skipped: true });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects calls without the cron secret", async () => {
    enable();
    const { reminders } = await loadRoutes();
    expect((await reminders(cronRequest())).status).toBe(401);
    expect((await reminders(cronRequest("Bearer wrong"))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("emails each due athlete with the check-in link and unsubscribe headers", async () => {
    enable();
    const { reminders } = await loadRoutes();
    const response = await reminders(cronRequest("Bearer cron-secret"));
    expect(await response.json()).toEqual({ ok: true, recipients: 1, sent: 1, failed: 0 });
    expect(rpc).toHaveBeenCalledWith("checkin_reminder_recipients", { p_secret: "cron-secret" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.to).toEqual(["ava@nextrep.test"]);
    expect(body.text).toContain("/check-in");
    expect(body.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });

  it("sends nothing when the recipient lookup fails", async () => {
    enable();
    rpc.mockResolvedValue({ data: null, error: { message: "not authorized" } });
    const { reminders } = await loadRoutes();
    expect((await reminders(cronRequest("Bearer cron-secret"))).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/reminders/unsubscribe", () => {
  const post = (query: string) => new NextRequest(`https://nextrep.test/api/reminders/unsubscribe${query}`, { method: "POST" });

  it("turns reminders off for a valid token", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const { unsubscribe } = await loadRoutes();
    const response = await unsubscribe(post(`?t=${TOKEN}`));
    expect(await response.json()).toEqual({ ok: true, found: true });
    expect(rpc).toHaveBeenCalledWith("unsubscribe_checkin_reminders", { p_token: TOKEN });
  });

  it("rejects a malformed token without calling the database", async () => {
    const { unsubscribe } = await loadRoutes();
    expect((await unsubscribe(post("?t=nope"))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
