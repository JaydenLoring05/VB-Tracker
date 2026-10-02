"use client";

import { Clapperboard } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FilmList } from "@/components/film/FilmList";
import { FilmPanel } from "@/components/film/FilmPanel";
import { FilmAthlete } from "@/components/film/TagDetailPanel";
import { detailsForTag } from "@/components/film/tagMeta";
import type { DemoData } from "@/data/demoData";
import type { NewFilmTag } from "@/hooks/useTeamFilm";
import { FilmTag, TeamFilm } from "@/types";

/**
 * The real film room components on sample film and tags, as the coach sees
 * them. Tagging works (mouse, keyboard and voice) but only in memory: a
 * reload puts the sample tags back. Adding or deleting a film asks the
 * visitor to sign up instead.
 */
export function DemoFilmRoom({
  data,
  requestSignup
}: {
  data: DemoData;
  requestSignup: (feature?: string) => void;
}) {
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(data.films[0]?.id ?? null);
  const [tags, setTags] = useState<FilmTag[]>(data.filmTags);

  const athletes = useMemo<FilmAthlete[]>(
    () => data.roster.map((athlete) => ({ userId: athlete.userId, displayName: athlete.displayName })),
    [data.roster]
  );
  const athleteName = useCallback(
    (athleteId: string | null) =>
      athleteId ? athletes.find((athlete) => athlete.userId === athleteId)?.displayName ?? null : null,
    [athletes]
  );

  const selectedFilm = data.films.find((film) => film.id === selectedFilmId) ?? null;
  const filmTags = useMemo(
    () => tags.filter((tag) => tag.film_id === selectedFilmId).sort((a, b) => a.seconds - b.seconds),
    [tags, selectedFilmId]
  );

  const addTag = useCallback(
    async (input: NewFilmTag): Promise<FilmTag> => {
      const tag: FilmTag = {
        id: `demo-tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        film_id: input.filmId,
        team_id: data.team.id,
        seconds: input.seconds,
        tag: input.tag,
        note: input.note || null,
        athlete_id: input.athleteId ?? null,
        ...detailsForTag(input.tag, input.details ?? {}),
        created_by: "demo-coach",
        created_at: new Date().toISOString()
      };
      setTags((current) => [...current, tag]);
      return tag;
    },
    [data.team.id]
  );

  const removeTag = useCallback((id: string) => {
    setTags((current) => current.filter((tag) => tag.id !== id));
  }, []);

  return (
    <section className="lower-grid film-page" style={{ marginTop: 0 }}>
      <div className="panel film-library-panel">
        <h2>
          <Clapperboard size={22} /> Film
        </h2>
        <p className="muted">
          Public highlight reels from Volleyball World with sample tags on the demo roster. Tag a play to try it;
          nothing is saved.
        </p>
        <button type="button" className="secondary" onClick={() => requestSignup("Adding your own game film")}>
          + Add film
        </button>
        <FilmList
          films={data.films}
          selectedFilmId={selectedFilmId}
          isCoach
          onSelect={setSelectedFilmId}
          onDelete={(_film: TeamFilm) => requestSignup("Managing your film library")}
        />
      </div>

      <div className="panel film-viewer-panel">
        {selectedFilm ? (
          <FilmPanel
            film={selectedFilm}
            tags={filmTags}
            isCoach
            athletes={athletes}
            athleteName={athleteName}
            onAddTag={addTag}
            onDeleteTag={(tag) => removeTag(tag.id)}
            onUndoTag={removeTag}
          />
        ) : (
          <p className="muted">Select a film to review.</p>
        )}
      </div>
    </section>
  );
}
