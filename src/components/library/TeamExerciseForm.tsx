"use client";

import { FormEvent, useId, useState } from "react";

import { ModalDialog } from "@/components/shared/ModalDialog";
import {
  CUES_MAX,
  emptyTeamExerciseInput,
  EXERCISE_CATEGORIES,
  NAME_MAX,
  PURPOSE_MAX,
  TeamExercise,
  TeamExerciseErrors,
  TeamExerciseInput,
  TeamExercisePayload,
  teamExerciseToInput,
  validateTeamExerciseInput
} from "@/lib/teamExercises";

/**
 * Add or edit one of the team's own exercises (F-22). Only the name is
 * required; everything else can be filled in later.
 */
export function TeamExerciseForm({
  editing,
  teamExercises,
  onSave,
  onClose
}: {
  /** The exercise being edited, or null to add a new one. */
  editing: TeamExercise | null;
  teamExercises: TeamExercise[];
  /** Resolves to null when saved, or a message to show. */
  onSave: (payload: TeamExercisePayload) => Promise<string | null>;
  onClose: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState<TeamExerciseInput>(() =>
    editing ? teamExerciseToInput(editing) : emptyTeamExerciseInput()
  );
  const [errors, setErrors] = useState<TeamExerciseErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const title = editing ? `Edit ${editing.name}` : "Add an exercise";

  function set<K extends keyof TeamExerciseInput>(key: K, value: TeamExerciseInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;

    const result = validateTeamExerciseInput(values, teamExercises, editing?.id ?? null);
    if (!result.ok) {
      setErrors(result.errors);
      // Land on the first field that needs fixing.
      const first = (["name", "purpose", "cues", "videoUrl"] as const).find((key) => result.errors[key]);
      if (first) {
        event.currentTarget
          .querySelector<HTMLElement>(`[data-field="${first}"]`)
          ?.focus();
      }
      return;
    }

    setErrors({});
    setSaveError(null);
    setSaving(true);
    const message = await onSave(result.payload);
    setSaving(false);

    if (message) {
      setSaveError(message);
      return;
    }
    onClose();
  }

  const fieldError = (key: keyof TeamExerciseErrors) =>
    errors[key] ? (
      <span id={`${id}-${key}-error`} className="team-exercise-error" role="alert">
        {errors[key]}
      </span>
    ) : null;

  const describedBy = (key: keyof TeamExerciseErrors, hint?: string) =>
    [errors[key] ? `${id}-${key}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <ModalDialog label={title} onClose={onClose} cardClassName="team-exercise-card">
      <h2>{title}</h2>
      <p className="muted">
        Your athletes see it in the Exercise Library, and its cues show in Workout Mode when a program uses it.
      </p>

      <form className="team-exercise-form" onSubmit={handleSubmit} noValidate>
        <label className="team-exercise-field">
          <span>Name</span>
          <input
            data-autofocus
            data-field="name"
            value={values.name}
            maxLength={NAME_MAX}
            autoComplete="off"
            onChange={(event) => set("name", event.target.value)}
            placeholder="e.g. Box step-up with knee drive"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name", editing ? `${id}-name-hint` : undefined)}
          />
          {editing && (
            <span id={`${id}-name-hint`} className="muted team-exercise-hint">
              Programs find this exercise by its name. If you rename it, update programs that use it too.
            </span>
          )}
          {fieldError("name")}
        </label>

        <div className="team-exercise-row">
          <label className="team-exercise-field">
            <span>Category</span>
            <select value={values.category} onChange={(event) => set("category", event.target.value)}>
              {EXERCISE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="team-exercise-field team-exercise-measure">
            <legend>Logged in</legend>
            <label>
              <input
                type="radio"
                name={`${id}-measure`}
                value="reps"
                checked={values.measure !== "time"}
                onChange={() => set("measure", "reps")}
              />
              Reps
            </label>
            <label>
              <input
                type="radio"
                name={`${id}-measure`}
                value="time"
                checked={values.measure === "time"}
                onChange={() => set("measure", "time")}
              />
              Time
            </label>
          </fieldset>
        </div>

        <label className="team-exercise-field">
          <span>
            What it&apos;s for <span className="muted">(optional)</span>
          </span>
          <input
            value={values.purpose}
            data-field="purpose"
            maxLength={PURPOSE_MAX}
            onChange={(event) => set("purpose", event.target.value)}
            placeholder="e.g. Single-leg strength for the approach"
            aria-invalid={Boolean(errors.purpose)}
            aria-describedby={describedBy("purpose")}
          />
          {fieldError("purpose")}
        </label>

        <label className="team-exercise-field">
          <span>
            Coaching cues <span className="muted">(optional, one per line, up to {CUES_MAX})</span>
          </span>
          <textarea
            rows={4}
            value={values.cuesText}
            data-field="cues"
            onChange={(event) => set("cuesText", event.target.value)}
            placeholder={"e.g. Whole foot on the box\nDrive the knee up"}
            aria-invalid={Boolean(errors.cues)}
            aria-describedby={describedBy("cues")}
          />
          {fieldError("cues")}
        </label>

        <label className="team-exercise-field">
          <span>
            Video link <span className="muted">(optional)</span>
          </span>
          <input
            type="url"
            inputMode="url"
            value={values.videoUrl}
            data-field="videoUrl"
            autoComplete="off"
            onChange={(event) => set("videoUrl", event.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            aria-invalid={Boolean(errors.videoUrl)}
            aria-describedby={describedBy("videoUrl")}
          />
          {fieldError("videoUrl")}
        </label>

        {saveError && (
          <p className="team-exercise-error" role="alert">
            {saveError}
          </p>
        )}

        <div className="button-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editing ? "Save changes" : "Add exercise"}
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
