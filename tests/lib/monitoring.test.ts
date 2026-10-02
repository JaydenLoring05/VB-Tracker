import { describe, expect, it } from "vitest";

import { isAnalyticsEnabled, readSentryDsn, redactAnalyticsUrl, scrubEvent } from "@/lib/monitoring";

describe("readSentryDsn", () => {
  it("is off without a DSN and trims a real one", () => {
    expect(readSentryDsn(undefined)).toBeNull();
    expect(readSentryDsn("  ")).toBeNull();
    expect(readSentryDsn(" https://abc@o1.ingest.sentry.io/2 ")).toBe("https://abc@o1.ingest.sentry.io/2");
  });
});

describe("isAnalyticsEnabled", () => {
  it("is off unless the flag is exactly true", () => {
    expect(isAnalyticsEnabled(undefined)).toBe(false);
    expect(isAnalyticsEnabled("1")).toBe(false);
    expect(isAnalyticsEnabled("true")).toBe(true);
  });
});

describe("scrubEvent", () => {
  const event = {
    message: "save failed",
    user: { id: "u1", email: "ava@example.com", ip_address: "1.2.3.4" },
    request: {
      url: "https://nextrep.app/stats?sleep=4",
      query_string: "sleep=4",
      data: { knee_pain: 7 },
      cookies: { "sb-access-token": "x" },
      headers: { cookie: "a=b", "user-agent": "UA", authorization: "Bearer t" }
    },
    extra: { entry: { sleep: 4, energy: 2, kneePain: 7, note: "felt off" }, attempt: 2 },
    contexts: { stats: { soreness: 8, readiness: 41 } },
    breadcrumbs: [
      { category: "fetch", data: { url: "https://x.supabase.co/rest/v1/stats_history?user_id=eq.u1", method: "POST" } },
      { category: "ui.input", message: "input[name=sleep] 4" },
      { category: "navigation", data: { from: "/join/A1B2C3", to: "/dashboard" } }
    ]
  };
  const scrubbed = scrubEvent(structuredClone(event));

  it("drops identity, cookies, request bodies and query strings", () => {
    expect(scrubbed.user).toEqual({ id: "u1" });
    expect(scrubbed.request).toEqual({ url: "https://nextrep.app/stats", headers: { "user-agent": "UA" } });
  });

  it("redacts every health value wherever it appears", () => {
    expect(scrubbed.extra).toEqual({
      entry: { sleep: "[redacted]", energy: "[redacted]", kneePain: "[redacted]", note: "[redacted]" },
      attempt: 2
    });
    expect(scrubbed.contexts).toEqual({ stats: { soreness: "[redacted]", readiness: "[redacted]" } });
  });

  it("strips query strings from breadcrumb URLs and drops typed-input breadcrumbs", () => {
    expect(scrubbed.breadcrumbs).toEqual([
      { category: "fetch", data: { url: "https://x.supabase.co/rest/v1/stats_history", method: "POST" } },
      { category: "navigation", data: { from: "/join/[code]", to: "/dashboard" } }
    ]);
  });

  it("keeps the message and leaves an empty event alone", () => {
    expect(scrubbed.message).toBe("save failed");
    expect(scrubEvent({})).toEqual({});
  });
});

describe("redactAnalyticsUrl", () => {
  it("removes invite codes, record ids and query strings from page views", () => {
    expect(redactAnalyticsUrl("https://nextrep.app/join/A1B2C3")).toBe("https://nextrep.app/join/[code]");
    expect(redactAnalyticsUrl("https://nextrep.app/workout/3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(
      "https://nextrep.app/workout/[id]"
    );
    expect(redactAnalyticsUrl("https://nextrep.app/unsubscribe?t=abc")).toBe("https://nextrep.app/unsubscribe");
    expect(redactAnalyticsUrl("https://nextrep.app/stats")).toBe("https://nextrep.app/stats");
  });
});
