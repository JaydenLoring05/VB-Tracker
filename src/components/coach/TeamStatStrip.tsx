import { recoveryStatus } from "@/lib/recovery";
import { AttentionItem } from "@/lib/attentionCenter";
import { RosterAthlete } from "@/types";

/**
 * Three-number summary above the roster. Everything is derived from the roster
 * and Attention Center data the dashboard already loaded.
 */
export function TeamStatStrip({ roster, attentionItems }: { roster: RosterAthlete[]; attentionItems: AttentionItem[] }) {
  if (roster.length === 0) return null;

  const scored = roster.filter((athlete) => athlete.lastCheckIn !== null);
  const readiness = scored.length
    ? Math.round(scored.reduce((sum, athlete) => sum + athlete.recovery, 0) / scored.length)
    : null;
  const upToDate = roster.filter((athlete) => athlete.lastCheckIn !== null && !athlete.needsCheckIn).length;
  const needAttention = attentionItems.filter((item) => item.priority !== "positive").length;

  return (
    <section className="team-stats" aria-label="Team summary">
      <div className="stat-tile stat-tile-accent">
        <p className="stat-label">Team readiness</p>
        <p className="stat-value">
          {readiness === null ? "--" : readiness}
          {readiness !== null && <small>%</small>}
        </p>
        <p className="stat-delta">
          {readiness === null ? "Waiting on first check-ins" : `${recoveryStatus(readiness).label} across ${scored.length} athlete${scored.length === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="stat-tile">
        <p className="stat-label">Checked in</p>
        <p className="stat-value">
          {upToDate}
          <small>/ {roster.length}</small>
        </p>
        <p className={`stat-delta${upToDate === roster.length ? " is-up" : ""}`}>Within the last 3 days</p>
      </div>

      <div className="stat-tile">
        <p className="stat-label">Need attention</p>
        <p className="stat-value">{needAttention}</p>
        <p className={`stat-delta${needAttention > 0 ? " is-alert" : " is-up"}`}>
          {needAttention > 0 ? "Review now" : "All clear"}
        </p>
      </div>
    </section>
  );
}
