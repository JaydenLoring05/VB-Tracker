import { hasPaidAccess, type BillingStatus } from "@/lib/billing";

/**
 * Who needs a paid plan to use the app (P-02). Everything is behind the
 * athlete plan once the free trial is over, except:
 * - nothing is locked while payments are off (Stripe keys not set);
 * - anyone on a team (coaches and their athletes) is covered by the team;
 * - if the billing row couldn't be read, the app stays open rather than
 *   locking out someone who may be paying.
 * The trial starts at checkout (card up front), so "no plan yet" is locked too.
 */
export function needsPlan(input: {
  billingEnabled: boolean;
  onTeam: boolean;
  status: BillingStatus | null;
  billingLoadFailed: boolean;
}): boolean {
  if (!input.billingEnabled || input.onTeam || input.billingLoadFailed) return false;
  return !hasPaidAccess(input.status);
}

/**
 * Pages that stay open without a plan:
 * - /settings, where the trial starts and the plan is managed;
 * - /onboarding, so the plan is built before the trial starts;
 * - /coach, to join a coach's team with a code (or set one up);
 * - /feedback.
 */
export const OPEN_WITHOUT_PLAN = ["/settings", "/onboarding", "/coach", "/feedback"] as const;

export function isOpenWithoutPlan(pathname: string): boolean {
  return OPEN_WITHOUT_PLAN.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** The line above the plan picker, by why the athlete is seeing it. */
export function paywallMessage(status: BillingStatus | null): string {
  switch (status) {
    case "past_due":
      return "Your last payment didn't go through. Update your card to keep training.";
    case "canceled":
      return "Your plan has ended. Pick a plan to pick up where you left off: your history is all still here.";
    default:
      return "Start your free trial to unlock your plan, Workout Mode and your progress. Cancel before it ends and you pay nothing.";
  }
}
