import {
  addImportNote,
  exerciseFromCells,
  ImportedDays,
  ImportedPlan,
  ImportNotes,
  importedPlan,
  ProgramSection,
  readTarget,
  readWeekday,
  type Weekday
} from "@/lib/customProgram";

/**
 * Reads a coach's training sheet (a grid of cells from a .csv, a pasted
 * range, an .xlsx or a table in a .docx) into days.
 *
 * Coaches' sheets aren't one table with one header row. A real one has
 * several blocks side by side with an empty column between them, each block
 * three columns (exercise, sets, reps) or two (exercise, "WU + 5 x 5"). So
 * this doesn't look for a header: it finds exercise rows anywhere, groups
 * them by the column they start in, and reads each block's days:
 *
 * - a weekday in the block's exercise column ("Monday:", "Wed", "Thursday/
 *   Day 3") starts that day for the rows under it;
 * - a weekday in the column just left of the block ("Mon" next to a run of
 *   lifts, often beside or just after it) names the nearest run of rows;
 * - a block with no weekday at all (warm-ups, abs) goes on every training day;
 * - a label with nothing after it ("Warm-Ups - Legs", "Abs - Pick One")
 *   starts a named section;
 * - a "*" cell is a note on the exercise right above it;
 * - when a block comes back to a day it already filled (week 2 of a
 *   week-by-week plan), the later weeks are left out and listed, since a
 *   program is one repeating week.
 */

/** Cells that head a block rather than name an exercise. */
const HEADER = /^(?:exercises?(?:\s+movements?)?.*|sets?(?:\s*x\s*reps)?|reps|weight|lbs|max|warm\s*up|set\s*\d+|\*)$/i;

type Hit = {
  row: number;
  name: string;
  sets: number;
  reps: string;
  warmupSet: boolean;
  /** Cells the row uses: 3 for name, sets, reps; 2 for name and one "5 x 5" cell. */
  width: 2 | 3;
};

/** The exercise a row has at column c, if the cells there read as name + sets (+ reps). */
function readHit(row: string[], c: number): Omit<Hit, "row"> | null {
  const name = row[c] ?? "";
  const next = row[c + 1] ?? "";
  if (!isNameLike(name) || next === "") return null;
  if (/^\d{1,2}$/.test(next)) {
    const sets = Number(next);
    return sets >= 1 && sets <= 20 ? { name, sets, reps: row[c + 2] ?? "", warmupSet: false, width: 3 } : null;
  }
  // One "Sets x Reps" cell that is only the target: "WU + 5 x 5", "3x8".
  const target = readTarget(next);
  return target && target.at === 0
    ? { name, sets: target.sets, reps: target.reps, warmupSet: target.warmupSet, width: 2 }
    : null;
}

function isNameLike(text: string): boolean {
  return (
    text !== "" &&
    !/^[\d.\s]+$/.test(text) &&
    !HEADER.test(text) &&
    !text.startsWith("*") &&
    readWeekday(text) == null
  );
}

/** Splits CSV text into rows of cells. Handles quotes, doubled quotes and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Splits pasted spreadsheet cells (tab-separated) into rows. */
export function parseTabs(text: string): string[][] {
  return text.split(/\r?\n/).map((line) => line.split("\t"));
}

/** Reads a grid of cells into days. See the comment at the top of this file. */
export function readProgramSheet(grid: unknown[][]): ImportedPlan {
  const rows = grid.map((row) => row.map((cell) => (cell == null ? "" : String(cell).trim())));
  const hits = new Map<number, Hit[]>();

  // 1. Every exercise row, by the column its name is in.
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const hit = readHit(row, c);
      if (!hit) continue;
      hits.set(c, [...(hits.get(c) ?? []), { row: r, ...hit }]);
      c += hit.width - 1; // Its sets and reps cells aren't names.
    }
  });

  const columns = [...hits.keys()].sort((a, b) => a - b);
  const notes: ImportNotes = {};
  const leftOut: string[] = [];
  const everyDay: ProgramSection[] = [];
  const byDay: ImportedDays = new Map();

  // 2. Each block's rows, in order, into sections on their days.
  for (const column of columns) {
    const block = readBlock(rows, column, hits.get(column)!, columns);
    for (const note of block.unplacedNotes) leftOut.push(`A note with no exercise above it: "${note}"`);
    if (block.skipped.size > 0) {
      leftOut.push(
        `${block.skipped.size} rows from later weeks. A program is one repeating week, so the first week came in.`
      );
    }
    for (const [hit, note] of block.notes) {
      if (!block.skipped.has(hit.row)) addImportNote(notes, block.days.get(hit.row) ?? null, hit.name, note);
    }

    // A label starts a section; a new day starts a fresh one.
    let current: { day: Weekday | null; section: ProgramSection } | null = null;
    let label = "";
    for (const event of block.events) {
      if (event.kind === "label") {
        current = null;
        label = event.text;
        continue;
      }
      const { hit } = event;
      if (block.skipped.has(hit.row)) continue;
      const day = block.days.get(hit.row) ?? null;
      if (!current || current.day !== day) {
        const section: ProgramSection = { name: label, exercises: [] };
        (day ? daySections(byDay, day) : everyDay).push(section);
        current = { day, section };
      }
      current.section.exercises.push(exerciseFromCells(hit.name, hit.sets, hit.reps));
      if (hit.warmupSet) addImportNote(notes, day, hit.name, "Warm-up set first.");
    }
  }

  // 3. A plain list with no weekdays anywhere is one day, like a pasted list.
  if (byDay.size === 0 && everyDay.length > 0) {
    byDay.set("Monday", { title: "", sections: everyDay.splice(0) });
    if (notes["every day"]) notes.Monday = notes["every day"];
  }

  // Parts of one day from different blocks (barbell lifts beside accessory work) read as one list.
  for (const entry of byDay.values()) entry.sections = mergeUnnamed(entry.sections);
  return importedPlan(byDay, everyDay, notes, leftOut);
}

function daySections(byDay: ImportedDays, day: Weekday): ProgramSection[] {
  const entry = byDay.get(day) ?? { title: "", sections: [] };
  byDay.set(day, entry);
  return entry.sections;
}

/** Joins unnamed sections that end up next to each other into one. */
function mergeUnnamed(sections: ProgramSection[]): ProgramSection[] {
  const merged: ProgramSection[] = [];
  for (const section of sections) {
    const last = merged[merged.length - 1];
    if (last && last.name === "" && section.name === "") last.exercises.push(...section.exercises);
    else merged.push({ ...section, exercises: [...section.exercises] });
  }
  return merged;
}

type BlockEvent = { kind: "label"; row: number; text: string } | { kind: "hit"; row: number; hit: Hit };

type DayCell = { row: number; day: Weekday };

/** One block's rows read in order: which day each exercise is on, its notes, and what's left out. */
function readBlock(rows: string[][], column: number, hits: Hit[], blockColumns: number[]) {
  const hitAt = new Map(hits.map((hit) => [hit.row, hit]));
  const lastRow = hits[hits.length - 1].row;
  const inline: DayCell[] = [];
  const side: DayCell[] = [];
  const events: BlockEvent[] = [];
  const notes: [Hit, string][] = [];
  const unplacedNotes: string[] = [];
  // The column just left of a block can hold its day labels, unless it's another block's.
  const sideColumn = column > 0 && !blockColumns.includes(column - 1) ? column - 1 : null;

  rows.forEach((row, r) => {
    const text = row[column] ?? "";
    const hit = hitAt.get(r);
    if (hit) {
      events.push({ kind: "hit", row: r, hit });
    } else if (text !== "") {
      const weekday = readWeekday(text);
      if (weekday) {
        inline.push({ row: r, day: weekday.day });
      } else if (text.startsWith("*")) {
        const note = text.replace(/^\*+\s*/, "");
        const above = hitAt.get(r - 1);
        if (above) notes.push([above, note]);
        else unplacedNotes.push(note);
      } else if (!HEADER.test(text) && (row[column + 1] ?? "") === "" && r < lastRow) {
        events.push({ kind: "label", row: r, text });
      }
    }
    if (sideColumn != null) {
      const weekday = readWeekday(row[sideColumn] ?? "");
      if (weekday && weekday.rest === "") side.push({ row: r, day: weekday.day });
    }
  });

  const days = new Map<number, Weekday>();
  if (inline.length > 0) {
    // A weekday in the exercise column labels the rows under it.
    for (const hit of hits) {
      const above = inline.filter((cell) => cell.row < hit.row).pop();
      if (above) days.set(hit.row, above.day);
    }
  } else if (side.length > 0) {
    // A weekday beside the block labels the nearest run of rows: it's often in the
    // middle of the run, or on the row just after it. On a tie, the one below wins.
    for (const run of runsOf(hits.map((hit) => hit.row))) {
      const first = run[0];
      const last = run[run.length - 1];
      for (const r of run) {
        const near = side
          .filter((cell) => cell.row >= first - 1 && cell.row <= last + 1)
          .sort((a, b) => Math.abs(a.row - r) - Math.abs(b.row - r) || b.row - a.row)[0];
        if (near) days.set(r, near.day);
      }
    }
  }

  // The first week wins: when the block comes back to a day it already filled, skip that stretch.
  // With weekdays beside the block, a later stretch with no weekday at all ("Day 10") is a later
  // week too, not something for every day.
  const skipped = new Set<number>();
  const filled = new Set<Weekday>();
  let stretch: Weekday | null = null;
  let skipping = false;
  for (const hit of hits) {
    const day = days.get(hit.row) ?? null;
    if (day !== stretch) {
      if (stretch) filled.add(stretch);
      stretch = day;
      skipping = day != null ? filled.has(day) : inline.length === 0 && filled.size > 0;
    }
    if (skipping) skipped.add(hit.row);
  }

  return { events, days, notes, unplacedNotes, skipped };
}

/** Consecutive row numbers grouped into runs: [1,2,3,7,8] -> [[1,2,3],[7,8]]. */
function runsOf(rowNumbers: number[]): number[][] {
  const runs: number[][] = [];
  for (const r of rowNumbers) {
    const run = runs[runs.length - 1];
    if (run && r === run[run.length - 1] + 1) run.push(r);
    else runs.push([r]);
  }
  return runs;
}
