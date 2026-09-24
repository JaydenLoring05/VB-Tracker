import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authErrorMessage, isDeadSessionError } from "@/lib/authErrors";
import { todayISO } from "@/lib/storage";
import { userFacingMessage } from "@/lib/supabaseErrors";
import { formatDuration, formatLastActive } from "@/lib/time";

describe("isDeadSessionError", () => {
  it("is false when there is no error", () => {
    expect(isDeadSessionError(null)).toBe(false);
    expect(isDeadSessionError(undefined)).toBe(false);
  });

  it.each([
    "refresh_token_not_found",
    "refresh_token_already_used",
    "session_not_found",
    "session_expired",
    "bad_jwt",
    "user_not_found"
  ])("treats code %s as a dead session", (code) => {
    expect(isDeadSessionError({ code })).toBe(true);
  });

  it("recognizes dead sessions by message when there is no code", () => {
    expect(isDeadSessionError({ message: "Invalid Refresh Token: Already Used" })).toBe(true);
    expect(isDeadSessionError({ message: "Invalid Refresh Token: Refresh Token Not Found" })).toBe(true);
  });

  it("never clears the session for transient network errors", () => {
    expect(isDeadSessionError({ name: "AuthRetryableFetchError", message: "fetch failed" })).toBe(false);
    // Even if a retryable error somehow carried a dead-session code.
    expect(isDeadSessionError({ name: "AuthRetryableFetchError", code: "session_expired" })).toBe(false);
    expect(isDeadSessionError({ status: 503, message: "Service unavailable" })).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("passes through Supabase's user-facing 4xx messages", () => {
    expect(authErrorMessage({ status: 400, message: "Invalid login credentials" })).toBe(
      "Invalid login credentials"
    );
  });

  it("hides network failures behind a connection message", () => {
    const expected = "Couldn't reach NextRep. Check your connection and try again.";
    expect(authErrorMessage({ name: "AuthRetryableFetchError", message: "x" })).toBe(expected);
    expect(authErrorMessage({ message: "Failed to fetch" })).toBe(expected);
    expect(authErrorMessage({ message: "NetworkError when attempting to fetch resource." })).toBe(expected);
  });

  it("maps rate limits to a wait message", () => {
    const expected = "Too many attempts. Wait a minute and try again.";
    expect(authErrorMessage({ status: 429, message: "raw" })).toBe(expected);
    expect(authErrorMessage({ code: "over_request_rate_limit", message: "raw" })).toBe(expected);
    expect(authErrorMessage({ code: "over_email_send_rate_limit", message: "raw" })).toBe(expected);
  });

  it("does not show server internals for 5xx or empty messages", () => {
    const expected = "Something went wrong on our end. Please try again.";
    expect(authErrorMessage({ status: 500, message: "pg: connection refused at 10.0.0.4" })).toBe(expected);
    expect(authErrorMessage({ status: 400 })).toBe(expected);
  });
});

describe("userFacingMessage", () => {
  it("shows deliberate P0001 messages from database functions", () => {
    expect(userFacingMessage({ code: "P0001", message: "Invalid invite code." }, "fallback")).toBe(
      "Invalid invite code."
    );
  });

  it("uses the fallback for everything else", () => {
    expect(userFacingMessage({ code: "42501", message: "permission denied for table x" }, "fallback")).toBe("fallback");
    expect(userFacingMessage({ code: "P0001" }, "fallback")).toBe("fallback");
    expect(userFacingMessage({}, "fallback")).toBe("fallback");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [5, "0:05"],
    [59, "0:59"],
    [60, "1:00"],
    [605, "10:05"],
    [3725, "62:05"]
  ])("%i seconds is %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe("formatLastActive", () => {
  const NOW = new Date("2026-07-20T12:00:00Z");
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
  const MIN = 60_000;
  const HOUR = 60 * MIN;

  it("handles a null timestamp", () => {
    expect(formatLastActive(null)).toBe("Never opened the app");
  });

  it.each([
    [30_000, "Just now"],
    [5 * MIN, "5 min ago"],
    [59 * MIN, "59 min ago"],
    [60 * MIN, "1h ago"],
    [23 * HOUR, "23h ago"],
    [24 * HOUR, "Opened yesterday"],
    [47 * HOUR, "Opened yesterday"],
    [48 * HOUR, "Opened 2d ago"],
    [10 * 24 * HOUR, "Opened 10d ago"]
  ])("%i ms ago reads %s", (elapsed, expected) => {
    expect(formatLastActive(ago(elapsed))).toBe(expected);
  });
});

describe("todayISO", () => {
  it("returns the local calendar date, not the UTC date", () => {
    // Constructed in local time, so this holds in every timezone.
    expect(todayISO(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    expect(todayISO(new Date(2026, 0, 5, 0, 30))).toBe("2026-01-05");
    expect(todayISO(new Date(2026, 11, 31, 12, 0))).toBe("2026-12-31");
  });

  it("does not mutate the date it is given", () => {
    const date = new Date(2026, 0, 5, 23, 30);
    const before = date.getTime();
    todayISO(date);
    expect(date.getTime()).toBe(before);
  });
});
