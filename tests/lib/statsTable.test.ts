import { describe, expect, it } from "vitest";

import { recoveryStatus } from "@/lib/recovery";
import { columnWidth, gridTemplate, RECOVERY_COLUMNS, RecoveryRow } from "@/lib/statsTable";

// Text widths in px, measured in Chromium with the real styles and Manrope: headers are 11px,
// weight 700, uppercase, 0.1em tracking; cells are 13px with tabular figures.
const MEASURED_HEADER_PX: Record<string, number> = {
  Date: 32,
  Recovery: 66,
  Sleep: 39,
  Stress: 49,
  Motivation: 78,
  Soreness: 67,
  Knee: 33,
  Shoulder: 68,
  "Low Back": 65,
  Ankle: 41
};
const MEASURED_ISO_DATE_PX = 76;
const MEASURED_WIDEST_RECOVERY_PX = 84; // "64% · Caution"

function row(values: Partial<RecoveryRow> = {}): RecoveryRow {
  return {
    date: "2026-10-01",
    vertical: "",
    approach: "",
    weight: "",
    pullups: "",
    sleep: 7.5,
    energy: "",
    stress: 4,
    soreness: 4,
    kneePain: 5,
    shoulderPain: "",
    lowerBackPain: "",
    anklePain: "",
    motivation: 9,
    recovery: 79,
    recoveryLabel: "Good",
    ...values
  };
}

function column(label: string) {
  const found = RECOVERY_COLUMNS.find((c) => c.label === label);
  if (!found) throw new Error(`no ${label} column`);
  return found;
}

describe("recovery history table columns", () => {
  it("keeps the ten columns coaches see, in order", () => {
    expect(RECOVERY_COLUMNS.map((c) => c.label)).toEqual(Object.keys(MEASURED_HEADER_PX));
  });

  it("makes every column at least as wide as its header", () => {
    for (const col of RECOVERY_COLUMNS) {
      expect(columnWidth(col), col.label).toBeGreaterThanOrEqual(MEASURED_HEADER_PX[col.label]);
    }
  });

  it("no longer squeezes long headers into 60px, where they ran into each other", () => {
    for (const label of ["Motivation", "Soreness", "Shoulder", "Low Back"]) {
      expect(columnWidth(column(label)), label).toBeGreaterThan(60);
    }
  });

  it("leaves room for a new or renamed header without measuring it", () => {
    // 8.5px a character is the widest any of the measured headers comes to.
    for (const col of RECOVERY_COLUMNS) {
      expect(columnWidth(col), col.label).toBeGreaterThanOrEqual(col.label.length * 8.5);
    }
    expect(columnWidth({ label: "Hip Flexor Pain", widest: "10" })).toBeGreaterThanOrEqual(15 * 8.5);
  });

  it("fits a full date on one line", () => {
    expect(columnWidth(column("Date"))).toBeGreaterThanOrEqual(MEASURED_ISO_DATE_PX);
  });

  it("fits the longest recovery score and label on one line", () => {
    const longest = Array.from({ length: 101 }, (_, score) => `${score}% · ${recoveryStatus(score).label}`).reduce(
      (a, b) => (b.length > a.length ? b : a)
    );
    const recovery = column("Recovery");

    expect(recovery.widest.length).toBeGreaterThanOrEqual(longest.length);
    expect(columnWidth(recovery)).toBeGreaterThanOrEqual(MEASURED_WIDEST_RECOVERY_PX);
  });

  it("builds one fixed track per column so the header lines up with every row", () => {
    const tracks = gridTemplate(RECOVERY_COLUMNS).split(" ");

    expect(tracks).toHaveLength(RECOVERY_COLUMNS.length);
    expect(tracks).toEqual(RECOVERY_COLUMNS.map((col) => `${columnWidth(col)}px`));
    for (const track of tracks) expect(track).toMatch(/^\d+px$/);
  });
});

describe("recovery history table cells", () => {
  it("shows the same values as before", () => {
    expect(RECOVERY_COLUMNS.map((col) => col.value(row()))).toEqual([
      "2026-10-01",
      "79% · Good",
      "7.5",
      "4",
      "9",
      "4",
      "5",
      "-",
      "-",
      "-"
    ]);
  });

  it("shows a dash for a missing date, a blank answer and a pain score of 0", () => {
    const cells = RECOVERY_COLUMNS.map((col) => col.value(row({ date: "", sleep: "", kneePain: 0 })));

    expect(cells[0]).toBe("-");
    expect(cells[2]).toBe("-");
    expect(cells[6]).toBe("-");
  });

  it("never shows a value wider than its column was sized for", () => {
    const full = row({
      sleep: 10.5,
      stress: 10,
      motivation: 10,
      soreness: 10,
      kneePain: 10,
      shoulderPain: 10,
      lowerBackPain: 10,
      anklePain: 10,
      recovery: 64,
      recoveryLabel: "Caution"
    });

    for (const col of RECOVERY_COLUMNS) {
      expect(col.value(full).length, col.label).toBeLessThanOrEqual(col.widest.length);
    }
  });
});
