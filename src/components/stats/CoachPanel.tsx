"use client";

import { HeartPulse } from "lucide-react";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";

export function CoachPanel() {
  const { coachTips } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>
        <HeartPulse size={22} /> AI Coach
      </h2>

      <ul>
        {coachTips.map((item) => (
          <li key={item} className="muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
