"use client";

import { Activity } from "lucide-react";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { StatEntry } from "@/types";

const fields: [keyof StatEntry, string, number?][] = [
  ["vertical", "Vertical Jump"],
  ["approach", "Approach Touch"],
  ["weight", "Body Weight"],
  ["pullups", "Max Pull-Ups"],
  ["sleep", "Sleep Hours", 10],
  ["energy", "Energy", 10],
  ["stress", "Stress", 10],
  ["motivation", "Motivation", 10],
  ["soreness", "General Soreness", 10],
  ["kneePain", "Knee Discomfort", 10],
  ["shoulderPain", "Shoulder Discomfort", 10],
  ["lowerBackPain", "Lower-Back Discomfort", 10],
  ["anklePain", "Ankle Discomfort", 10]
];

export function StatsForm() {
  const { stats, setStats, saveStats, clearStats } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>
        <Activity size={22} /> Performance Stats
      </h2>

      <div className="stats-grid">
        {fields.map(([key, label, max]) => (
          <label key={key}>
            {label}
            {max ? ` (0-${max})` : ""}
            <input
              type="number"
              min={max ? 0 : undefined}
              max={max}
              value={stats[key]}
              onChange={(e) => {
                if (e.target.value === "") {
                  setStats((current) => ({ ...current, [key]: "" }));
                  return;
                }

                let value = Number(e.target.value);
                if (max && value > max) value = max;
                if (value < 0) value = 0;

                setStats((current) => ({ ...current, [key]: value }));
              }}
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
