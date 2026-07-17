"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useAthleteAdherence } from "@/hooks/useAthleteAdherence";
import { useAthletePRs } from "@/hooks/useAthletePRs";
import { useAthleteStatsHistory } from "@/hooks/useAthleteStatsHistory";

type Tab = "recovery" | "prs" | "adherence";

const TABS: { id: Tab; label: string }[] = [
  { id: "recovery", label: "Recovery" },
  { id: "prs", label: "PRs" },
  { id: "adherence", label: "Adherence" }
];

export function AthleteStatsModal({
  userId,
  displayName,
  onClose
}: {
  userId: string;
  displayName: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("recovery");

  const { loading, history, error } = useAthleteStatsHistory(userId);
  const { loading: prsLoading, prs, error: prsError } = useAthletePRs(userId);
  const { loading: adherenceLoading, adherence, error: adherenceError } = useAthleteAdherence(userId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="panel modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${displayName}'s stats history`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{displayName}&apos;s Stats History</h2>
          <button type="button" className="ghost modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <section className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? "" : "ghost"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </section>

        {tab === "recovery" &&
          (loading ? (
            <p className="muted">Loading stats history...</p>
          ) : error ? (
            <div className="empty-state">
              <p className="muted">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No stats logged yet.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)"
                    }}
                    labelStyle={{ color: "var(--muted)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Line type="monotone" dataKey="recovery" stroke="var(--gold)" strokeWidth={2} name="Recovery %" />
                </LineChart>
              </ResponsiveContainer>

              <div className="athlete-stats-table">
                <div className="athlete-stats-row athlete-stats-header">
                  <span>Date</span>
                  <span>Recovery</span>
                  <span>Sleep</span>
                  <span>Soreness</span>
                  <span>Knee</span>
                  <span>Shoulder</span>
                </div>

                {[...history].reverse().map((entry, index) => (
                  <div className="athlete-stats-row" key={`${entry.date}-${index}`}>
                    <span>{entry.date || "-"}</span>
                    <span>
                      {entry.recovery}% · {entry.recoveryLabel}
                    </span>
                    <span>{entry.sleep || "-"}</span>
                    <span>{entry.soreness || "-"}</span>
                    <span>{entry.kneePain || "-"}</span>
                    <span>{entry.shoulderPain || "-"}</span>
                  </div>
                ))}
              </div>
            </>
          ))}

        {tab === "prs" &&
          (prsLoading ? (
            <p className="muted">Loading PRs...</p>
          ) : prsError ? (
            <div className="empty-state">
              <p className="muted">{prsError}</p>
            </div>
          ) : prs.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No PRs logged yet.</p>
            </div>
          ) : (
            <div className="athlete-stats-table">
              <div className="athlete-stats-row athlete-stats-row-prs athlete-stats-header">
                <span>Date</span>
                <span>Exercise</span>
                <span>Result</span>
                <span>Note</span>
              </div>

              {prs.map((pr) => (
                <div className="athlete-stats-row athlete-stats-row-prs" key={pr.id}>
                  <span>{pr.date || "-"}</span>
                  <span>{pr.exercise}</span>
                  <span>
                    {pr.value} {pr.unit}
                  </span>
                  <span>{pr.note || "-"}</span>
                </div>
              ))}
            </div>
          ))}

        {tab === "adherence" &&
          (adherenceLoading ? (
            <p className="muted">Loading workout history...</p>
          ) : adherenceError ? (
            <div className="empty-state">
              <p className="muted">{adherenceError}</p>
            </div>
          ) : !adherence || adherence.totalSessions === 0 ? (
            <div className="empty-state">
              <p className="muted">No workouts completed yet.</p>
            </div>
          ) : (
            <>
              <div className="athlete-adherence-summary">
                <div>
                  <strong>{adherence.totalSessions}</strong>
                  <span className="muted">Workouts completed</span>
                </div>
                <div>
                  <strong>{adherence.totalMinutesTrained}</strong>
                  <span className="muted">Minutes trained</span>
                </div>
                <div>
                  <strong>{adherence.completionPercent}%</strong>
                  <span className="muted">Plan completion</span>
                </div>
              </div>

              <div className="athlete-stats-table">
                <div className="athlete-stats-row athlete-stats-row-adherence athlete-stats-header">
                  <span>Date</span>
                  <span>Week</span>
                  <span>Day</span>
                  <span>Duration</span>
                </div>

                {adherence.sessions.map((session) => (
                  <div className="athlete-stats-row athlete-stats-row-adherence" key={session.id}>
                    <span>{new Date(session.ended_at).toLocaleDateString("en-US")}</span>
                    <span>{session.week}</span>
                    <span>{session.day}</span>
                    <span>
                      {session.duration_seconds != null
                        ? `${Math.round(session.duration_seconds / 60)} min`
                        : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ))}
      </div>
    </div>
  );
}
