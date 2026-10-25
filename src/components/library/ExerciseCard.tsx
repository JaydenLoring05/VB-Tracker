"use client";

import { ReactNode } from "react";

import { LibraryExercise } from "@/lib/teamExercises";

export function ExerciseCard({
  exercise,
  isExpanded,
  onToggle,
  actions
}: {
  exercise: LibraryExercise;
  isExpanded: boolean;
  onToggle: () => void;
  /** Edit and Delete on a team exercise, for its coach. */
  actions?: ReactNode;
}) {
  const isTeam = Boolean(exercise.teamExercise);
  const cues = exercise.cues ?? [];
  const mistakes = exercise.mistakes ?? [];
  const substitutions = exercise.substitutions ?? [];

  return (
    <div
      className={`exercise-card exercise-card-detailed ${isExpanded ? "expanded" : ""}`}
    >
      <div className="exercise-card-top">
        <div className="exercise-icon">{exercise.icon}</div>

        <div className="exercise-content">
          <div className="exercise-heading">
            <h3>{exercise.name}</h3>
            <div className="exercise-tags">
              <span className="exercise-category">{exercise.category}</span>
              {exercise.level && (
                <span className={`exercise-level exercise-level-${exercise.level.toLowerCase()}`}>
                  {exercise.level}
                </span>
              )}
            </div>
          </div>

          {isTeam && (
            <p className="exercise-team-line">
              Your team&apos;s exercise{exercise.teamExercise?.measure === "time" ? " · done for time" : ""}
            </p>
          )}
          {exercise.purpose && <p className="muted">{exercise.purpose}</p>}
        </div>
      </div>

      {isExpanded && (
        <div className="exercise-details">
          <div>
            <h4>Coaching Cues</h4>
            {cues.length > 0 ? (
              <ul>
                {cues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            ) : (
              <p className="muted exercise-details-empty">No cues written yet.</p>
            )}
          </div>

          {mistakes.length > 0 && (
            <div>
              <h4>Common Mistakes</h4>
              <ul>
                {mistakes.map((mistake) => (
                  <li key={mistake}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {substitutions.length > 0 && (
            <div>
              <h4>Substitutions</h4>
              <ul>
                {substitutions.map((substitution) => (
                  <li key={substitution}>{substitution}</li>
                ))}
              </ul>
            </div>
          )}

          {exercise.video && (
            <a className="video-link" href={exercise.video} target="_blank" rel="noreferrer noopener">
              {isTeam ? "Watch video" : "Watch form video"} <span aria-hidden="true">→</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}

          {actions && <div className="exercise-card-actions">{actions}</div>}
        </div>
      )}

      <button type="button" className="view-details-button" onClick={onToggle} aria-expanded={isExpanded}>
        {isExpanded ? "Hide Details" : "View Details"}
      </button>
    </div>
  );
}
