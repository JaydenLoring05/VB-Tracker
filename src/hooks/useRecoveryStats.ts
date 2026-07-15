import { useTrackerContext } from "@/context/TrackerContext";
import { calculateRecovery, coachRecommendations, recoveryStatus } from "@/lib/recovery";

export function useRecoveryStats() {
  const { stats, setStats, history, saveStats, clearStats } = useTrackerContext();

  const recovery = calculateRecovery(stats);
  const status = recoveryStatus(recovery);
  const coachTips = coachRecommendations(stats);

  return {
    stats,
    setStats,
    history,
    saveStats,
    clearStats,
    recovery,
    status,
    coachTips
  };
}
