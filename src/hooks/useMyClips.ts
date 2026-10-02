"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { FilmTag, Team, TeamFilm } from "@/types";

export type MyClip = FilmTag & { team_film: Pick<TeamFilm, "id" | "title" | "video_url" | "created_at"> | null };

/**
 * Every film tag about one athlete across their team's film, newest film
 * first: the athlete's "My clips". Read-only; the V35 policy already lets
 * team members read their team's tags.
 */
export function useMyClips(team: Team | null, athleteId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [clips, setClips] = useState<MyClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!team || !athleteId) {
      setClips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("film_tags")
      .select("*, team_film(id, title, video_url, created_at)")
      .eq("team_id", team.id)
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Failed to load my clips", fetchError);
      setError("Couldn't load your clips. Try again.");
      setLoading(false);
      return;
    }

    setClips((data ?? []) as MyClip[]);
    setLoading(false);
  }, [supabase, team, athleteId]);

  useEffect(() => {
    load();
  }, [load]);

  return { clips, loading, error, refresh: load };
}
