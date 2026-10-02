import { describe, expect, it, vi } from "vitest";

import {
  REMINDER_TIME_ZONES,
  buildReminderEmail,
  formatReminderHour,
  isReminderTimeZone,
  parseUnsubscribeToken
} from "@/lib/checkInReminders";
import { sendSummaryEmail } from "@/lib/dailySummary";

const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const recipient = { display_name: "Ava <Thompson>", team_name: "Varsity & JV", unsubscribe_token: TOKEN };

describe("buildReminderEmail", () => {
  const email = buildReminderEmail(recipient, "https://nextrep.example/");

  it("greets by first name and names the team, escaped in HTML", () => {
    expect(email.subject).toBe("Quick check-in for Varsity & JV");
    expect(email.text).toContain("Hi Ava,");
    expect(email.html).toContain("Varsity &amp; JV");
    expect(email.html).not.toContain("<Thompson>");
  });

  it("has a one-tap link to the check-in", () => {
    expect(email.text).toContain("https://nextrep.example/check-in");
    expect(email.html).toContain('href="https://nextrep.example/check-in"');
  });

  it("has an unsubscribe link and one-click unsubscribe headers", () => {
    expect(email.text).toContain(`https://nextrep.example/unsubscribe?t=${TOKEN}`);
    expect(email.html).toContain(`https://nextrep.example/unsubscribe?t=${TOKEN}`);
    expect(email.headers).toEqual({
      "List-Unsubscribe": `<https://nextrep.example/api/reminders/unsubscribe?t=${TOKEN}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    });
  });

  it("falls back to a neutral greeting without a name", () => {
    expect(buildReminderEmail({ ...recipient, display_name: null }, "https://x.test").text).toContain("Hi there,");
  });

  it("contains no health data", () => {
    for (const word of ["readiness", "pain", "sleep score", "soreness"]) {
      expect(email.text.toLowerCase()).not.toContain(word);
    }
  });
});

describe("parseUnsubscribeToken", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(parseUnsubscribeToken(TOKEN)).toBe(TOKEN);
    expect(parseUnsubscribeToken(TOKEN.toUpperCase())).toBe(TOKEN);
    expect(parseUnsubscribeToken("not-a-token")).toBeNull();
    expect(parseUnsubscribeToken(null)).toBeNull();
  });
});

describe("reminder time options", () => {
  it("formats hours for people, not 24h clocks", () => {
    expect(formatReminderHour(0)).toBe("12 AM");
    expect(formatReminderHour(9)).toBe("9 AM");
    expect(formatReminderHour(12)).toBe("12 PM");
    expect(formatReminderHour(15)).toBe("3 PM");
  });

  it("offers real IANA time zones", () => {
    for (const zone of REMINDER_TIME_ZONES) {
      expect(() => new Intl.DateTimeFormat("en-US", { timeZone: zone.id })).not.toThrow();
    }
    expect(isReminderTimeZone("America/Chicago")).toBe(true);
    expect(isReminderTimeZone("Mars/Base")).toBe(false);
  });
});

describe("sendSummaryEmail headers", () => {
  it("passes custom headers through to Resend", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const config = { resendApiKey: "re", from: "NextRep <a@b.c>", cronSecret: "x", timeZone: "UTC" };
    await sendSummaryEmail(fetchFn, config, { to: "a@b.c", subject: "S", html: "H", text: "T", headers: { "X-Test": "1" } });
    expect(JSON.parse(fetchFn.mock.calls[0][1].body).headers).toEqual({ "X-Test": "1" });
  });
});
