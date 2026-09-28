"use client";

import { usePRs } from "@/hooks/usePRs";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { HeadlineMetric, statsHeadline } from "@/lib/statsHeadline";

function changeText(metric: HeadlineMetric) {
  if (metric.value == null) return "Not logged yet";
  if (metric.change == null) return "First entry";
  if (metric.change === 0) return `No change since ${metric.since}`;

  const sign = metric.change > 0 ? "+" : "−";
  return `${sign}${Math.abs(metric.change)} ${metric.unit} since ${metric.since}`;
}

/** The few numbers an athlete checks most, above the full charts and forms. */
export function StatsHeadline() {
  const { history } = useRecoveryStats();
  const { prs, latestPR } = usePRs();

  // Nothing to summarize yet: the charts panel's empty state explains what to log.
  if (history.length === 0 && prs.length === 0) return null;

  return (
    <section className="stats-headline" aria-labelledby="stats-headline-title">
      <h2 id="stats-headline-title" className="sr-only">
        At a glance
      </h2>

      {statsHeadline(history).map((metric, index) => (
        <div className={`stat-tile${index === 0 ? " stat-tile-accent" : ""}`} key={metric.key}>
          <p className="stat-label">{metric.label}</p>
          <p className="stat-value">
            {metric.value ?? "—"}
            {metric.value != null && <small>{metric.unit}</small>}
          </p>
          <p className={`stat-delta${metric.change != null && metric.change > 0 ? " is-up" : ""}`}>
            {changeText(metric)}
          </p>
        </div>
      ))}

      <div className="stat-tile">
        <p className="stat-label">PRs logged</p>
        <p className="stat-value">{prs.length}</p>
        <p className="stat-delta">
          {latestPR ? `Latest: ${latestPR.exercise}, ${latestPR.value} ${latestPR.unit}` : "None yet"}
        </p>
      </div>
    </section>
  );
}
