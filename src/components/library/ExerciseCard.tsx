"use client";

import { Exercise } from "@/types";

export function ExerciseCard({
  exercise,
  isExpanded,
  onToggle
}: {
  exercise: Exercise;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`exercise-card exercise-card-detailed ${isExpanded ? "expanded" : ""}`}
    >
      <div className="exercise-card-top">
        <div className="exercise-icon">{exercise.icon}</div>

        <div className="exercise-content">
          <div className="exercise-heading">
            <h3>{exercise.name}</h3>
            <span className="exercise-category">{exercise.category}</span>
          </div>

          <p className="muted">{exercise.purpose}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="exercise-details">
          <div>
            <h4>Coaching Cues</h4>
            <ul>
              {(exercise.cues ?? []).map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Common Mistakes</h4>
            <ul>
              {(exercise.mistakes ?? []).map((mistake) => (
                <li key={mistake}>{mistake}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Substitutions</h4>
            <ul>
              {(exercise.substitutions ?? []).map((substitution) => (
                <li key={substitution}>{substitution}</li>
              ))}
            </ul>
          </div>

          <a className="video-link" href={exercise.video} target="_blank" rel="noreferrer">
            Watch form video →
          </a>
        </div>
      )}

      <button className="view-details-button" onClick={onToggle}>
        {isExpanded ? "Hide Details" : "View Details"}
      </button>
    </div>
  );
}
