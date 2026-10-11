/**
 * Made-up training sheets in the same shapes as a real pilot coach's plans
 * (the real ones are not in this repo). Every exercise, label and note here is
 * invented; only the layout matches.
 */

/** A grid with cells placed by row and column, like a spreadsheet. */
function grid(rows: number, columns: number) {
  const cells: string[][] = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ""));
  return {
    cells,
    /** Puts values into one row, starting at a column. */
    put(row: number, column: number, ...values: (string | number)[]) {
      values.forEach((value, i) => (cells[row][column + i] = String(value)));
    }
  };
}

/**
 * Three-column blocks side by side with an empty column between them:
 * an every-day block (warm-ups, core) on the left with labels, a "Pick One"
 * group and a note; two day blocks whose weekday cells start each day,
 * one of them halfway down; an empty "Tuesday" and an empty "Friday".
 */
export function blocksSheet(): string[][] {
  const g = grid(26, 11);
  g.put(0, 0, "Exercise Movement", "Sets", "Reps");
  g.put(0, 4, "Monday:");
  g.put(0, 8, "Tuesday");
  g.put(1, 0, "WARMUPS");
  g.put(2, 0, "Warm-Ups - Hips");
  g.put(3, 0, "Hip Circles", 2, "10 each way");
  g.put(4, 0, "Jog (Backwards)", 1);
  g.put(5, 0, "Warm-Ups - Jumps - Pick One");
  g.put(6, 0, "Pogo Hops", 2, 20);
  g.put(7, 0, "Tuck Jumps", 2, 8);
  g.put(8, 0, "*soft landings, quiet feet.");

  g.put(1, 4, "Goblet Squat", 3, "10");
  g.put(2, 4, "Band Pull-Apart", 3, "15 reps per side");
  g.put(3, 4, "Pigeon Stretch", 2, "1 min per side");
  g.put(4, 4, "Wall Sit", 2, "45 sec");

  g.put(10, 4, "Wednesday");
  g.put(11, 4, "Step-Down", 3, "8 reps each leg");
  g.put(12, 4, "Hanging Knee Raise", 3, "");

  g.put(10, 8, "Thursday/ Day 3");
  g.put(11, 8, "Exercise Movements");
  g.put(12, 8, "Lateral Lunge", 3, "6 reps per side");
  g.put(13, 8, "Seated Row", 3, "12");

  g.put(14, 0, "CORE");
  g.put(15, 0, "Core (Front) - Pick One");
  g.put(16, 0, "Hollow Hold", 1);
  g.put(17, 0, "Dead Bug", 1, 30);
  g.put(18, 0, "Core (Side) - Pick One");
  g.put(19, 0, "Side Plank", 1, "");
  g.put(20, 0, "Copenhagen Plank", 1, "");

  g.put(22, 4, "Friday");
  return g.cells;
}

/**
 * A week-by-week barbell sheet: an every-day block in column 1, lifts in
 * column 6 with one "Sets x Reps" cell ("WU + 5 x 5") and weight columns,
 * and the day names in column 5 beside each run of lifts (not above it:
 * "Mon" sits on the row after its lifts). Week 1 is Mon, Wed, Thurs; week 2
 * repeats them; week 3 only says "Day 7". An accessory block in column 12
 * has its weekdays above its rows, on the same days. Notes trail at the end.
 */
export function barbellSheet(): string[][] {
  const g = grid(40, 16);
  g.put(0, 1, "WARMUPS");
  g.put(0, 5, "*", "Exercise", "Sets x Reps", "Warm Up", "Set 1", "Set 2");
  g.put(1, 1, "Warm-Ups - Shoulders");
  g.put(2, 1, "Arm Circles", 1, "20");
  g.put(3, 1, "Band Dislocates", 2, "10");

  // Week 1
  const lifts = (row: number, rdlTarget = "WU + 5 x 5") => {
    g.put(row, 6, "Power Clean", "WU + 5 x 5", 0, 0, 0);
    g.put(row + 1, 6, "Front Squat", "WU + 5 x 5", 0, 0, 0);
    g.put(row + 2, 6, "Push Jerk", "WU + 5 x 5", 0, 0, 0);
    g.put(row + 3, 6, "Trap Bar Deadlift", rdlTarget, 0, 0, 0);
  };
  lifts(1);
  g.put(2, 5, "Wk1");
  g.put(4, 5, "Day 1");
  g.put(5, 5, "Mon");
  lifts(7, "WU + 3 x 8");
  g.put(7, 5, "Day 2");
  g.put(8, 5, "Wed");
  lifts(13);
  g.put(13, 5, "Day 3");
  g.put(14, 5, "Thurs");

  // Week 2 runs straight on with no gaps; week 3 only numbers its days.
  g.put(18, 6, "Exercise", "Sets x Reps");
  lifts(19);
  g.put(19, 5, "Wk2");
  g.put(21, 5, "Day 4");
  g.put(22, 5, "Mon");
  lifts(23);
  g.put(24, 5, "Day 5");
  g.put(25, 5, "Wed");
  lifts(27);
  g.put(27, 5, "Day 7");

  g.put(33, 6, "*Easy week: move, but nothing heavy");
  g.put(34, 6, "*Send me your new numbers");

  // Accessory work, weekdays above the rows, beside the lifts.
  g.put(1, 12, "Monday");
  g.put(2, 12, "Nordic Curl", 2, "5");
  g.put(3, 12, "Calf Raise", 2, "15");
  g.put(7, 12, "Wed");
  g.put(8, 12, "Face Pull", 2, "15");
  g.put(13, 12, "Thurs");
  g.put(14, 12, "Copenhagen Plank", 2, "20 secs each side");

  g.put(10, 1, "Core - Pick One");
  g.put(11, 1, "Sit-Ups", 1, 40);
  g.put(12, 1, "V-Ups", 1, 25);
  g.put(14, 1, "*warm-up sets can be skipped.");
  return g.cells;
}

/** A grid as CSV text the way a spreadsheet exports it: every cell quoted. */
export function toCsv(cells: string[][]): string {
  return cells.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}
