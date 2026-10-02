import { describe, expect, it } from "vitest";

import { latestStatsUpsert } from "@/lib/statsRow";

describe("latestStatsUpsert", () => {
  it("stamps updated_at with the save time, so 'last check-in' moves on every save", () => {
    const row = { date: "2026-10-02", sleep: 8 };
    expect(latestStatsUpsert("u1", row, new Date("2026-10-02T15:30:00Z"))).toEqual({
      user_id: "u1",
      date: "2026-10-02",
      sleep: 8,
      updated_at: "2026-10-02T15:30:00.000Z"
    });
  });

  it("gives a later save a later updated_at", () => {
    const first = latestStatsUpsert("u1", {}, new Date("2026-10-01T15:00:00Z"));
    const second = latestStatsUpsert("u1", {}, new Date("2026-10-04T15:00:00Z"));
    expect(Date.parse(second.updated_at)).toBeGreaterThan(Date.parse(first.updated_at));
  });
});
