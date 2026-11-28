/**
 * XP and levels (G-02). Pure: data in, answer out, so the Today card, the
 * share card (G-05) and the demo all agree.
 *
 * XP comes from things the athlete actually did: each finished workout and
 * each personal record. Levels are named for a path a 10-year-old and a
 * college athlete both recognise, from Rookie to Pro.
 */

export const XP_PER_WORKOUT = 100;
export const XP_PER_PR = 50;
/** Each friend who signs up with the athlete's referral code (RF-01). */
export const XP_PER_REFERRAL = 150;

export type Level = { name: string; minXp: number };

export const LEVELS: readonly Level[] = [
  { name: "Rookie", minXp: 0 },
  { name: "Starter", minXp: 500 },
  { name: "Varsity", minXp: 1500 },
  { name: "All-Conference", minXp: 4000 },
  { name: "Pro", minXp: 8000 }
];

export function computeXp({ workouts, prs, referrals = 0 }: { workouts: number; prs: number; referrals?: number }): number {
  const count = (n: number) => Math.max(0, Math.floor(n));
  return count(workouts) * XP_PER_WORKOUT + count(prs) * XP_PER_PR + count(referrals) * XP_PER_REFERRAL;
}

export type LevelProgress = {
  xp: number;
  level: Level;
  /** 1-based, Rookie is 1. */
  levelNumber: number;
  next: Level | null;
  /** XP still needed for the next level (0 at Pro). */
  xpToNext: number;
  /** 0 to 100, how far through the current level (100 at Pro). */
  percent: number;
};

export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (safeXp >= level.minXp) index = i;
  });
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { xp: safeXp, level, levelNumber: index + 1, next: null, xpToNext: 0, percent: 100 };
  const span = next.minXp - level.minXp;
  return {
    xp: safeXp,
    level,
    levelNumber: index + 1,
    next,
    xpToNext: next.minXp - safeXp,
    percent: Math.floor(((safeXp - level.minXp) / span) * 100)
  };
}
