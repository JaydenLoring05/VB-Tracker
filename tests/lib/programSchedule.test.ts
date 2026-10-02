import { describe, expect, it } from "vitest";

import {
  assignedDaysInWindow,
  countMissedAssignedDays,
  mondayOf,
  programWeekOn,
  startDateForWeek
} from "@/lib/programSchedule";

// 2026-10-05 is a Monday.
describe("mondayOf", () => {
  it("returns the same day for a Monday", () => {
    expect(mondayOf("2026-10-05")).toBe("2026-10-05");
  });

  it("goes back to Monday from mid-week and from Sunday", () => {
    expect(mondayOf("2026-10-08")).toBe("2026-10-05");
    expect(mondayOf("2026-10-11")).toBe("2026-10-05");
  });
});

describe("programWeekOn", () => {
  it("is week 1 for the whole first Monday-to-Sunday", () => {
    expect(programWeekOn("2026-10-05", "2026-10-05")).toBe(1);
    expect(programWeekOn("2026-10-05", "2026-10-11")).toBe(1);
  });

  it("counts later weeks", () => {
    expect(programWeekOn("2026-10-05", "2026-10-12")).toBe(2);
    expect(programWeekOn("2026-10-05", "2026-11-02")).toBe(5);
  });

  it("treats a mid-week start as starting that week", () => {
    expect(programWeekOn("2026-10-08", "2026-10-06")).toBe(1);
    expect(programWeekOn("2026-10-08", "2026-10-12")).toBe(2);
  });

  it("is null before the program started", () => {
    expect(programWeekOn("2026-10-05", "2026-10-04")).toBeNull();
  });
});

describe("startDateForWeek", () => {
  it("puts today in the chosen week", () => {
    const start = startDateForWeek(3, "2026-10-08");
    expect(start).toBe("2026-09-21");
    expect(programWeekOn(start, "2026-10-08")).toBe(3);
  });

  it("week 1 starts this Monday", () => {
    expect(startDateForWeek(1, "2026-10-11")).toBe("2026-10-05");
  });

  it("clamps nonsense weeks to 1", () => {
    expect(startDateForWeek(0, "2026-10-08")).toBe("2026-10-05");
  });
});

describe("assignedDaysInWindow", () => {
  // Trains Monday, Wednesday, Friday; everything else is rest.
  const isTrainingDay = (_week: number, day: string) => ["Monday", "Wednesday", "Friday"].includes(day);

  it("lists training days in the 7 days before today, not today", () => {
    const days = assignedDaysInWindow({
      startDate: "2026-09-28",
      today: "2026-10-08", // Thursday, week 2
      isTrainingDay
    });
    expect(days).toEqual([
      { date: "2026-10-02", week: 1, day: "Friday" },
      { date: "2026-10-05", week: 2, day: "Monday" },
      { date: "2026-10-07", week: 2, day: "Wednesday" }
    ]);
  });

  it("skips days before the program started", () => {
    const days = assignedDaysInWindow({ startDate: "2026-10-05", today: "2026-10-08", isTrainingDay });
    expect(days.map((d) => d.date)).toEqual(["2026-10-05", "2026-10-07"]);
  });

  it("skips weeks past the end of the program", () => {
    const days = assignedDaysInWindow({
      startDate: "2026-09-28",
      today: "2026-10-08",
      isTrainingDay,
      totalWeeks: 1
    });
    expect(days.map((d) => d.date)).toEqual(["2026-10-02"]);
  });

  it("is empty when the program starts in the future", () => {
    expect(assignedDaysInWindow({ startDate: "2026-11-02", today: "2026-10-08", isTrainingDay })).toEqual([]);
  });
});

describe("countMissedAssignedDays", () => {
  const assigned = [
    { date: "2026-10-02", week: 1, day: "Friday" },
    { date: "2026-10-05", week: 2, day: "Monday" },
    { date: "2026-10-07", week: 2, day: "Wednesday" }
  ];

  it("counts assigned days with no completed session for that week and day", () => {
    expect(countMissedAssignedDays(assigned, [{ week: 2, day: "Monday" }])).toEqual({ assigned: 3, missed: 2 });
  });

  it("counts a make-up session for the same week and day as done", () => {
    expect(
      countMissedAssignedDays(assigned, [
        { week: 1, day: "Friday" },
        { week: 2, day: "Monday" },
        { week: 2, day: "Wednesday" }
      ])
    ).toEqual({ assigned: 3, missed: 0 });
  });

  it("does not count sessions from a different week", () => {
    expect(countMissedAssignedDays(assigned, [{ week: 3, day: "Monday" }])).toEqual({ assigned: 3, missed: 3 });
  });

  it("handles nothing assigned", () => {
    expect(countMissedAssignedDays([], [{ week: 1, day: "Monday" }])).toEqual({ assigned: 0, missed: 0 });
  });
});
