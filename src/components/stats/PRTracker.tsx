"use client";

import { useState } from "react";

import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { PRRecord } from "@/context/TrackerContext";
import { exercises } from "@/data/exercises";
import { usePRs } from "@/hooks/usePRs";

export function PRTracker() {
  const { prs, addPR, deletePR } = usePRs();

  const [prExercise, setPrExercise] = useState("");
  const [prValue, setPrValue] = useState("");
  const [prUnit, setPrUnit] = useState("lbs");
  const [prNote, setPrNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PRRecord | null>(null);

  function handleAddPR() {
    // Saving under the first exercise in the library when none was picked
    // put PRs on the wrong lift; ask instead.
    const problem = !prExercise ? "Pick the exercise this PR is for." : !prValue.trim() ? "Enter the PR value." : null;
    setFormError(problem);
    if (problem) return;

    addPR({
      exercise: prExercise,
      value: prValue.trim(),
      unit: prUnit,
      note: prNote.trim()
    });

    setPrValue("");
    setPrNote("");
  }

  return (
    <div className="panel">
      <h2>
        PR Tracker
      </h2>

      <div className="pr-form">
        <select
          aria-label="Exercise"
          value={prExercise}
          onChange={(e) => {
            setPrExercise(e.target.value);
            setFormError(null);
          }}
          aria-invalid={formError && !prExercise ? true : undefined}
          aria-describedby={formError ? "pr-form-error" : undefined}
        >
          <option value="">Select Exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.name} value={exercise.name}>
              {exercise.name}
            </option>
          ))}
        </select>

        <input
          aria-label="PR value"
          autoComplete="off"
          value={prValue}
          onChange={(e) => setPrValue(e.target.value)}
          placeholder="PR value, ex: 225 x 5 or 34in"
        />

        <select aria-label="Unit" value={prUnit} onChange={(e) => setPrUnit(e.target.value)}>
          <option value="lbs">lbs</option>
          <option value="reps">reps</option>
          <option value="inches">inches</option>
          <option value="seconds">seconds</option>
          <option value="touch">touch</option>
          <option value="notes">notes</option>
        </select>

        <input
          aria-label="Note, optional"
          value={prNote}
          onChange={(e) => setPrNote(e.target.value)}
          placeholder="Optional note"
        />

        <button onClick={handleAddPR}>Add PR</button>
      </div>
      {formError && (
        <p className="pr-form-error" id="pr-form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="pr-list">
        {prs.length === 0 && (
          <div className="empty-state">
            <p className="muted">No PRs yet. Log a lift above or hit one in Workout Mode.</p>
          </div>
        )}

        {prs.slice(0, 8).map((pr) => (
          <div className="pr-card" key={pr.id}>
            <div>
              <strong>{pr.exercise}</strong>
              <p>
                {pr.value} {pr.unit}
              </p>
              <span className="muted">
                {pr.date}
                {pr.note ? ` • ${pr.note}` : ""}
              </span>
            </div>

            <button
              className="ghost danger-button"
              onClick={() => setPendingDelete(pr)}
              aria-label={`Delete ${pr.exercise} PR`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Delete this PR?"
          message={`Remove ${pendingDelete.exercise}: ${pendingDelete.value} ${pendingDelete.unit} from your PR board?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deletePR(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
