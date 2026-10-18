import { describe, expect, it } from "vitest";

import { isAppleMobile, pushSupport, urlBase64ToUint8Array } from "@/lib/pushClient";
import { buildPushReminder, isGoneStatus, PUSH_HOURS, readPushConfig } from "@/lib/pushReminders";

describe("readPushConfig", () => {
  it("is off until all three keys are set", () => {
    expect(readPushConfig({})).toBeNull();
    expect(readPushConfig({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv" })).toBeNull();
  });

  it("adds mailto: to a bare email subject", () => {
    expect(
      readPushConfig({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "me@x.com" })
    ).toEqual({ publicKey: "pub", privateKey: "priv", subject: "mailto:me@x.com" });
    expect(
      readPushConfig({ NEXT_PUBLIC_VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "https://x.com" })
        ?.subject
    ).toBe("https://x.com");
  });
});

describe("buildPushReminder", () => {
  it("matches what's left to do and opens the right page", () => {
    expect(buildPushReminder({ display_name: "Maya Chen", needs_check_in: true, needs_workout: true })).toMatchObject({
      title: "Check in, then train",
      url: "/check-in"
    });
    expect(buildPushReminder({ needs_check_in: true, needs_workout: false })).toMatchObject({
      title: "Daily check-in",
      url: "/check-in"
    });
    expect(buildPushReminder({ display_name: null, needs_check_in: false, needs_workout: true })).toMatchObject({
      title: "Today's workout is waiting",
      url: "/dashboard"
    });
  });

  it("uses the first name only and keeps markup out", () => {
    expect(buildPushReminder({ display_name: "<b>Jay</b> L", needs_check_in: true, needs_workout: false }).body).toMatch(
      /^bJay\/b, /
    );
  });
});

describe("isGoneStatus", () => {
  it("treats 404 and 410 as a dead subscription", () => {
    expect(isGoneStatus(410)).toBe(true);
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(500)).toBe(false);
    expect(isGoneStatus(undefined)).toBe(false);
  });
});

describe("PUSH_HOURS", () => {
  it("runs 6 AM to 10 PM", () => {
    expect(PUSH_HOURS[0]).toEqual({ hour: 6, label: "6 AM" });
    expect(PUSH_HOURS.find((h) => h.hour === 12)?.label).toBe("12 PM");
    expect(PUSH_HOURS.at(-1)).toEqual({ hour: 22, label: "10 PM" });
  });
});

describe("pushSupport", () => {
  const android = { userAgent: "Mozilla/5.0 (Linux; Android 14)", serviceWorker: {} };
  const iphone = { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", serviceWorker: {} };
  const base = { standalone: false, hasPushManager: true, hasNotification: true, permission: "default", publicKey: "k" };

  it("is ready on a phone browser that supports push", () => {
    expect(pushSupport({ ...base, nav: android })).toBe("supported");
  });

  it("asks iPhone users to add NextRep to the home screen first", () => {
    expect(pushSupport({ ...base, nav: iphone, hasPushManager: false })).toBe("needs-home-screen");
    expect(pushSupport({ ...base, nav: iphone, standalone: true })).toBe("supported");
  });

  it("spots iPads that report a Mac", () => {
    expect(isAppleMobile({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", maxTouchPoints: 5 })).toBe(true);
    expect(isAppleMobile({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)", maxTouchPoints: 0 })).toBe(false);
  });

  it("reports blocked, missing support, and missing server keys", () => {
    expect(pushSupport({ ...base, nav: android, permission: "denied" })).toBe("blocked");
    expect(pushSupport({ ...base, nav: android, hasPushManager: false })).toBe("unsupported");
    expect(pushSupport({ ...base, nav: android, publicKey: undefined })).toBe("unsupported");
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes URL-safe base64 without padding", () => {
    expect([...urlBase64ToUint8Array("AQID_-8")]).toEqual([1, 2, 3, 255, 239]);
  });
});
