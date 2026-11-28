import { hasPaidAccess, type BillingStatus } from "@/lib/billing";

/**
 * Who needs a paid plan to use the app (P-02). Everything is behind the
 * athlete plan once the free trial is over, except:
 * - nothing is locked while payments are off (Stripe keys not set);
 * - anyone on a team (coaches and their athletes) is covered by the team;
 * - if the billing row couldn't be read, the app stays open rather than
 *   locking out someone who may be paying.
 * The first workout is free, no card: an athlete who has never had a plan
 * (no billing row, or "none") is open until they finish one workout. After
 * that the plan picker shows and the 7-day trial starts at checkout (card
 * at workout 2). Canceled, past-due and incomplete stay locked right away.
 */
export const FREE_WORKOUTS = 1;

export function needsPlan(input: {
  billingEnabled: boolean;
  onTeam: boolean;
  status: BillingStatus | null;
  billingLoadFailed: boolean;
  /** Finished workouts so far. Missing means 0 (still on the free first workout). */
  finishedWorkouts?: number;
}): boolean {
  if (!input.billingEnabled || input.onTeam || input.billingLoadFailed) return false;
  if (hasPaidAccess(input.status)) return false;
  const neverHadPlan = input.status === null || input.status === "none";
  if (neverHadPlan && (input.finishedWorkouts ?? 0) < FREE_WORKOUTS) return false;
  return true;
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
    case "none":
    case null:
      return "Your first workout was on us. Start your 7-day free trial to keep going: your plan, Workout Mode and your progress. Cancel before it ends and you pay nothing.";
    default:
      return "Start your free trial to unlock your plan, Workout Mode and your progress. Cancel before it ends and you pay nothing.";
  }
}
