// Personal-record rules for Workout Mode. Pure so they can be unit tested
// without React or Supabase; useActiveWorkoutSession supplies the history.
//
// Weighted sets PR on weight; unweighted timed sets (planks, holds) PR on the
// longest hold. A tie is not a PR. With no history the previous best counts
// as 0, so any positive first-ever weight or hold is a PR.

export type PersonalRecordKind = "weight" | "hold";

export type HistoricalSet = {
  exercise: string;
  weight: number | null;
  seconds?: number | null;
};

export type BestMarks = {
  maxWeight: Record<string, number>;
  maxSeconds: Record<string, number>;
};

export function detectPersonalRecord({
  weight,
  seconds,
  previousMaxWeight,
  previousMaxSeconds
}: {
  weight: number | null;
  seconds: number | null;
  previousMaxWeight?: number;
  previousMaxSeconds?: number;
}): PersonalRecordKind | null {
  if (weight != null) return weight > (previousMaxWeight ?? 0) ? "weight" : null;
  if (seconds != null && seconds > (previousMaxSeconds ?? 0)) return "hold";
  return null;
}

// Heaviest weight and longest hold per exercise across previous sets.
export function bestMarksByExercise(rows: HistoricalSet[]): BestMarks {
  const maxWeight: Record<string, number> = {};
  const maxSeconds: Record<string, number> = {};

  rows.forEach((row) => {
    const seconds = row.seconds ?? null;
    if (row.weight != null && row.weight > (maxWeight[row.exercise] ?? 0)) {
      maxWeight[row.exercise] = row.weight;
    }
    if (seconds != null && seconds > (maxSeconds[row.exercise] ?? 0)) {
      maxSeconds[row.exercise] = seconds;
    }
  });

  return { maxWeight, maxSeconds };
}

// The PR board entry for a set that just became a record.
export function personalRecordEntry(
  kind: PersonalRecordKind,
  set: { exercise: string; weight: number | null; reps: number | null; seconds: number | null }
): { exercise: string; value: string; unit: string; note: string } {
  if (kind === "weight") {
    return {
      exercise: set.exercise,
      value: set.reps != null ? `${set.weight} x ${set.reps}` : String(set.weight),
      unit: "lbs",
      note: "Set during Workout Mode"
    };
  }
  return {
    exercise: set.exercise,
    value: String(set.seconds),
    unit: "sec",
    note: "Longest hold, set during Workout Mode"
  };
}
