"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addDismissal,
  attentionDismissStorageKey,
  Dismissals,
  parseDismissals,
  removeDismissal,
  visibleItems
} from "@/lib/attentionActions";
import { AttentionItem } from "@/lib/attentionCenter";

function readStored(teamId: string): Dismissals {
  try {
    return parseDismissals(window.localStorage.getItem(attentionDismissStorageKey(teamId)));
  } catch {
    return {};
  }
}

/** Attention items the coach has cleared on this device, per team. */
export function useAttentionDismissals(teamId: string | undefined, items: AttentionItem[]) {
  const [state, setState] = useState<{ teamId: string | undefined; dismissals: Dismissals }>({
    teamId: undefined,
    dismissals: {}
  });

  // localStorage only exists in the browser, so read it after mount (and again on team switch).
  useEffect(() => {
    if (!teamId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ teamId, dismissals: readStored(teamId) });
  }, [teamId]);

  const save = useCallback(
    (update: (current: Dismissals) => Dismissals) => {
      if (!teamId) return;
      setState((current) => {
        const next = update(current.teamId === teamId ? current.dismissals : {});
        try {
          window.localStorage.setItem(attentionDismissStorageKey(teamId), JSON.stringify(next));
        } catch {
          // Private mode or storage full: still hide it for this visit.
        }
        return { teamId, dismissals: next };
      });
    },
    [teamId]
  );

  const dismiss = useCallback((item: AttentionItem) => save((current) => addDismissal(current, item)), [save]);
  const restore = useCallback((item: AttentionItem) => save((current) => removeDismissal(current, item)), [save]);

  const visible = useMemo(
    () => visibleItems(items, state.teamId === teamId ? state.dismissals : {}),
    [items, state, teamId]
  );

  return { visible, dismiss, restore };
}
