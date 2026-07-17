"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useAthleteStatsHistory } from "@/hooks/useAthleteStatsHistory";

export function AthleteStatsModal({
  userId,
  displayName,
  onClose
}: {
  userId: string;
  displayName: string;
  onClose: () => void;
}) {
  const { loading, history, error } = useAthleteStatsHistory(userId);

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

        {loading ? (
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
        )}
      </div>
    </div>
  );
}
