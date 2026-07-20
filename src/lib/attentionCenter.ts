import { calculateRecovery } from "@/lib/recovery";
import { RosterAthlete, StatEntry } from "@/types";

export type AttentionPriority = "high" | "medium" | "positive";

export type AttentionItem = {
  id: string;
  userId: string;
  displayName: string;
  priority: AttentionPriority;
  reason: string;
  action: string;
  signalDate: string;
};

const PAIN_FIELDS: { key: "kneePain" | "shoulderPain" | "lowerBackPain" | "anklePain"; label: string }[] = [
  { key: "kneePain", label: "knee" },
  { key: "shoulderPain", label: "shoulder" },
  { key: "lowerBackPain", label: "lower back" },
  { key: "anklePain", label: "ankle" }
];

// Deliberately a lower, coach-visibility threshold than the athlete-facing
// severePainBodyParts() guardrail in recovery.ts (which uses 8/10 and
// protects what the athlete's own screen tells them). This one flags a
// coach's roster earlier, at a level worth a check-in rather than a
// medical redirect.
const ATTENTION_PAIN_THRESHOLD = 4;
const READINESS_DROP_THRESHOLD = 20;
const MIN_WEEKLY_WORKOUTS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Body parts with pain >= ATTENTION_PAIN_THRESHOLD on each of the athlete's
 * last 3 check-ins, where those 3 check-ins fall on 3 distinct, consecutive
 * calendar days.
 */
function consecutiveDayPainFlags(history: StatEntry[]): string[] {
  if (history.length < 3) return [];

  const last3 = history.slice(-3).filter((entry) => entry.date);
  if (last3.length < 3) return [];

  const days = last3.map((entry) => new Date(`${entry.date}T00:00:00`).getTime());
  const consecutive = days.every(
    (time, index) => index === 0 || Math.abs(time - days[index - 1] - DAY_MS) < 60 * 60 * 1000
  );
  if (!consecutive) return [];

  return PAIN_FIELDS.filter(({ key }) => last3.every((entry) => Number(entry[key]) >= ATTENTION_PAIN_THRESHOLD)).map(
    ({ label }) => label
  );
}

/**
 * Rolling 7-day average readiness score vs. the prior 7-day average.
 * Returns null (not enough data, or no drop) rather than 0 so callers can
 * tell "nothing to flag" apart from "flat/improving."
 */
function readinessDrop(history: StatEntry[]): number | null {
  const dated = history.filter((entry) => entry.date);
  if (dated.length === 0) return null;

  const now = Date.now();
  const last7 = dated.filter((entry) => now - new Date(entry.date).getTime() <= 7 * DAY_MS);
  const prior7 = dated.filter((entry) => {
    const age = now - new Date(entry.date).getTime();
    return age > 7 * DAY_MS && age <= 14 * DAY_MS;
  });

  if (last7.length < 2 || prior7.length < 2) return null;

  const average = (entries: StatEntry[]) =>
    entries.reduce((sum, entry) => sum + calculateRecovery(entry), 0) / entries.length;

  const drop = Math.round(average(prior7) - average(last7));
  return drop > 0 ? drop : null;
}

/**
 * A prioritized list of what needs a coach's attention today, computed
 * entirely from data the app already collects (stats_history for pain and
 * readiness trend, workout_sessions completion counts, recent PRs) -- no
 * new tracked fields. Sorted high -> medium -> positive, most recent signal
 * first within a tier.
 */
export function computeAttentionItems(
  roster: RosterAthlete[],
  statsHistoryByUser: Record<string, StatEntry[]>,
  completedSessionsLast7ByUser: Record<string, number>,
  recentPRsByUser: Record<string, { exercise: string; date: string }[]>
): AttentionItem[] {
  const items: AttentionItem[] = [];

  roster.forEach((athlete) => {
    const history = statsHistoryByUser[athlete.userId] ?? [];
    const latestDate = history[history.length - 1]?.date ?? "";

    const painParts = consecutiveDayPainFlags(history);
    if (painParts.length > 0) {
      items.push({
        id: `${athlete.userId}-pain`,
        userId: athlete.userId,
        displayName: athlete.displayName,
        priority: "high",
        reason: `Reported ${joinWithAnd(painParts)} pain 3 days running`,
        action: "Check in",
        signalDate: latestDate
      });
    }

    const drop = readinessDrop(history);
    if (drop != null && drop >= READINESS_DROP_THRESHOLD) {
      items.push({
        id: `${athlete.userId}-readiness-drop`,
        userId: athlete.userId,
        displayName: athlete.displayName,
        priority: "high",
        reason: `Readiness dropped ${drop} points versus last week`,
        action: "Review workload",
        signalDate: latestDate
      });
    }

    const completed = completedSessionsLast7ByUser[athlete.userId] ?? 0;
    if (completed < MIN_WEEKLY_WORKOUTS) {
      items.push({
        id: `${athlete.userId}-missed-workouts`,
        userId: athlete.userId,
        displayName: athlete.displayName,
        priority: "medium",
        reason:
          completed === 0 ? "No completed workouts in the last 7 days" : "Only 1 completed workout in the last 7 days",
        action: "Send reminder",
        signalDate: latestDate
      });
    }

    const recentPRs = recentPRsByUser[athlete.userId] ?? [];
    if (recentPRs.length > 0) {
      items.push({
        id: `${athlete.userId}-new-pr`,
        userId: athlete.userId,
        displayName: athlete.displayName,
        priority: "positive",
        reason: `New PR: ${recentPRs[0].exercise}`,
        action: "Recognize achievement",
        signalDate: recentPRs[0].date
      });
    }
  });

  const priorityRank: Record<AttentionPriority, number> = { high: 0, medium: 1, positive: 2 };
  return items.sort((a, b) => {
    if (priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    return (b.signalDate || "").localeCompare(a.signalDate || "");
  });
}
