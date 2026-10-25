"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { InlineError } from "@/components/shared/InlineError";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { useTeamExercises } from "@/hooks/useTeamExercises";
import { TEAM_FILTER, TeamExercise } from "@/lib/teamExercises";

import { ExerciseCard } from "./ExerciseCard";
import { TeamExerciseForm } from "./TeamExerciseForm";

const filters = [
  "All",
  "Jump Development",
  "Landing Mechanics",
  "Knee Strength",
  "Shoulder Health",
  "Hitting Power",
  "Rotational Core",
  "Speed & Agility",
  "Volleyball Conditioning",
  "Mobility",
  "Recovery"
];
const levels = ["All", "Beginner", "Intermediate", "Advanced"];

export function ExerciseLibrary() {
  const teamExercises = useTeamExercises();
  const isCoach = teamExercises.role === "coach" && Boolean(teamExercises.teamId);

  // undefined = closed, null = adding a new exercise.
  const [formFor, setFormFor] = useState<TeamExercise | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<TeamExercise | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    exerciseSearch,
    setExerciseSearch,
    selectedFilter,
    setSelectedFilter,
    selectedLevel,
    setSelectedLevel,
    expandedExercises,
    toggleExerciseCard,
    expandAllVisibleExercises,
    collapseAllExercises,
    libraryCount,
    filteredExercises
  } = useExerciseLibrary(teamExercises.exercises);

  const visibleFilters = teamExercises.exercises.length > 0 || selectedFilter === TEAM_FILTER
      ? ["All", TEAM_FILTER, ...filters.slice(1)] : filters;

  return (
    <section id="library" className="panel exercise-library">
      <div className="library-header">
        <div>
          <h2>
            Exercise Library
          </h2>
          <p className="muted">
            {filteredExercises.length} of {libraryCount} exercises shown
          </p>
        </div>

        <div className="library-actions">
          {isCoach && !teamExercises.notSetUp && (
            <button type="button" onClick={() => setFormFor(null)}>
              <Plus size={16} aria-hidden="true" /> Add exercise
            </button>
          )}
          <button className="ghost" onClick={expandAllVisibleExercises}>
            Expand Visible
          </button>
          <button className="ghost" onClick={collapseAllExercises}>
            Collapse All
          </button>
        </div>
      </div>

      {isCoach && teamExercises.notSetUp && (
        <p className="muted team-exercise-setup-note">
          Adding your own exercises needs one setup step on NextRep&apos;s side. Until then the library shows the
          built-in exercises.
        </p>
      )}

      {teamExercises.error && <InlineError message={teamExercises.error} onRetry={teamExercises.reload} />}
      {deleteError && <InlineError message={deleteError} />}

      <div className="library-search">
        <Search size={18} />
        <input
          type="text"
          aria-label="Search exercises"
          enterKeyHint="search"
          autoComplete="off"
          value={exerciseSearch}
          onChange={(e) => setExerciseSearch(e.target.value)}
          placeholder="Search exercises, cues, mistakes, knee, shoulder, jump..."
        />

        {exerciseSearch && (
          <button className="ghost" onClick={() => setExerciseSearch("")}>
            Clear
          </button>
        )}
      </div>

      <div className="filter-row">
        {visibleFilters.map((filter) => (
          <button
            key={filter}
            className={selectedFilter === filter ? "" : "ghost"}
            aria-pressed={selectedFilter === filter}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {levels.map((level) => (
          <button
            key={level}
            className={selectedLevel === level ? "" : "ghost"}
            aria-pressed={selectedLevel === level}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="empty-state">
          <h3>No exercises found.</h3>
          <p className="muted">
            Try searching something like jump, knee, shoulder, core, mobility, pull, or squat.
          </p>
        </div>
      )}

      <div className="exercise-grid">
        {filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.name}
            exercise={exercise}
            isExpanded={Boolean(expandedExercises[exercise.name])}
            onToggle={() => toggleExerciseCard(exercise.name)}
            actions={
              isCoach && exercise.teamExercise ? (
                <>
                  <button
                    type="button"
                    className="ghost"
                    aria-label={`Edit ${exercise.name}`}
                    onClick={() => setFormFor(exercise.teamExercise)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost danger-button"
                    aria-label={`Delete ${exercise.name}`}
                    onClick={() => setPendingDelete(exercise.teamExercise ?? null)}
                  >
                    Delete
                  </button>
                </>
              ) : undefined
            }
          />
        ))}
      </div>

      {formFor !== undefined && (
        <TeamExerciseForm
          editing={formFor}
          teamExercises={teamExercises.exercises}
          onSave={(payload) =>
            formFor ? teamExercises.updateExercise(formFor.id, payload) : teamExercises.addExercise(payload)
          }
          onClose={() => setFormFor(undefined)}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title={`Delete ${pendingDelete.name}?`}
          message="It comes out of the library for your whole team. Programs that use it keep the exercise, but Workout Mode stops showing its cues."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            const target = pendingDelete;
            setPendingDelete(null);
            setDeleteError(await teamExercises.deleteExercise(target.id));
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
