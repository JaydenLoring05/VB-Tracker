"use client";

import { Trash2 } from "lucide-react";

import { formatTimestamp } from "@/lib/film";
import { FilmTag } from "@/types";

import { TAG_LABELS } from "./tagMeta";

export function TagList({
  tags,
  isCoach,
  onSeek,
  onDelete
}: {
  tags: FilmTag[];
  isCoach: boolean;
  onSeek: (seconds: number) => void;
  onDelete: (tag: FilmTag) => void;
}) {
  if (tags.length === 0) {
    return (
      <div className="empty-state">
        <p className="muted">No tags yet.</p>
      </div>
    );
  }

  return (
    <ul className="film-tag-list">
      {tags.map((tag) => (
        <li key={tag.id} className="film-tag-item">
          <button type="button" className="ghost film-tag-timestamp" onClick={() => onSeek(tag.seconds)}>
            {formatTimestamp(tag.seconds)}
          </button>
          <span className="film-tag-type">{TAG_LABELS[tag.tag]}</span>
          {tag.note && <span className="muted film-tag-note">{tag.note}</span>}
          {isCoach && (
            <button
              type="button"
              className="ghost film-tag-delete"
              aria-label="Delete tag"
              onClick={() => onDelete(tag)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
