"use client";


import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { StatEntry } from "@/types";

// Test day numbers only. The daily fields (sleep, energy, stress, motivation,
// soreness, pain) moved to the 30-second DailyCheckIn.
const fields: [keyof StatEntry, string, number?][] = [
  ["vertical", "Vertical Jump"],
  ["approach", "Approach Touch"],
  ["weight", "Body Weight"],
  ["pullups", "Max Pull-Ups"]
];

export function StatsForm() {
  const { stats, setStats, saveStats, clearStats } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>
        Test day numbers
      </h2>
      <p className="muted">Vertical, approach touch, body weight and pull-ups, whenever you test them.</p>

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
