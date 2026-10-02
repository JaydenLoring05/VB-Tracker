import type { StatEntry } from "@/types";

// A stats_history / latest_stats row as stored, and its app-side shape.

export type StatsRow = {
  date: string | null;
  vertical: number | null;
  approach: number | null;
  weight: number | null;
  pullups: number | null;
  sleep: number | null;
  knee_pain: number | null;
  shoulder_pain: number | null;
  soreness: number | null;
  energy: number | null;
  stress: number | null;
  lower_back_pain: number | null;
  ankle_pain: number | null;
  motivation: number | null;
};

export function fromStatsRow(row: StatsRow): StatEntry {
  return {
    date: row.date ?? "",
    vertical: row.vertical ?? "",
    approach: row.approach ?? "",
    weight: row.weight ?? "",
    pullups: row.pullups ?? "",
    sleep: row.sleep ?? "",
    kneePain: row.knee_pain ?? "",
    shoulderPain: row.shoulder_pain ?? "",
    soreness: row.soreness ?? "",
    energy: row.energy ?? "",
    stress: row.stress ?? "",
    lowerBackPain: row.lower_back_pain ?? "",
    anklePain: row.ankle_pain ?? "",
    motivation: row.motivation ?? ""
  };
}

/**
 * The latest_stats upsert for a save. latest_stats.updated_at has only a
 * column default (set on insert), and nothing refreshed it on update, so it
 * stayed at the athlete's first check-in forever. The coach roster reads it
 * as "last check-in", so every athlete looked overdue after three days.
 * Stamping it on each save fixes that.
 */
export function latestStatsUpsert<T extends object>(
  userId: string,
  row: T,
  now: Date = new Date()
): T & { user_id: string; updated_at: string } {
  return { user_id: userId, ...row, updated_at: now.toISOString() };
}
