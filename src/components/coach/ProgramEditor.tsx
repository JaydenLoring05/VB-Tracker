"use client";

import { useState } from "react";

import { getWorkoutDaysForPhase } from "@/data/workoutPlan";
import { getSubstitutionCandidates } from "@/hooks/useExerciseSubstitutions";
import { useTeamProgram } from "@/hooks/useTeamProgram";
import { PhaseSlug } from "@/lib/programResolution";
import { Team } from "@/types";

const PHASES: { slug: PhaseSlug; label: string }[] = [
  { slug: "foundation", label: "Foundation" },
  { slug: "build", label: "Build" },
  { slug: "power", label: "Power" },
  { slug: "taper", label: "Taper" }
];

export function ProgramEditor({ team }: { team: Team }) {
  const { loading, error, exerciseDefaults, setExerciseDefault, clearExerciseDefault } = useTeamProgram(team);
  const [activePhase, setActivePhase] = useState<PhaseSlug>("foundation");

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading program...</p>
      </div>
    );
  }

  const days = getWorkoutDaysForPhase(activePhase).filter((day) => !day.rest);

  return (
    <div className="program-editor">
      <div className="tabs program-phase-tabs">
        {PHASES.map((phase) => (
          <button
            key={phase.slug}
            type="button"
            className={activePhase === phase.slug ? "" : "ghost"}
            onClick={() => setActivePhase(phase.slug)}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="empty-state">
          <p className="muted">{error}</p>
        </div>
      )}

      {days.map((day) => (
        <div className="panel program-day-card" key={day.day}>
          <h3>{day.day} -- {day.title}</h3>

          <div className="program-exercise-list">
            {day.exercises.map((exercise) => {
              const current = exerciseDefaults[exercise] ?? exercise;
              const candidates = getSubstitutionCandidates(exercise);

              return (
                <div className="program-exercise-row" key={exercise}>
                  <span className="program-exercise-original muted">{exercise}</span>
                  <select
                    value={current}
                    onChange={(event) => {
                      const chosen = event.target.value;
                      if (chosen === exercise) {
                        clearExerciseDefault(exercise);
                      } else {
                        setExerciseDefault(exercise, chosen);
                      }
                    }}
                  >
                    <option value={exercise}>{exercise} (original)</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.name} value={candidate.name}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
