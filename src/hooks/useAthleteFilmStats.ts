"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useSupabase } from "@/hooks/useSupabase";
import { FilmTag, TeamFilm } from "@/types";

export type AthleteFilms = Record<string, Pick<TeamFilm, "title" | "created_at">>;

type TagWithFilm = FilmTag & { team_film: Pick<TeamFilm, "title" | "created_at"> | null };

type Loaded = { key: string; tags: FilmTag[]; films: AthleteFilms; error: string | null };

// The only tags the film stats read (see src/lib/filmStats.ts).
const STAT_TAGS = ["pass", "set", "block"];

const NO_TAGS: FilmTag[] = [];
const NO_FILMS: AthleteFilms = {};

/**
 * One athlete's passes, sets and blocks across their team's film, with the
 * film each one belongs to, for the Film tab of the coach's drill-down
 * (F-01). Read-only; the V35 policy already lets a coach read their team's
 * tags, so a coach only ever gets tags from film they can open. Pass the
 * team to keep the numbers to that team's film (and to use the
 * team_id + athlete_id index from schema_v36).
 */
export function useAthleteFilmStats(userId: string | null, teamId?: string | null) {
  const supabase = useSupabase();
  const demo = useDemo();

  // What the last finished request returned, and who it was for. Anything
  // loaded for a different athlete or team is ignored below, so switching
  // never shows the previous one's numbers.
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${teamId ?? ""}:${userId ?? ""}`;

  const demoResult = useMemo(() => {
    if (!demo || !userId) return null;
    return {
      tags: demo.data.filmTags.filter(
        (tag) => tag.athlete_id === userId && STAT_TAGS.includes(tag.tag) && (!teamId || tag.team_id === teamId)
      ),
      films: Object.fromEntries(
        demo.data.films.map((film) => [film.id, { title: film.title, created_at: film.created_at }])
      ) as AthleteFilms
    };
  }, [demo, userId, teamId]);

  useEffect(() => {
    if (!userId || demo) return;

    let cancelled = false;

    let query = supabase
      .from("film_tags")
      .select("*, team_film(title, created_at)")
      .eq("athlete_id", userId)
      .in("tag", STAT_TAGS);
    if (teamId) query = query.eq("team_id", teamId);

    query.then(({ data, error: fetchError }) => {
      if (cancelled) return;

      if (fetchError) {
        console.error("Failed to load athlete film stats", fetchError);
        setLoaded({ key, tags: NO_TAGS, films: NO_FILMS, error: "Couldn't load this athlete's film stats." });
        return;
      }

      const rows = (data ?? []) as TagWithFilm[];
      const films: AthleteFilms = {};
      for (const row of rows) {
        if (row.team_film) films[row.film_id] = row.team_film;
      }

      setLoaded({ key, tags: rows, films, error: null });
    });

    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId, teamId, key]);

  if (demoResult) return { loading: false, tags: demoResult.tags, films: demoResult.films, error: null };

  const current = loaded && loaded.key === key ? loaded : null;

  return {
    loading: Boolean(userId) && !current,
    tags: current?.tags ?? NO_TAGS,
    films: current?.films ?? NO_FILMS,
    error: current?.error ?? null
  };
}
