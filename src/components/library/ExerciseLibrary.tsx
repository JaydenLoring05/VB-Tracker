"use client";

import { Library, Search } from "lucide-react";

import { exercises } from "@/data/exercises";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";

import { ExerciseCard } from "./ExerciseCard";

const filters = ["All", "Lower Body", "Upper Body", "Plyometrics", "Core", "Mobility", "Rehab"];

export function ExerciseLibrary() {
  const {
    exerciseSearch,
    setExerciseSearch,
    selectedFilter,
    setSelectedFilter,
    expandedExercises,
    toggleExerciseCard,
    expandAllVisibleExercises,
    collapseAllExercises,
    filteredExercises
  } = useExerciseLibrary();

  return (
    <section id="library" className="panel exercise-library">
      <div className="library-header">
        <div>
          <h2>
            <Library size={22} /> Exercise Library
          </h2>
          <p className="muted">
            {filteredExercises.length} of {exercises.length} exercises shown
          </p>
        </div>

        <div className="library-actions">
          <button className="ghost" onClick={expandAllVisibleExercises}>
            Expand Visible
          </button>
          <button className="ghost" onClick={collapseAllExercises}>
            Collapse All
          </button>
        </div>
      </div>

      <div className="library-search">
        <Search size={18} />
        <input
          type="text"
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
        {filters.map((filter) => (
          <button
            key={filter}
            className={selectedFilter === filter ? "" : "ghost"}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
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
          />
        ))}
      </div>
    </section>
  );
}
