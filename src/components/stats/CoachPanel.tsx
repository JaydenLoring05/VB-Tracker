"use client";

import { HeartPulse } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";

export function CoachPanel() {
  const { coachTips, hasLoggedStats } = useRecoveryStats();

  return (
    <div className="panel">
      <h2>
        <HeartPulse size={22} /> Recovery Coach
      </h2>

      {hasLoggedStats ? (
        <ul>
          {coachTips.map((item) => (
            <li key={item} className="muted">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={HeartPulse}
          title="Advice starts after your first check-in"
          description="Save today's sleep, energy and soreness on the form. You'll get specific training guidance here, like when to back off jumps."
        />
      )}
    </div>
  );
}
