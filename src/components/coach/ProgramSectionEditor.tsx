import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { WholeNumberInput } from "@/components/shared/WholeNumberInput";
import { exercises as exerciseCatalog } from "@/data/exercises";
import { getExerciseMeasure } from "@/lib/exerciseMeasure";
import {
  exerciseKey,
  hasStartingTargets,
  newProgramExercise,
  ProgramExercise,
  ProgramSection
} from "@/lib/customProgram";

/**
 * The parts of the plan builder that edit exercises: one exercise row, one
 * section of rows, and the suggestions list the name boxes share. Used by the
 * builder (CustomProgramPanel) and the preview of a plan being brought in.
 */

/** Suggestions for every exercise name box: the library, then the coach's own exercises. */
export const EXERCISE_SUGGESTIONS_ID = "custom-program-exercise-library";

export function ExerciseSuggestions({
  remembered,
  typing
}: {
  /** The coach's own exercises from this and earlier programs. */
  remembered: ProgramExercise[];
  /** Text of the name box being typed in, so its own half-typed text isn't offered back. */
  typing: string | null;
}) {
  return (
    <datalist id={EXERCISE_SUGGESTIONS_ID}>
      {exerciseCatalog.map((exercise) => (
        <option key={exercise.name} value={exercise.name} />
      ))}
      {remembered
        .filter((exercise) => typing == null || exerciseKey(exercise.name) !== exerciseKey(typing))
        .map((exercise) => (
          <option key={`own-${exercise.name}`} value={exercise.name} label={`${exercise.name} (yours)`} />
        ))}
    </datalist>
  );
}

export function ExerciseRow({
  exercise,
  index,
  count,
  remembered,
  onTyping,
  onChange,
  onMove,
  onRemove
}: {
  exercise: ProgramExercise;
  index: number;
  count: number;
  /** The coach's own exercises from this and earlier programs. */
  remembered: ProgramExercise[];
  /** The name box that has focus and its text, or null when none does. */
  onTyping: (name: string | null) => void;
  onChange: (next: ProgramExercise) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const timed = exercise.seconds != null;

  return (
    <li className="custom-program-exercise">
      <input
        className="custom-program-exercise-name"
        list={EXERCISE_SUGGESTIONS_ID}
        aria-label="Exercise"
        placeholder="Exercise name"
        value={exercise.name}
        onFocus={() => onTyping(exercise.name)}
        onBlur={() => onTyping(null)}
        onChange={(event) => {
          const name = event.target.value;
          onTyping(name);
          // One of the coach's own exercises picked from the suggestions (the text arrives in
          // one jump, not one letter): bring back the sets and reps it had last time, unless
          // this row's targets were already changed. Typing letter by letter never does this,
          // so "Step-up" on the way to "Step-up lateral" doesn't pull in the wrong targets.
          const picked = Math.abs(name.length - exercise.name.length) > 1;
          const before = remembered.find((r) => exerciseKey(r.name) === exerciseKey(name));
          if (picked && before && hasStartingTargets(exercise)) {
            onChange({ ...before, name });
            return;
          }
          // Follow the name's usual measure (Planks -> seconds) unless the
          // coach already switched this row away from its default.
          const followsDefault = timed === (getExerciseMeasure(exercise.name) === "time");
          const nextTimed = getExerciseMeasure(name) === "time";
          if (followsDefault && nextTimed !== timed) {
            onChange(nextTimed ? { ...exercise, name, seconds: 30, reps: null } : { ...exercise, name, seconds: null, reps: "8" });
          } else {
            onChange({ ...exercise, name });
          }
        }}
      />
      <div className="custom-program-target">
        <WholeNumberInput
          aria-label={`Sets for ${exercise.name || "exercise"}`}
          value={exercise.sets}
          onCommit={(sets) => onChange({ ...exercise, sets })}
        />
        <span aria-hidden="true">sets ×</span>
        {timed ? (
          <WholeNumberInput
            aria-label={`Seconds for ${exercise.name || "exercise"}`}
            value={exercise.seconds}
            onCommit={(seconds) => onChange({ ...exercise, seconds })}
          />
        ) : (
          <input
            inputMode="numeric"
            aria-label={`Reps for ${exercise.name || "exercise"}`}
            placeholder="8-10"
            // Rows brought in from a plan can arrive without reps: show which ones still need them.
            aria-invalid={!exercise.reps?.trim()}
            className={`custom-program-reps${exercise.reps?.trim() ? "" : " needs-target"}`}
            value={exercise.reps ?? ""}
            onChange={(event) => onChange({ ...exercise, reps: event.target.value })}
          />
        )}
        <div className="custom-program-measure" role="group" aria-label="Measure">
          <button
            type="button"
            className={timed ? "ghost" : ""}
            aria-pressed={!timed}
            onClick={() => onChange({ ...exercise, seconds: null, reps: exercise.reps ?? "8" })}
          >
            Reps
          </button>
          <button
            type="button"
            className={timed ? "" : "ghost"}
            aria-pressed={timed}
            onClick={() => onChange({ ...exercise, seconds: exercise.seconds ?? 30, reps: null })}
          >
            Sec
          </button>
        </div>
      </div>
      <div className="custom-program-row-controls">
        <button type="button" className="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
          <ArrowUp size={14} />
        </button>
        <button type="button" className="ghost" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
          <ArrowDown size={14} />
        </button>
        <button type="button" className="ghost danger-button" onClick={onRemove} aria-label={`Remove ${exercise.name || "exercise"}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

/** One section's exercises, with its name box when the day has more than one section. */
export function SectionEditor({
  section,
  dayName,
  showName,
  namePlaceholder = "Section name, e.g. Abs",
  remembered,
  onTyping,
  onChange,
  onRemove
}: {
  section: ProgramSection;
  dayName: string;
  showName: boolean;
  /** What an empty name box shows: what athletes will see as its heading, or an example. */
  namePlaceholder?: string;
  remembered: ProgramExercise[];
  onTyping: (name: string | null) => void;
  onChange: (next: ProgramSection) => void;
  /** Absent when the section can't be removed (a day's only section). */
  onRemove?: () => void;
}) {
  function updateExercise(index: number, next: ProgramExercise) {
    onChange({ ...section, exercises: section.exercises.map((exercise, i) => (i === index ? next : exercise)) });
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= section.exercises.length) return;
    const exercises = [...section.exercises];
    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    onChange({ ...section, exercises });
  }

  return (
    <div className="custom-program-section">
      {showName && (
        <div className="custom-program-section-header">
          <input
            aria-label={`Section name on ${dayName}`}
            placeholder={namePlaceholder}
            value={section.name}
            // A section just added has no name yet: put the cursor there.
            autoFocus={section.name === "" && section.exercises.length === 0}
            onChange={(event) => onChange({ ...section, name: event.target.value })}
          />
          {onRemove && (
            <button
              type="button"
              className="ghost danger-button"
              onClick={onRemove}
              aria-label={`Remove section ${section.name || "with no name"} on ${dayName}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      <ul className="custom-program-exercises">
        {section.exercises.map((exercise, index) => (
          <ExerciseRow
            key={index}
            exercise={exercise}
            index={index}
            count={section.exercises.length}
            remembered={remembered}
            onTyping={onTyping}
            onChange={(next) => updateExercise(index, next)}
            onMove={(direction) => moveExercise(index, direction)}
            onRemove={() => onChange({ ...section, exercises: section.exercises.filter((_, i) => i !== index) })}
          />
        ))}
      </ul>

      <button
        type="button"
        className="ghost"
        onClick={() => onChange({ ...section, exercises: [...section.exercises, newProgramExercise("")] })}
      >
        <Plus size={14} /> Add exercise
      </button>
    </div>
  );
}
