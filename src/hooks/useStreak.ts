import { useTrackerContext } from "@/context/TrackerContext";
import { useTodayISO } from "@/hooks/useToday";
import { computeStreak } from "@/lib/streak";

/** The athlete's daily streak and banked freezes (G-01). Empty until the browser knows today's date. */
export function useStreak() {
  const { workoutDates } = useTrackerContext();
  return computeStreak(workoutDates, useTodayISO());
}
