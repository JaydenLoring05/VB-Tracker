"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";

const charts: [string, string, string][] = [
  ["vertical", "Vertical", "var(--gold)"],
  ["approach", "Approach", "var(--blue)"],
  ["weight", "Weight", "var(--purple)"],
  ["pullups", "Pull-Ups", "var(--green)"]
];

export function ProgressCharts() {
  const { history } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>Progress Graphs</h2>

      <div className="chart-grid">
        {charts.map(([key, label, color]) => (
          <div className="chart-card" key={key}>
            <h3>{label}</h3>

            {history.length === 0 ? (
              <div className="empty-state">
                <p className="muted">Log stats to see your {label.toLowerCase()} trend.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)"
                    }}
                    labelStyle={{ color: "var(--muted)" }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
