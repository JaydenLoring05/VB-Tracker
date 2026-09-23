"use client";

import { FormEvent, useState } from "react";

import { isValidVideoUrl } from "@/lib/film";
import { TeamCalendarEvent } from "@/types";

export function AddFilmForm({
  events,
  onAdd
}: {
  events: TeamCalendarEvent[];
  onAdd: (input: { title: string; videoUrl: string; eventId: string | null }) => Promise<boolean>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [eventId, setEventId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle("");
    setVideoUrl("");
    setEventId("");
    setFormError(null);
    setIsAdding(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedUrl = videoUrl.trim();

    if (!trimmedTitle || trimmedTitle.length > 120) {
      setFormError("Title must be 1-120 characters.");
      return;
    }

    if (!isValidVideoUrl(trimmedUrl)) {
      setFormError("Enter a valid http(s) video link.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const success = await onAdd({
      title: trimmedTitle,
      videoUrl: trimmedUrl,
      eventId: eventId || null
    });

    setSaving(false);
    if (success) reset();
  }

  if (!isAdding) {
    return (
      <button type="button" onClick={() => setIsAdding(true)}>
        Add Film
      </button>
    );
  }

  return (
    <form className="team-form add-film-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title (e.g. vs. Central – Set 3)"
        maxLength={120}
      />
      <input
        value={videoUrl}
        onChange={(event) => setVideoUrl(event.target.value)}
        placeholder="Video link (YouTube or other)"
      />
      <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
        <option value="">No linked event</option>
        {events.map((teamEvent) => (
          <option key={teamEvent.id} value={teamEvent.id}>
            {teamEvent.date} — {teamEvent.title}
          </option>
        ))}
      </select>

      {formError && (
        <div className="empty-state team-setup-error">
          <p className="muted">{formError}</p>
        </div>
      )}

      <div className="button-row">
        <button type="submit" disabled={saving}>
          {saving ? "Adding..." : "Add"}
        </button>
        <button type="button" className="secondary" onClick={reset}>
          Cancel
        </button>
      </div>
    </form>
  );
}
