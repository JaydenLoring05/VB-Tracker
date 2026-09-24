"use client";

import { Clapperboard } from "lucide-react";
import { useState } from "react";

import { AddFilmForm } from "@/components/film/AddFilmForm";
import { FilmList } from "@/components/film/FilmList";
import { FilmPanel } from "@/components/film/FilmPanel";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useTeam } from "@/hooks/useTeam";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { useTeamFilm } from "@/hooks/useTeamFilm";
import { FilmTag, TeamFilm } from "@/types";

import "@/styles/film.css";

export default function FilmPage() {
  const { loading: teamLoading, activeTeam, role } = useTeam();
  const { events } = useTeamCalendar(activeTeam);
  const {
    loading,
    films,
    selectedFilm,
    selectedFilmId,
    selectFilm,
    tags,
    error,
    addFilm,
    deleteFilm,
    addTag,
    deleteTag
  } = useTeamFilm(activeTeam);

  const [pendingDeleteFilm, setPendingDeleteFilm] = useState<TeamFilm | null>(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState<FilmTag | null>(null);

  const isCoach = role === "coach";

  if (teamLoading || loading) {
    return (
      <div className="panel">
        <p className="muted">Loading film...</p>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className="panel">
        <h2>
          <Clapperboard size={22} /> Film
        </h2>
        <p className="muted">Join or create a team to start reviewing film.</p>
      </div>
    );
  }

  return (
    <section className="lower-grid film-page" style={{ marginTop: 0 }}>
      <div className="panel film-library-panel">
        <h2>
          <Clapperboard size={22} /> Film
        </h2>

        {error && (
          <div className="empty-state team-setup-error">
            <p className="muted">{error}</p>
          </div>
        )}

        {isCoach && <AddFilmForm events={events} onAdd={addFilm} />}

        <FilmList
          films={films}
          selectedFilmId={selectedFilmId}
          isCoach={isCoach}
          onSelect={selectFilm}
          onDelete={setPendingDeleteFilm}
        />
      </div>

      <div className="panel film-viewer-panel">
        {selectedFilm ? (
          <FilmPanel
            film={selectedFilm}
            tags={tags}
            isCoach={isCoach}
            onAddTag={addTag}
            onDeleteTag={setPendingDeleteTag}
          />
        ) : (
          <p className="muted">Select a film to review.</p>
        )}
      </div>

      {pendingDeleteFilm && (
        <ConfirmModal
          title="Delete film?"
          message={`Remove "${pendingDeleteFilm.title}" and all of its tags?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteFilm(pendingDeleteFilm.id);
            setPendingDeleteFilm(null);
          }}
          onCancel={() => setPendingDeleteFilm(null)}
        />
      )}

      {pendingDeleteTag && (
        <ConfirmModal
          title="Delete tag?"
          message="Remove this tag from the film?"
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            deleteTag(pendingDeleteTag.id);
            setPendingDeleteTag(null);
          }}
          onCancel={() => setPendingDeleteTag(null)}
        />
      )}
    </section>
  );
}
