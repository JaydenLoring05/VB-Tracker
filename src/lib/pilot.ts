// Pilot end and payment. No in-app billing: from day 25 of a team on the
// pilot tier the coach sees a dismissible banner with the end date and, if
// NEXT_PUBLIC_PAYMENT_LINK is set, a "Continue for $29/month" button. You
// move a team to plan_tier 'paid' by hand (see docs/BILLING.md).

export const PILOT_DAYS = 30;
export const PILOT_BANNER_FROM_DAY = 25;
export const PILOT_ROSTER_LIMIT = 16;
export const PAID_PRICE_LABEL = "$29/month";

const DAY_MS = 24 * 60 * 60 * 1000;

type PilotTeam = { id: string; created_at: string; plan_tier: "pilot" | "paid" };

/** Null when there's nothing to show; otherwise when the pilot ends and how many days are left. */
export function pilotBanner(
  team: PilotTeam,
  now: Date = new Date()
): { endsOn: string; daysLeft: number; ended: boolean } | null {
  if (team.plan_tier !== "pilot") return null;
  const start = Date.parse(team.created_at);
  if (Number.isNaN(start)) return null;

  const dayOfPilot = Math.floor((now.getTime() - start) / DAY_MS) + 1;
  if (dayOfPilot < PILOT_BANNER_FROM_DAY) return null;

  const end = start + PILOT_DAYS * DAY_MS;
  const daysLeft = Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS));
  return { endsOn: new Date(end).toISOString(), daysLeft, ended: now.getTime() >= end };
}

export function formatPilotEnd(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone });
}

/** localStorage key for "dismissed": separate for the warning and the "ended" notice. */
export function pilotDismissKey(teamId: string, ended: boolean): string {
  return `nextrep-pilot-banner-${ended ? "ended" : "ending"}-${teamId}`;
}

/** The payment link from NEXT_PUBLIC_PAYMENT_LINK, only if it's an https URL. */
export function paymentLink(value: string | undefined): string | null {
  const link = value?.trim();
  if (!link) return null;
  try {
    return new URL(link).protocol === "https:" ? link : null;
  } catch {
    return null;
  }
}

export function rosterOverPilotLimit(athleteCount: number, planTier: "pilot" | "paid"): boolean {
  return planTier === "pilot" && athleteCount > PILOT_ROSTER_LIMIT;
}
