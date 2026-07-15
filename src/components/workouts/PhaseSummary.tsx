"use client";

import { getPhase } from "@/data/workoutPlan";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";

export function PhaseSummary() {
  const { week } = useWorkoutProgress();
  const { weeklyLogCount } = useWorkoutLogs();
  const phase = getPhase(week);

  return (
    <section className="panel">
      <h2>{phase.name}</h2>
      <p>
        <strong>Focus:</strong> {phase.focus}
      </p>
      <p>
        <strong>Intensity:</strong> {phase.intensity}
      </p>
      <p>
        <strong>Progression:</strong> {phase.sets}
      </p>
      <p className="muted">Workout logs this week: {weeklyLogCount}</p>
    </section>
  );
}
