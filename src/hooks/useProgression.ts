import { useTrackerContext } from "@/context/TrackerContext";
import { computeXp, levelProgress } from "@/lib/progression";

/** The athlete's XP and level (G-02), from finished workouts and PRs. */
export function useProgression(referrals = 0) {
  const { workoutDates, prs } = useTrackerContext();
  return levelProgress(computeXp({ workouts: workoutDates.length, prs: prs.length, referrals }));
}
