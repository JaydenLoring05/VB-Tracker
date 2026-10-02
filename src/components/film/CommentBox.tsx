"use client";

import { FormEvent, useState } from "react";

import { formatTimestamp } from "@/lib/film";

import { FilmAthlete } from "./TagDetailPanel";

const MAX_LENGTH = 280;

/**
 * A comment pinned to the video. The time is stamped when the coach starts
 * typing, so the comment lands on the moment they paused on, even if the
 * video keeps playing.
 */
export function CommentBox({
  athletes,
  getCurrentTime,
  onSave
}: {
  athletes: FilmAthlete[];
  getCurrentTime: () => number;
  onSave: (input: { seconds: number; athleteId: string | null; text: string }) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState<number | null>(null);
  const [athleteId, setAthleteId] = useState("");
  const [saving, setSaving] = useState(false);

  function stamp() {
    if (seconds === null) setSeconds(Math.floor(getCurrentTime()));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    const saved = await onSave({
      seconds: seconds ?? Math.floor(getCurrentTime()),
      athleteId: athleteId || null,
      text: trimmed
    });
    setSaving(false);

    if (saved) {
      setText("");
      setSeconds(null);
    }
  }

  return (
    <form className="film-comment-box" onSubmit={handleSubmit}>
      <div className="film-comment-row">
        <span className="film-comment-time" aria-live="polite">
          {seconds === null ? "Comment" : `At ${formatTimestamp(seconds)}`}
        </span>
        {seconds !== null && (
          <button type="button" className="ghost film-comment-restamp" onClick={() => setSeconds(Math.floor(getCurrentTime()))}>
            Use current time
          </button>
        )}
      </div>
      <textarea
        value={text}
        maxLength={MAX_LENGTH}
        rows={2}
        aria-label="Comment at the current video time"
        placeholder="What should they see here?"
        onFocus={stamp}
        onBlur={() => {
          if (!text.trim()) setSeconds(null);
        }}
        onChange={(event) => {
          stamp();
          setText(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <div className="film-comment-row">
        <label className="film-comment-for">
          <span className="sr-only">Comment for</span>
          <select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
            <option value="">Whole team</option>
            {athletes.map((athlete) => (
              <option key={athlete.userId} value={athlete.userId}>
                {athlete.displayName}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!text.trim() || saving}>
          {saving ? "Saving..." : "Add comment"}
        </button>
      </div>
    </form>
  );
}
