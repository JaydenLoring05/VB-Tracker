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

import { LineChart as LineChartIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";

const charts: [string, string, string][] = [
  ["vertical", "Vertical", "var(--gold)"],
  ["approach", "Approach", "var(--blue)"],
  ["weight", "Weight", "var(--purple)"],
  ["pullups", "Pull-Ups", "var(--green)"]
];

export function ProgressCharts() {
  const { history } = useRecoveryStats();

  if (history.length === 0) {
    return (
      <div className="panel">
        <h2>Progress Graphs</h2>

        <EmptyState
          icon={LineChartIcon}
          title="Your trends start with one check-in"
          description="Log your vertical, approach touch, weight and pull-ups on the form. After a couple of entries you'll see each one charted over time."
          preview={
            <svg className="preview-chart" viewBox="0 0 240 72" preserveAspectRatio="none" role="presentation">
              <polyline
                points="0,58 40,52 80,54 120,38 160,30 200,22 240,14"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          }
        />
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Progress Graphs</h2>

      <div className="chart-grid">
        {charts.map(([key, label, color]) => (
          <div className="chart-card" key={key}>
            <h3>{label}</h3>

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
          </div>
        ))}
      </div>
    </div>
  );
}
