"use client";

import { useState } from "react";

import { parseTimestamp } from "@/lib/film";
import { FilmTagType } from "@/types";

import { TAG_LABELS, TAG_TYPES } from "./tagMeta";

export function AddTagControls({
  isYouTube,
  getCurrentTime,
  onAddTag
}: {
  isYouTube: boolean;
  getCurrentTime: () => number;
  onAddTag: (input: { seconds: number; tag: FilmTagType }) => void;
}) {
  const [manualTime, setManualTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);

  function handleTag(tag: FilmTagType) {
    if (isYouTube) {
      onAddTag({ seconds: Math.floor(getCurrentTime()), tag });
      return;
    }

    const seconds = parseTimestamp(manualTime);
    if (seconds === null) {
      setTimeError("Enter a time like 1:23.");
      return;
    }

    setTimeError(null);
    onAddTag({ seconds, tag });
  }

  return (
    <div className="add-tag-controls">
      {!isYouTube && (
        <div className="add-tag-manual-time">
          <input
            value={manualTime}
            onChange={(event) => setManualTime(event.target.value)}
            placeholder="Time (MM:SS)"
          />
          {timeError && <p className="muted">{timeError}</p>}
        </div>
      )}

      <div className="button-row">
        {TAG_TYPES.map((tag) => (
          <button key={tag} type="button" className="ghost" onClick={() => handleTag(tag)}>
            {TAG_LABELS[tag]}
          </button>
        ))}
      </div>
    </div>
  );
}
