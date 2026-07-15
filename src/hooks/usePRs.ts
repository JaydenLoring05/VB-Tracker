import { useTrackerContext } from "@/context/TrackerContext";

export function usePRs() {
  const { prs, addPR, deletePR } = useTrackerContext();

  const latestPR = prs[0];

  return {
    prs,
    addPR,
    deletePR,
    latestPR
  };
}
