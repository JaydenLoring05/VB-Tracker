import { StatEntry } from "@/types";

export function calculateRecovery(stats?: StatEntry | null) {
  if (!stats) return 0;

  const sleep = Number(stats.sleep) || 0;
  const energy = Number(stats.energy) || 0;
  const stress = Number(stats.stress) || 0;
  const soreness = Number(stats.soreness) || 0;
  const knee = Number(stats.kneePain) || 0;
  const shoulder = Number(stats.shoulderPain) || 0;
  const lowerBack = Number(stats.lowerBackPain) || 0;
  const ankle = Number(stats.anklePain) || 0;
  const motivation = Number(stats.motivation) || 0;

  const score =
    (sleep / 9) * 20 +
    (energy / 10) * 15 +
    ((10 - stress) / 10) * 10 +
    ((10 - soreness) / 10) * 10 +
    ((10 - knee) / 10) * 10 +
    ((10 - shoulder) / 10) * 10 +
    ((10 - lowerBack) / 10) * 10 +
    ((10 - ankle) / 10) * 5 +
    (motivation / 10) * 10;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function recoveryStatus(score: number) {
  if (score >= 85) {
    return {
      label: "Elite",
      message: "Go train hard. Your body appears to be cooperating for once."
    };
  }

  if (score >= 70) {
    return {
      label: "Good",
      message: "You are good to train. Keep it smart."
    };
  }

  if (score >= 55) {
    return {
      label: "Caution",
      message: "Reduce volume 20-30% today."
    };
  }

  return {
    label: "Low",
    message: "Recovery day. Biology has filed a complaint."
  };
}

const SEVERE_PAIN_FIELDS: { key: "kneePain" | "shoulderPain" | "lowerBackPain" | "anklePain"; label: string }[] = [
  { key: "kneePain", label: "knee" },
  { key: "shoulderPain", label: "shoulder" },
  { key: "lowerBackPain", label: "lower back" },
  { key: "anklePain", label: "ankle" }
];

const SEVERE_PAIN_THRESHOLD = 8;
const SEVERE_PAIN_STREAK = 3;

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Body parts reporting pain at or above SEVERE_PAIN_THRESHOLD on each of the
 * athlete's last SEVERE_PAIN_STREAK check-ins in a row (independent of
 * calendar gaps -- this protects the athlete's own screen, distinct from the
 * coach Attention Center's separate "3 consecutive calendar days" pain flag,
 * which watches a lower, coach-visibility threshold instead).
 */
export function severePainBodyParts(history: StatEntry[]): string[] {
  if (history.length < SEVERE_PAIN_STREAK) return [];

  const recent = history.slice(-SEVERE_PAIN_STREAK);

  return SEVERE_PAIN_FIELDS.filter(({ key }) =>
    recent.every((entry) => Number(entry[key]) >= SEVERE_PAIN_THRESHOLD)
  ).map(({ label }) => label);
}

function medicalRedirectMessage(severeParts: string[]): string {
  return `You've reported ${joinWithAnd(severeParts)} pain at a high level for several check-ins in a row. This isn't something the app can safely guide you through. Talk to your coach or a medical professional before your next session.`;
}

export function coachRecommendations(stats?: StatEntry | null, history: StatEntry[] = []) {
  if (!stats) return ["Add stats first so the coach can stop guessing like a caveman."];

  const severeParts = severePainBodyParts(history);
  if (severeParts.length > 0) return [medicalRedirectMessage(severeParts)];

  const list: string[] = [];
  const score = calculateRecovery(stats);

  if (score >= 70) list.push("✅ You are good to train today.");
  if (score < 70) list.push("⚠️ Reduce total volume today.");
  if (Number(stats.kneePain) >= 5) list.push("⚠️ Skip max jumps and do knee rehab.");
  if (Number(stats.shoulderPain) >= 5) list.push("⚠️ Replace overhead pressing with shoulder-friendly work.");
  if (Number(stats.lowerBackPain) >= 5) list.push("⚠️ Skip loaded spinal flexion and heavy rotational core work.");
  if (Number(stats.anklePain) >= 5) list.push("⚠️ Avoid max-effort jumps and cutting drills.");
  if (Number(stats.sleep) < 7) list.push("⚠️ Aim for 8+ hours of sleep tonight.");
  if (Number(stats.energy) <= 5) list.push("⚠️ Keep intensity moderate.");
  if (Number(stats.stress) >= 7) list.push("⚠️ High stress today: add extra warm-up and mobility time.");
  if (Number(stats.soreness) >= 7) list.push("⚠️ Mobility and easy work only.");
  if (Number(stats.motivation) <= 3) list.push("⚠️ Low motivation today: keep the session short and simple.");

  return list.length ? list : ["✅ Keep pushing. Stay consistent."];
}

type ReadinessFactorKey =
  | "sleep"
  | "energy"
  | "stress"
  | "soreness"
  | "kneePain"
  | "shoulderPain"
  | "lowerBackPain"
  | "anklePain"
  | "motivation";

const READINESS_FACTOR_LABELS: Record<ReadinessFactorKey, string> = {
  sleep: "sleep",
  energy: "energy",
  stress: "stress",
  soreness: "soreness",
  kneePain: "knee response",
  shoulderPain: "shoulder response",
  lowerBackPain: "lower-back response",
  anklePain: "ankle response",
  motivation: "motivation"
};

const READINESS_FACTORS: ReadinessFactorKey[] = [
  "sleep",
  "energy",
  "stress",
  "soreness",
  "kneePain",
  "shoulderPain",
  "lowerBackPain",
  "anklePain",
  "motivation"
];

const BELOW_NORMAL_THRESHOLD = 0.7;

function factorNormalized(key: ReadinessFactorKey, stats: StatEntry): number {
  const value = Number(stats[key]) || 0;
  if (key === "sleep") return value / 9;
  if (key === "energy" || key === "motivation") return value / 10;
  return (10 - value) / 10;
}

/**
 * A short, plain-language explanation of a readiness score -- never a
 * diagnosis. If severe/persistent pain is reported (see
 * severePainBodyParts), this short-circuits to a medical-professional
 * redirect with no workout-modification suggestion attached, so it can
 * never read as "here's a workaround for your injury."
 */
export function explainReadiness(stats: StatEntry | null | undefined, history: StatEntry[], score: number): string {
  if (!stats) return "Log today's check-in to see a readiness explanation.";

  const severeParts = severePainBodyParts(history);
  if (severeParts.length > 0) return medicalRedirectMessage(severeParts);

  const { label, message } = recoveryStatus(score);

  const belowNormal = READINESS_FACTORS.map((key) => ({ key, normalized: factorNormalized(key, stats) }))
    .filter((factor) => factor.normalized < BELOW_NORMAL_THRESHOLD)
    .sort((a, b) => a.normalized - b.normalized)
    .slice(0, 2)
    .map((factor) => READINESS_FACTOR_LABELS[factor.key]);

  if (belowNormal.length === 0) {
    return `Readiness: ${score} · ${label}. Everything you logged looks in normal range. ${message}`;
  }

  const verb = belowNormal.length === 1 ? "is" : "are";
  return `Readiness: ${score} · ${label}. Your ${joinWithAnd(belowNormal)} ${verb} below normal. ${message}`;
}
