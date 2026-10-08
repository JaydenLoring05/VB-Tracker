import { StatEntry } from "@/types";

/** One day in the coach's recovery history table: the check-in plus its readiness score. */
export type RecoveryRow = StatEntry & { recovery: number; recoveryLabel: string };

export type StatsColumn = {
  /** Header text. Shown in small capitals. */
  label: string;
  /** The longest text a cell in this column has to hold on one line. */
  widest: string;
};

export type RecoveryColumn = StatsColumn & {
  key: string;
  value: (row: RecoveryRow) => string;
};

// Widest a character comes to in each style, measured in the browser with the app's font:
// headers are 11px bold capitals with 0.1em tracking, cells are 13px with tabular figures.
const HEADER_CHAR_PX = 8.5;
const CELL_CHAR_PX = 8;

const orDash = (value: number | string) => (value ? String(value) : "-");

/** Columns of the recovery history table, left to right. */
export const RECOVERY_COLUMNS: RecoveryColumn[] = [
  { key: "date", label: "Date", widest: "2026-10-01", value: (row) => orDash(row.date) },
  {
    key: "recovery",
    label: "Recovery",
    widest: "69% · Caution",
    value: (row) => `${row.recovery}% · ${row.recoveryLabel}`
  },
  { key: "sleep", label: "Sleep", widest: "10.5", value: (row) => orDash(row.sleep) },
  { key: "stress", label: "Stress", widest: "10", value: (row) => orDash(row.stress) },
  { key: "motivation", label: "Motivation", widest: "10", value: (row) => orDash(row.motivation) },
  { key: "soreness", label: "Soreness", widest: "10", value: (row) => orDash(row.soreness) },
  { key: "kneePain", label: "Knee", widest: "10", value: (row) => orDash(row.kneePain) },
  { key: "shoulderPain", label: "Shoulder", widest: "10", value: (row) => orDash(row.shoulderPain) },
  { key: "lowerBackPain", label: "Low Back", widest: "10", value: (row) => orDash(row.lowerBackPain) },
  { key: "anklePain", label: "Ankle", widest: "10", value: (row) => orDash(row.anklePain) }
];

/** Width in px that fits both the header and the widest cell on one line. */
export function columnWidth(column: StatsColumn): number {
  return Math.ceil(Math.max(column.label.length * HEADER_CHAR_PX, column.widest.length * CELL_CHAR_PX));
}

/**
 * `grid-template-columns` value for a table whose header and rows are separate grids. Fixed
 * tracks keep them lined up; the table scrolls sideways when the tracks are wider than it is.
 */
export function gridTemplate(columns: StatsColumn[]): string {
  return columns.map((column) => `${columnWidth(column)}px`).join(" ");
}
