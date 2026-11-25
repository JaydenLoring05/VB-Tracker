import { useMemo } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useJumpTests } from "@/hooks/useJumpTests";
import { earnedBadges } from "@/lib/badges";
import { jumpSeries } from "@/lib/jumps";

/** Badges the athlete has earned (G-03). `trainingDaysPerWeek` is from their current plan week. */
export function useBadges(trainingDaysPerWeek: number, referrals = 0) {
  const { workoutDates, prs, history } = useTrackerContext();
  const { tests } = useJumpTests();
  const testDates = useMemo(
    () => [...jumpSeries(history, tests, "vertical"), ...jumpSeries(history, tests, "approach")].map((point) => point.date),
    [history, tests]
  );
  return earnedBadges({ workoutDates, prs, trainingDaysPerWeek, referrals, testDates });
}
