"use client";

import { Clapperboard } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { AddFilmForm } from "@/components/film/AddFilmForm";
import { FilmList } from "@/components/film/FilmList";
import { FilmPanel } from "@/components/film/FilmPanel";
import { MyClips } from "@/components/film/MyClips";
import { FilmAthlete } from "@/components/film/TagDetailPanel";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useTrackerContext } from "@/context/TrackerContext";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { useMyClips } from "@/hooks/useMyClips";
import { useTeam } from "@/hooks/useTeam";
import { useTeamCalendar } from "@/hooks/useTeamCalendar";
import { useTeamFilm } from "@/hooks/useTeamFilm";
import { useTeamMemberNames } from "@/hooks/useTeamMemberNames";
import { clipStart } from "@/lib/filmQuickTag";
import { FilmTag, TeamFilm } from "@/types";

import "@/styles/film.css";

export default function FilmPage() {
  const { userId } = useTrackerContext();
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

  // Athletes land on their own clips; "All film" is the team library.
  const [libraryView, setLibraryView] = useState<"clips" | "all">("clips");
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const myClips = useMyClips(isCoach ? null : activeTeam, isCoach ? null : userId);

  function playClip(filmId: string, seconds: number) {
    selectFilm(filmId);
    setSeekRequest({ seconds: clipStart(seconds), id: Date.now() });
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Coaches pick from the full roster (the same hook the coach dashboard
  // uses). Athletes get just the team's names; their own tags read "You".
  // Until schema_v41 lets athletes read teammates' rows, other names fall
  // back to "Teammate".
  const { roster } = useCoachRoster(isCoach ? activeTeam : null);
  const teamNames = useTeamMemberNames(isCoach ? null : activeTeam);
  const athletes = useMemo<FilmAthlete[]>(
    () =>
      isCoach
        ? roster.map((athlete) => ({ userId: athlete.userId, displayName: athlete.displayName }))
        : [
            { userId, displayName: "You" },
            ...teamNames.filter((member) => member.userId !== userId)
          ],
    [isCoach, roster, teamNames, userId]
  );
  const athleteName = useCallback(
    (athleteId: string | null) => {
      if (!athleteId) return null;
      const match = athletes.find((athlete) => athlete.userId === athleteId);
      if (match) return match.displayName;
      return isCoach ? "Former athlete" : "Teammate";
    },
    [athletes, isCoach]
  );

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

        {!isCoach && (
          <div className="film-library-tabs" role="tablist" aria-label="Film">
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === "clips"}
              className={libraryView === "clips" ? "ghost tag-chip active" : "ghost tag-chip"}
              onClick={() => setLibraryView("clips")}
            >
              My clips
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={libraryView === "all"}
              className={libraryView === "all" ? "ghost tag-chip active" : "ghost tag-chip"}
              onClick={() => setLibraryView("all")}
            >
              All film
            </button>
          </div>
        )}

        {!isCoach && libraryView === "clips" ? (
          <MyClips clips={myClips.clips} loading={myClips.loading} error={myClips.error} onPlay={playClip} />
        ) : (
          <FilmList
            films={films}
            selectedFilmId={selectedFilmId}
            isCoach={isCoach}
            onSelect={selectFilm}
            onDelete={setPendingDeleteFilm}
          />
        )}
      </div>

      <div className="panel film-viewer-panel" ref={viewerRef}>
        {selectedFilm ? (
          <FilmPanel
            film={selectedFilm}
            tags={tags}
            isCoach={isCoach}
            athletes={athletes}
            athleteName={athleteName}
            onAddTag={addTag}
            onDeleteTag={setPendingDeleteTag}
            onUndoTag={deleteTag}
            seekRequest={seekRequest}
            statsAthleteId={isCoach ? null : userId}
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
