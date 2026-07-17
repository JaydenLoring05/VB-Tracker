import { useTrackerContext } from "@/context/TrackerContext";
import { calculateRecovery, coachRecommendations, recoveryStatus } from "@/lib/recovery";

export function useRecoveryStats() {
  const { stats, setStats, history, saveStats, clearStats } = useTrackerContext();

  const hasLoggedStats = history.length > 0;
  const effectiveStats = hasLoggedStats ? stats : null;

  const recovery = calculateRecovery(effectiveStats);
  const status = recoveryStatus(recovery);
  const coachTips = coachRecommendations(effectiveStats);

  return {
    stats,
    setStats,
    history,
    saveStats,
    clearStats,
    recovery,
    status,
    coachTips,
    hasLoggedStats
  };
}
