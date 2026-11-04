import { BADGES, isJumpPR, type BadgeId } from "@/lib/badges";

/**
 * What goes on the share card (G-05): streak, level, badges and best jump,
 * watermarked joinnextrep.com. Pure, so the content is tested; the drawing
 * lives in ShareProgressButton.
 */

export const SHARE_WATERMARK = "joinnextrep.com";

export type ShareCardInput = {
  name: string;
  streak: number;
  levelName: string;
  xp: number;
  badges: BadgeId[];
  prs: { exercise: string; value: string; unit: string }[];
  /** Vertical / approach values from history, inches. */
  jumpValues: { label: string; value: number }[];
};

export type ShareCard = {
  title: string;
  stats: { label: string; value: string }[];
  badges: { icon: string; name: string }[];
  watermark: string;
};

/** The highest jump from PRs (in inches) and logged history, labelled. */
export function bestJump(input: Pick<ShareCardInput, "prs" | "jumpValues">): { label: string; value: number } | null {
  const candidates = [
    ...input.prs
      .filter((pr) => isJumpPR(pr) && /^in(ches)?$/i.test(pr.unit.trim()))
      .map((pr) => ({ label: pr.exercise, value: Number(pr.value) })),
    ...input.jumpValues
  ].filter((item) => Number.isFinite(item.value) && item.value > 0);
  if (candidates.length === 0) return null;
  // Approach touch and vertical aren't comparable; prefer the vertical if there is one.
  const verticals = candidates.filter((item) => /vert/i.test(item.label));
  const pool = verticals.length > 0 ? verticals : candidates;
  return pool.reduce((best, item) => (item.value > best.value ? item : best));
}

export function buildShareCard(input: ShareCardInput): ShareCard {
  const first = input.name.trim().split(/\s+/)[0] ?? "";
  const jump = bestJump(input);
  const stats = [
    { label: "Streak", value: `${input.streak} day${input.streak === 1 ? "" : "s"}` },
    { label: "Level", value: input.levelName },
    { label: "Badges", value: `${input.badges.length} of ${BADGES.length}` }
  ];
  if (jump) stats.push({ label: /vert/i.test(jump.label) ? "Best vertical" : `Best ${jump.label.toLowerCase()}`, value: `${jump.value} in` });
  return {
    title: first ? `${first.toUpperCase()}'S PROGRESS` : "MY PROGRESS",
    stats,
    badges: BADGES.filter((badge) => input.badges.includes(badge.id)).map(({ icon, name }) => ({ icon, name })),
    watermark: SHARE_WATERMARK
  };
}
