import { describe, expect, it } from "vitest";

import {
  FEEDBACK_MAX_LENGTH,
  appVersion,
  buildFeedbackEmail,
  deviceLabel,
  feedbackPage,
  validateFeedbackMessage
} from "@/lib/feedback";

describe("validateFeedbackMessage", () => {
  it("trims and accepts a normal message", () => {
    expect(validateFeedbackMessage("  The timer froze  ")).toEqual({ ok: true, message: "The timer froze" });
  });

  it("rejects empty and over-long messages", () => {
    expect(validateFeedbackMessage("   ")).toEqual({ ok: false, error: "Write a message first." });
    expect(validateFeedbackMessage("x".repeat(FEEDBACK_MAX_LENGTH + 1)).ok).toBe(false);
  });

  it("strips control characters but keeps line breaks", () => {
    expect(validateFeedbackMessage("line one\nline two\u0007")).toEqual({ ok: true, message: "line one\nline two" });
  });
});

describe("feedbackPage", () => {
  it("keeps an in-app path and drops query strings", () => {
    expect(feedbackPage("/stats?tab=prs")).toBe("/stats");
    expect(feedbackPage("/coach")).toBe("/coach");
  });

  it("refuses anything that isn't a same-site path", () => {
    expect(feedbackPage("https://evil.example/x")).toBeNull();
    expect(feedbackPage("//evil.example")).toBeNull();
    expect(feedbackPage(null)).toBeNull();
  });
});

describe("deviceLabel", () => {
  it("summarizes common phones and browsers without the full user agent", () => {
    expect(
      deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")
    ).toBe("iPhone · Safari");
    expect(
      deviceLabel("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36")
    ).toBe("Android · Chrome");
    expect(
      deviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1")
    ).toBe("Mac · Chrome");
    expect(deviceLabel(null)).toBe("Unknown device");
  });
});

describe("appVersion", () => {
  it("joins the package version and the short commit", () => {
    expect(appVersion("1.0.0", "abcdef1234567")).toBe("1.0.0+abcdef1");
    expect(appVersion("1.0.0", undefined)).toBe("1.0.0");
  });
});

describe("buildFeedbackEmail", () => {
  it("includes the context and escapes the message in HTML", () => {
    const email = buildFeedbackEmail({
      message: "<b>Broken</b> on & off",
      page: "/stats",
      role: "athlete",
      teamName: "Varsity",
      appVersion: "1.0.0+abc1234",
      device: "iPhone · Safari",
      userId: "u1"
    });
    expect(email.subject).toBe("NextRep feedback (athlete, /stats)");
    expect(email.text).toContain("<b>Broken</b> on & off");
    expect(email.html).toContain("&lt;b&gt;Broken&lt;/b&gt; on &amp; off");
    expect(email.text).toContain("Team: Varsity");
    expect(email.text).toContain("Device: iPhone · Safari");
  });
});
