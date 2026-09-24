"use client";

import { useState } from "react";

import { exercises as exerciseCatalog } from "@/data/exercises";
import { getWorkoutDaysForPhase } from "@/data/workoutPlan";
import { getSubstitutionCandidates } from "@/hooks/useExerciseSubstitutions";
import { useTeamProgram } from "@/hooks/useTeamProgram";
import { PhaseSlug } from "@/lib/programResolution";
import { Exercise, Team } from "@/types";

const PHASES: { slug: PhaseSlug; label: string }[] = [
  { slug: "foundation", label: "Foundation" },
  { slug: "build", label: "Build" },
  { slug: "power", label: "Power" },
  { slug: "taper", label: "Taper" }
];

const PROTECTIVE_CATEGORIES: Exercise["category"][] = ["Shoulder Health", "Landing Mechanics", "Knee Strength"];

function missingProtectiveCategories(baseExercises: string[], currentExercises: string[]): string[] {
  const categoryOf = new Map(exerciseCatalog.map((exercise) => [exercise.name, exercise.category]));

  const baseCategories = new Set(baseExercises.map((name) => categoryOf.get(name)).filter(Boolean));
  const currentCategories = new Set(currentExercises.map((name) => categoryOf.get(name)).filter(Boolean));

  return PROTECTIVE_CATEGORIES.filter(
    (category) => baseCategories.has(category) && !currentCategories.has(category)
  );
}

function DayFullEditor({
  phase,
  day,
  baseExercises,
  currentExercises,
  onSave,
  onReset
}: {
  phase: PhaseSlug;
  day: string;
  baseExercises: string[];
  currentExercises: string[];
  onSave: (exercises: string[]) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(currentExercises);
  const [addChoice, setAddChoice] = useState("");
  const isEdited = JSON.stringify(currentExercises) !== JSON.stringify(baseExercises);
  const missingCategories = missingProtectiveCategories(baseExercises, draft);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  function remove(index: number) {
    setDraft(draft.filter((_, i) => i !== index));
  }

  function addExercise() {
    if (!addChoice || draft.includes(addChoice)) return;
    setDraft([...draft, addChoice]);
    setAddChoice("");
  }

  return (
    <div className="program-full-editor">
      <ul className="program-full-editor-list">
        {draft.map((exercise, index) => (
          <li key={exercise}>
            <span>{exercise}</span>
            <div className="program-full-editor-controls">
              <button type="button" className="ghost" onClick={() => move(index, -1)} disabled={index === 0}>
                Up
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => move(index, 1)}
                disabled={index === draft.length - 1}
              >
                Down
              </button>
              <button type="button" className="ghost danger-button" onClick={() => remove(index)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="program-full-editor-add">
        <select value={addChoice} onChange={(event) => setAddChoice(event.target.value)}>
          <option value="">Add an exercise...</option>
          {exerciseCatalog
            .filter((exercise) => !draft.includes(exercise.name))
            .map((exercise) => (
              <option key={exercise.name} value={exercise.name}>
                {exercise.name}
              </option>
            ))}
        </select>
        <button type="button" className="ghost" onClick={addExercise} disabled={!addChoice}>
          Add
        </button>
      </div>

      {missingCategories.length > 0 && (
        <p className="program-guardrail-warning">
          Heads up: this day no longer has any {missingCategories.join(" or ")} exercise
          {missingCategories.length > 1 ? "s" : ""}, which the original plan included here. This
          isn&apos;t blocked, just worth a second look before saving.
        </p>
      )}

      <div className="program-full-editor-actions">
        <button type="button" onClick={() => onSave(draft)} disabled={draft.length === 0}>
          Save {day}
        </button>
        {isEdited && (
          <button type="button" className="ghost" onClick={onReset}>
            Reset {day} to default
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgramEditor({ team }: { team: Team }) {
  const {
    loading,
    error,
    exerciseDefaults,
    setExerciseDefault,
    clearExerciseDefault,
    dayOverrides,
    setDayOverride,
    resetDayOverride
  } = useTeamProgram(team);
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
      <p className="muted program-intro">
        {team.name} already follows the standard four-phase plan, so athletes have a workout today with no setup.
        Change an exercise below and it updates for the whole team.
      </p>

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

      {days.map((day) => {
        const overrideKey = `${activePhase}-${day.day}`;
        const currentExercises = dayOverrides[overrideKey] ?? day.exercises;

        return (
          <div className="panel program-day-card" key={day.day}>
            <h3>
              {day.day}: {day.title}
            </h3>

            {team.plan_tier === "paid" ? (
              <DayFullEditor
                phase={activePhase}
                day={day.day}
                baseExercises={day.exercises}
                currentExercises={currentExercises}
                onSave={(exercises) => setDayOverride(activePhase, day.day, exercises)}
                onReset={() => resetDayOverride(activePhase, day.day)}
              />
            ) : (
              <>
                <p className="muted program-paid-gate">
                  Full day editing (add, remove, and reorder any exercise) is a paid-plan feature.
                  The preset picker below is available on every plan.
                </p>
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
