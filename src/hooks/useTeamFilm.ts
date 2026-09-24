"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { FilmTag, FilmTagType, Team, TeamFilm } from "@/types";

/**
 * Shared by both the coach (full read/write for their active team) and
 * athletes (read-only -- write calls simply fail under RLS for a
 * non-coach, since is_team_coach() gates every write policy). One hook,
 * one source of truth for a team's film library and the tags on the
 * currently selected film.
 */
export function useTeamFilm(team: Team | null) {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [films, setFilms] = useState<TeamFilm[]>([]);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [tags, setTags] = useState<FilmTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilms = useCallback(async () => {
    if (!team) {
      setFilms([]);
      setSelectedFilmId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("team_film")
      .select("*")
      .eq("team_id", team.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Failed to load team film", fetchError);
      setError("Couldn't load the film library. Try again.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as TeamFilm[];
    setFilms(rows);
    setSelectedFilmId((current) => {
      if (current && rows.some((film) => film.id === current)) return current;
      return rows[0]?.id ?? null;
    });
    setLoading(false);
  }, [supabase, team]);

  useEffect(() => {
    loadFilms();
  }, [loadFilms]);

  const loadTags = useCallback(
    async (filmId: string) => {
      setTagsLoading(true);

      const { data, error: fetchError } = await supabase
        .from("film_tags")
        .select("*")
        .eq("film_id", filmId)
        .order("seconds", { ascending: true });

      if (fetchError) {
        console.error("Failed to load film tags", fetchError);
        setError("Couldn't load tags for that film. Try again.");
        setTagsLoading(false);
        return;
      }

      setTags((data ?? []) as FilmTag[]);
      setTagsLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    if (!selectedFilmId) {
      setTags([]);
      return;
    }
    loadTags(selectedFilmId);
  }, [selectedFilmId, loadTags]);

  const selectedFilm = films.find((film) => film.id === selectedFilmId) ?? null;

  async function addFilm(input: { title: string; videoUrl: string; eventId?: string | null }) {
    if (!team) return false;
    setError(null);

    const { data, error: insertError } = await supabase
      .from("team_film")
      .insert({
        team_id: team.id,
        event_id: input.eventId || null,
        title: input.title,
        video_url: input.videoUrl,
        created_by: userId
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to add film", insertError);
      setError("Couldn't add that film. Try again.");
      return false;
    }

    await loadFilms();
    if (data) setSelectedFilmId((data as TeamFilm).id);
    return true;
  }

  async function deleteFilm(id: string) {
    if (!team) return false;
    setError(null);

    const previous = films;
    setFilms((current) => current.filter((film) => film.id !== id));

    const { error: deleteError } = await supabase
      .from("team_film")
      .delete()
      .eq("id", id)
      .eq("team_id", team.id);

    if (deleteError) {
      console.error("Failed to delete film", deleteError);
      setFilms(previous);
      setError("Couldn't remove that film. Try again.");
      return false;
    }

    return true;
  }

  async function addTag(input: { filmId: string; seconds: number; tag: FilmTagType; note?: string }) {
    if (!team) return false;
    setError(null);

    const { error: insertError } = await supabase.from("film_tags").insert({
      film_id: input.filmId,
      team_id: team.id,
      seconds: input.seconds,
      tag: input.tag,
      note: input.note || null,
      created_by: userId
    });

    if (insertError) {
      console.error("Failed to add film tag", insertError);
      setError("Couldn't add that tag. Try again.");
      return false;
    }

    await loadTags(input.filmId);
    return true;
  }

  async function deleteTag(id: string) {
    if (!selectedFilmId) return false;
    setError(null);

    const previous = tags;
    setTags((current) => current.filter((tag) => tag.id !== id));

    const { error: deleteError } = await supabase.from("film_tags").delete().eq("id", id);

    if (deleteError) {
      console.error("Failed to delete film tag", deleteError);
      setTags(previous);
      setError("Couldn't remove that tag. Try again.");
      return false;
    }

    return true;
  }

  return {
    loading,
    films,
    selectedFilm,
    selectedFilmId,
    selectFilm: setSelectedFilmId,
    tags,
    tagsLoading,
    error,
    addFilm,
    deleteFilm,
    addTag,
    deleteTag,
    refresh: loadFilms
  };
}
