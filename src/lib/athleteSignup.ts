/**
 * The answers a self-serve athlete gives at sign-up (N-03): sport, position
 * and one main goal. Level and injuries live in trainingProfile.ts; age and
 * parent consent in guardian.ts.
 */

export type Sport =
  | "volleyball"
  | "basketball"
  | "soccer"
  | "football"
  | "track"
  | "baseballSoftball"
  | "tennis"
  | "other";

export const SPORTS: { value: Sport; label: string }[] = [
  { value: "volleyball", label: "Volleyball" },
  { value: "basketball", label: "Basketball" },
  { value: "soccer", label: "Soccer" },
  { value: "football", label: "Football" },
  { value: "track", label: "Track & field" },
  { value: "baseballSoftball", label: "Baseball / softball" },
  { value: "tennis", label: "Tennis" },
  { value: "other", label: "Other" }
];

export type AthleteGoal = "jump" | "strength" | "healthy";

export const ATHLETE_GOALS: { value: AthleteGoal; label: string }[] = [
  { value: "jump", label: "Jump higher" },
  { value: "strength", label: "Get stronger" },
  { value: "healthy", label: "Stay healthy" }
];

/**
 * What goes in `profiles.position`: the volleyball position picked from the
 * list, or whatever the athlete typed for another sport (blank becomes null).
 */
export function positionLabel(sport: Sport, volleyballPosition: string, typed: string): string | null {
  if (sport === "volleyball") return volleyballPosition;
  const cleaned = typed.replace(/\s+/g, " ").trim().slice(0, 40);
  return cleaned || null;
}
