"use client";

import { Activity } from "lucide-react";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { StatEntry } from "@/types";

const fields: [keyof StatEntry, string][] = [
  ["vertical", "Vertical Jump"],
  ["approach", "Approach Touch"],
  ["weight", "Body Weight"],
  ["pullups", "Max Pull-Ups"],
  ["sleep", "Sleep Hours"],
  ["kneePain", "Knee Pain"],
  ["shoulderPain", "Shoulder Pain"],
  ["soreness", "Soreness"],
  ["energy", "Energy"]
];

export function StatsForm() {
  const { stats, setStats, saveStats, clearStats } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>
        <Activity size={22} /> Performance Stats
      </h2>

      <div className="stats-grid">
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              value={stats[key]}
              onChange={(e) =>
                setStats((current) => ({
                  ...current,
                  [key]: e.target.value === "" ? "" : Number(e.target.value)
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="button-row">
        <button onClick={saveStats}>Save Stats Entry</button>
        <button className="ghost" onClick={clearStats}>
          Clear History
        </button>
      </div>
    </div>
  );
}
