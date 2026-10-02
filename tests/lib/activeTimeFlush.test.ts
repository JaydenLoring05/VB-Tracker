import { describe, expect, it } from "vitest";

import { activeSecondsAfterWindow, buildActiveTimeFlushRequest } from "@/lib/activeTimeFlush";

describe("activeSecondsAfterWindow", () => {
  it("adds the elapsed whole seconds since resumed_at", () => {
    const now = Date.parse("2026-10-01T10:05:00Z");
    expect(activeSecondsAfterWindow(120, "2026-10-01T10:00:00Z", now)).toBe(420);
  });

  it("treats a missing previous total as 0", () => {
    const now = Date.parse("2026-10-01T10:00:30Z");
    expect(activeSecondsAfterWindow(null, "2026-10-01T10:00:00Z", now)).toBe(30);
  });

  it("never subtracts when the clock moved backwards", () => {
    const now = Date.parse("2026-10-01T09:59:00Z");
    expect(activeSecondsAfterWindow(50, "2026-10-01T10:00:00Z", now)).toBe(50);
  });
});

describe("buildActiveTimeFlushRequest", () => {
  const base = {
    supabaseUrl: "https://abc.supabase.co/",
    anonKey: "anon-key",
    accessToken: "user-jwt",
    sessionId: "11111111-2222-3333-4444-555555555555",
    userId: "99999999-8888-7777-6666-555555555555",
    activeSeconds: 420
  };

  it("targets one session row owned by the user through PostgREST", () => {
    const { url } = buildActiveTimeFlushRequest(base);
    expect(url).toBe(
      "https://abc.supabase.co/rest/v1/workout_sessions" +
        "?id=eq.11111111-2222-3333-4444-555555555555&user_id=eq.99999999-8888-7777-6666-555555555555"
    );
  });

  it("is a keepalive PATCH so it survives a tab close or hard reload", () => {
    const { init } = buildActiveTimeFlushRequest(base);
    expect(init.method).toBe("PATCH");
    expect(init.keepalive).toBe(true);
  });

  it("sends the user's own token, so row-level security still applies", () => {
    const { init } = buildActiveTimeFlushRequest(base);
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBe("anon-key");
    expect(headers.Authorization).toBe("Bearer user-jwt");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers.Prefer).toBe("return=minimal");
  });

  it("writes the new total and closes the active window", () => {
    const { init } = buildActiveTimeFlushRequest(base);
    expect(JSON.parse(init.body as string)).toEqual({ active_seconds: 420, resumed_at: null });
  });

  it("encodes ids so they cannot add extra filters", () => {
    const { url } = buildActiveTimeFlushRequest({ ...base, sessionId: "x&user_id=neq.y" });
    expect(url).toContain("id=eq.x%26user_id%3Dneq.y");
  });
});
