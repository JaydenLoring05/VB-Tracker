"use client";

import { useTrackerContext } from "@/context/TrackerContext";
import { POSITION_PROGRAMS } from "@/data/positionPrograms";
import { getPhase } from "@/data/workoutPlan";
import { useWorkoutLogs } from "@/hooks/useWorkoutLogs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { startingProgramKeyFromId } from "@/lib/positionProgram";

import { StartingProgramPicker } from "./StartingProgramPicker";

export function PhaseSummary() {
  const { week } = useWorkoutProgress();
  const { weeklyLogCount } = useWorkoutLogs();
  const { teamOverride } = useTrackerContext();
  const phase = getPhase(week);
  const customProgram = teamOverride?.customProgram;
  const startingKey = startingProgramKeyFromId(customProgram?.id);

  if (startingKey) {
    const template = POSITION_PROGRAMS[startingKey];
    return (
      <section className="panel">
        <p className="micro micro-gold">Starting program</p>
        <h2>{template.program.name}</h2>
        <p className="muted">{template.focus} The week repeats; your coach can assign a different program any time.</p>
        <StartingProgramPicker />
        <p className="muted">Workout logs this week: {weeklyLogCount}</p>
      </section>
    );
  }

  if (customProgram) {
    return (
      <section className="panel">
        <p className="micro micro-gold">Coach&apos;s program</p>
        <h2>{customProgram.name}</h2>
        <p className="muted">Your coach built this week. It repeats until they change it.</p>
        <p className="muted">Workout logs this week: {weeklyLogCount}</p>
      </section>
    );
  }

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
      <StartingProgramPicker />
      <p className="muted">Workout logs this week: {weeklyLogCount}</p>
    </section>
  );
}
