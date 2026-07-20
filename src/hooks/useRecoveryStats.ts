import { useTrackerContext } from "@/context/TrackerContext";
import { calculateRecovery, coachRecommendations, explainReadiness, recoveryStatus } from "@/lib/recovery";

export function useRecoveryStats() {
  const { stats, setStats, history, saveStats, clearStats } = useTrackerContext();

  const hasLoggedStats = history.length > 0;
  const effectiveStats = hasLoggedStats ? stats : null;

  const recovery = calculateRecovery(effectiveStats);
  const status = recoveryStatus(recovery);
  const coachTips = coachRecommendations(effectiveStats, history);
  const readinessExplanation = hasLoggedStats ? explainReadiness(effectiveStats, history, recovery) : null;

  return {
    stats,
    setStats,
    history,
    saveStats,
    clearStats,
    recovery,
    status,
    coachTips,
    readinessExplanation,
    hasLoggedStats
  };
}
