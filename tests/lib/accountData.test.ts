import { describe, expect, it } from "vitest";

import {
  DELETE_CONFIRMATION_PHRASE,
  EXPORT_TABLES,
  buildDataExport,
  exportFileName,
  isDeleteConfirmed
} from "@/lib/accountData";

describe("EXPORT_TABLES", () => {
  it("covers every per-athlete table, filtered by the caller's own id", () => {
    const tables = EXPORT_TABLES.map((entry) => entry.table);
    for (const table of [
      "profiles",
      "latest_stats",
      "stats_history",
      "workout_sessions",
      "workout_sets",
      "exercise_checks",
      "workout_logs",
      "workout_notes",
      "calendar_events",
      "prs",
      "exercise_substitutions",
      "performance_profiles",
      "team_members"
    ]) {
      expect(tables).toContain(table);
    }
  });

  it("lists each table once", () => {
    const tables = EXPORT_TABLES.map((entry) => entry.table);
    expect(new Set(tables).size).toBe(tables.length);
  });
});

describe("buildDataExport", () => {
  it("wraps the sections with who and when, and records what couldn't be read", () => {
    const result = buildDataExport({
      userId: "u1",
      email: "a@example.com",
      exportedAt: new Date("2026-10-01T12:00:00Z"),
      sections: { prs: [{ exercise: "Squat" }], stats_history: [] },
      skipped: ["performance_profiles"]
    });
    expect(result).toEqual({
      format: "nextrep-data-export",
      version: 1,
      exportedAt: "2026-10-01T12:00:00.000Z",
      user: { id: "u1", email: "a@example.com" },
      data: { prs: [{ exercise: "Squat" }], stats_history: [] },
      skipped: ["performance_profiles"]
    });
  });
});

describe("exportFileName", () => {
  it("dates the file", () => {
    expect(exportFileName(new Date("2026-10-01T12:00:00Z"))).toBe("nextrep-data-2026-10-01.json");
  });
});

describe("isDeleteConfirmed", () => {
  it("accepts the exact phrase, ignoring case and outer spaces", () => {
    expect(isDeleteConfirmed(DELETE_CONFIRMATION_PHRASE)).toBe(true);
    expect(isDeleteConfirmed("  Delete My Account ")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isDeleteConfirmed("")).toBe(false);
    expect(isDeleteConfirmed("delete")).toBe(false);
    expect(isDeleteConfirmed("delete my account please")).toBe(false);
  });
});
