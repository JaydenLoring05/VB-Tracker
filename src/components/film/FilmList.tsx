"use client";

import { Trash2 } from "lucide-react";

import { TeamFilm } from "@/types";

export function FilmList({
  films,
  selectedFilmId,
  isCoach,
  onSelect,
  onDelete
}: {
  films: TeamFilm[];
  selectedFilmId: string | null;
  isCoach: boolean;
  onSelect: (id: string) => void;
  onDelete: (film: TeamFilm) => void;
}) {
  if (films.length === 0) {
    return (
      <div className="empty-state">
        <p className="muted">No film uploaded yet.</p>
      </div>
    );
  }

  return (
    <ul className="film-list">
      {films.map((film) => (
        <li key={film.id} className={film.id === selectedFilmId ? "film-list-item active" : "film-list-item"}>
          <button type="button" className="film-list-item-button" onClick={() => onSelect(film.id)}>
            {film.title}
          </button>
          {isCoach && (
            <button
              type="button"
              className="ghost film-list-item-delete"
              aria-label={`Delete ${film.title}`}
              onClick={() => onDelete(film)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
