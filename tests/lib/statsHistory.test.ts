import { describe, expect, it } from "vitest";

import { computeAttentionItems } from "@/lib/attentionCenter";
import { latestEntryPerDay, normalizeStatDate, sameDayDateValues } from "@/lib/statsHistory";
import { fromStatsRow } from "@/lib/statsRow";

describe("normalizeStatDate", () => {
  it("keeps ISO dates", () => {
    expect(normalizeStatDate("2026-10-02")).toBe("2026-10-02");
  });

  it("converts the US format the app used to save", () => {
    expect(normalizeStatDate("10/2/2026")).toBe("2026-10-02");
    expect(normalizeStatDate("1/15/2026")).toBe("2026-01-15");
  });

  it("falls back to the row's created_at day", () => {
    expect(normalizeStatDate(null, "2026-10-02T15:00:00")).toBe("2026-10-02");
    expect(normalizeStatDate("", "2026-10-02T15:00:00")).toBe("2026-10-02");
    expect(normalizeStatDate("garbage", "2026-10-02T15:00:00")).toBe("2026-10-02");
  });

  it("returns an empty string when there is nothing to go on", () => {
    expect(normalizeStatDate(null)).toBe("");
  });
});

describe("latestEntryPerDay", () => {
  it("keeps the latest save of each day, in date order, with ISO dates", () => {
    const rows = [
      { id: "a", date: "10/1/2026", created_at: "2026-10-01T08:00:00Z", sleep: 6 },
      { id: "b", date: "10/1/2026", created_at: "2026-10-01T20:00:00Z", sleep: 8 },
      { id: "c", date: "2026-09-30", created_at: "2026-09-30T08:00:00Z", sleep: 7 },
      { id: "d", date: "2026-10-02", created_at: "2026-10-02T09:00:00Z", sleep: 9 }
    ];
    expect(latestEntryPerDay(rows).map((row) => [row.id, row.date])).toEqual([
      ["c", "2026-09-30"],
      ["b", "2026-10-01"],
      ["d", "2026-10-02"]
    ]);
  });

  it("treats the old and new date formats for the same day as one day", () => {
    const rows = [
      { id: "old", date: "10/2/2026", created_at: "2026-10-02T08:00:00Z" },
      { id: "new", date: "2026-10-02", created_at: "2026-10-02T09:00:00Z" }
    ];
    expect(latestEntryPerDay(rows).map((row) => row.id)).toEqual(["new"]);
  });

  it("uses array order to break ties when created_at is missing", () => {
    const rows = [
      { id: "first", date: "2026-10-02" },
      { id: "second", date: "2026-10-02" }
    ];
    expect(latestEntryPerDay(rows).map((row) => row.id)).toEqual(["second"]);
  });

  it("does not mutate its input", () => {
    const rows = [{ id: "a", date: "10/2/2026", created_at: "2026-10-02T08:00:00Z" }];
    latestEntryPerDay(rows);
    expect(rows[0].date).toBe("10/2/2026");
  });

  it("handles an empty history", () => {
    expect(latestEntryPerDay([])).toEqual([]);
  });
});

describe("sameDayDateValues", () => {
  it("lists today in both stored formats", () => {
    expect(sameDayDateValues(new Date(2026, 9, 2, 12))).toEqual(["2026-10-02", "10/2/2026"]);
  });
});

describe("pain streaks on history saved in the old date format", () => {
  it("are flagged once dates are normalized (they were silently missed before)", () => {
    const day = (date: string, createdAt: string) => ({
      date,
      created_at: createdAt,
      vertical: null, approach: null, weight: null, pullups: null,
      sleep: 8, energy: 7, stress: 3, soreness: 3, motivation: 8,
      knee_pain: 6, shoulder_pain: 0, lower_back_pain: 0, ankle_pain: 0
    });
    const rows = [
      day("9/30/2026", "2026-09-30T15:00:00Z"),
      day("10/1/2026", "2026-10-01T15:00:00Z"),
      day("10/2/2026", "2026-10-02T15:00:00Z")
    ];
    const athlete = {
      userId: "a", displayName: "Ava", joinedAt: "", recovery: 70, recoveryLabel: "Good",
      lastCheckIn: "2026-10-02T15:00:00Z", needsCheckIn: false, lastActiveAt: null
    };

    const raw = computeAttentionItems([athlete], { a: rows.map(fromStatsRow) }, { a: 3 }, {});
    expect(raw.some((item) => item.id === "a-pain")).toBe(false);

    const fixed = computeAttentionItems([athlete], { a: latestEntryPerDay(rows).map(fromStatsRow) }, { a: 3 }, {});
    expect(fixed.find((item) => item.id === "a-pain")?.reason).toBe("Reported knee pain 3 days running");
  });
});
