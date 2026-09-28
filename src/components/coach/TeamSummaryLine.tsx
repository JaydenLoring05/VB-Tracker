import { AttentionItem, summarizeTeam } from "@/lib/attentionCenter";
import { recoveryStatus } from "@/lib/recovery";
import { RosterAthlete } from "@/types";

/**
 * One line of team numbers under the Attention Center heading. Derived from
 * the roster and attention items the dashboard already loaded.
 */
export function TeamSummaryLine({ roster, attentionItems }: { roster: RosterAthlete[]; attentionItems: AttentionItem[] }) {
  if (roster.length === 0) return null;

  const { readiness, checkedIn, rosterSize, needAttention } = summarizeTeam(roster, attentionItems);

  return (
    <p className="team-summary">
      <span>
        Readiness{" "}
        <strong>{readiness === null ? "--" : `${readiness}%`}</strong>
        {readiness !== null && <span className="muted"> {recoveryStatus(readiness).label}</span>}
      </span>
      <span>
        <strong>
          {checkedIn}/{rosterSize}
        </strong>{" "}
        checked in
      </span>
      <span className={needAttention > 0 ? "team-summary-alert" : "team-summary-clear"}>
        {needAttention > 0 ? (
          <>
            <strong>{needAttention}</strong> need{needAttention === 1 ? "s" : ""} attention
          </>
        ) : (
          "All clear"
        )}
      </span>
    </p>
  );
}
