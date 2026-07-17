"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";

import { exercises } from "@/data/exercises";
import { usePRs } from "@/hooks/usePRs";

export function PRTracker() {
  const { prs, addPR, deletePR } = usePRs();

  const [prExercise, setPrExercise] = useState("");
  const [prValue, setPrValue] = useState("");
  const [prUnit, setPrUnit] = useState("lbs");
  const [prNote, setPrNote] = useState("");

  function handleAddPR() {
    if (!prValue.trim()) return;

    addPR({
      exercise: prExercise || exercises[0]?.name || "Custom PR",
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
        <Trophy size={22} /> PR Tracker
      </h2>

      <div className="pr-form">
        <select value={prExercise} onChange={(e) => setPrExercise(e.target.value)}>
          <option value="">Select Exercise</option>
          {exercises.map((exercise) => (
            <option key={exercise.name} value={exercise.name}>
              {exercise.name}
            </option>
          ))}
        </select>

        <input
          value={prValue}
          onChange={(e) => setPrValue(e.target.value)}
          placeholder="PR value, ex: 225 x 5 or 34in"
        />

        <select value={prUnit} onChange={(e) => setPrUnit(e.target.value)}>
          <option value="lbs">lbs</option>
          <option value="reps">reps</option>
          <option value="inches">inches</option>
          <option value="seconds">seconds</option>
          <option value="touch">touch</option>
          <option value="notes">notes</option>
        </select>

        <input
          value={prNote}
          onChange={(e) => setPrNote(e.target.value)}
          placeholder="Optional note"
        />

        <button onClick={handleAddPR}>Add PR</button>
      </div>

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

            <button className="ghost danger-button" onClick={() => deletePR(pr.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
