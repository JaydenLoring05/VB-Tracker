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

const charts: [string, string][] = [
  ["vertical", "Vertical"],
  ["approach", "Approach"],
  ["weight", "Weight"],
  ["pullups", "Pull-Ups"]
];

export function ProgressCharts() {
  const { history } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>Progress Graphs</h2>

      <div className="chart-grid">
        {charts.map(([key, label]) => (
          <div className="chart-card" key={key}>
            <h3>{label}</h3>

            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" />
                <XAxis dataKey="date" stroke="#a8b0bd" />
                <YAxis stroke="#a8b0bd" />
                <Tooltip />
                <Line type="monotone" dataKey={key} stroke="#ffc400" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
