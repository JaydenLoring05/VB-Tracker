"use client";

import { Trophy } from "lucide-react";

import { useWeeklyChallenge } from "@/hooks/useWeeklyChallenge";
import { challengePercent } from "@/lib/challenge";

/**
 * The weekly challenge on Today (G-06): one line that opens to progress, a
 * Join button, the leaderboard opt-in and the top of the leaderboard.
 */
export function ChallengeLine() {
  const { challenge, available, joined, onLeaderboard, leaderboardAllowed, myTotal, board, join, setLeaderboard } =
    useWeeklyChallenge();
  if (!challenge || !available) return null;

  const percent = challengePercent(myTotal, challenge.goal);
  const done = myTotal >= challenge.goal;

  return (
    <details className="today-line">
      <summary>
        <span className="today-line-label">Challenge</span>
        <span className="today-line-value">
          <strong>
            {Math.min(myTotal, challenge.goal)}/{challenge.goal}
          </strong>
          <span className="muted">{done ? "Done! 🎉" : challenge.unit}</span>
        </span>
      </summary>

      <div className="today-line-body challenge-body">
        <p className="challenge-title">
          <Trophy size={16} aria-hidden="true" /> {challenge.title}
        </p>
        <div
          className="progress-bar"
          role="progressbar"
          aria-label={`${challenge.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="muted">
          {challenge.metric === "jumps"
            ? "Reps you log on jump exercises (approach jumps, box jumps, hops, bounds) count."
            : "Every workout you finish counts."}{" "}
          Resets Monday.
        </p>

        {!joined ? (
          <button type="button" onClick={join}>
            Join this week&apos;s challenge
          </button>
        ) : leaderboardAllowed ? (
          <label className="challenge-optin">
            <input type="checkbox" checked={onLeaderboard} onChange={(e) => setLeaderboard(e.target.checked)} />
            Show me on the leaderboard (first name and last initial only)
          </label>
        ) : (
          <p className="muted">You&apos;re in! The leaderboard is for athletes 13 and up.</p>
        )}

        {board.length > 0 && (
          <ol className="challenge-board" aria-label="Leaderboard">
            {board.map((row, index) => (
              <li key={`${row.label}-${index}`} className={row.is_me ? "challenge-me" : undefined}>
                <span className="challenge-rank">{index + 1}</span>
                <span>{row.is_me ? `${row.label} (you)` : row.label}</span>
                <strong>{row.total}</strong>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
