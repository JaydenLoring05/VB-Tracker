"use client";

import { useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
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
  const [confirmingClear, setConfirmingClear] = useState(false);

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
        <button className="ghost" onClick={() => setConfirmingClear(true)}>
          Clear History
        </button>
      </div>

      {confirmingClear && (
        <ConfirmModal
          title="Clear all stats history?"
          message="This permanently deletes every check-in and test result you've saved, and your coach loses your readiness history too. It can't be undone."
          confirmLabel="Clear history"
          danger
          onConfirm={() => {
            setConfirmingClear(false);
            clearStats();
          }}
          onCancel={() => setConfirmingClear(false)}
        />
      )}
    </div>
  );
}
