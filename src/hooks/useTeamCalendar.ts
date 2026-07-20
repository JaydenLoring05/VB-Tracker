"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { createClient } from "@/lib/supabase/client";
import { Team, TeamCalendarEvent, TeamCalendarEventType } from "@/types";

/**
 * Shared by both the coach (full read/write for their active team) and
 * athletes (read-only -- write calls simply fail under RLS for a
 * non-coach, since is_team_coach() gates every write policy). One hook,
 * one source of truth for a team's calendar.
 */
export function useTeamCalendar(team: Team | null) {
  const { userId } = useTrackerContext();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<TeamCalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!team) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("team_calendar_events")
      .select("*")
      .eq("team_id", team.id)
      .order("date", { ascending: true });

    if (fetchError) {
      console.error("Failed to load team calendar events", fetchError);
      setError("Couldn't load the team calendar. Try again.");
      setLoading(false);
      return;
    }

    setEvents((data ?? []) as TeamCalendarEvent[]);
    setLoading(false);
  }, [supabase, team]);

  useEffect(() => {
    load();
  }, [load]);

  async function addEvent(input: { date: string; type: TeamCalendarEventType; title: string; notes?: string }) {
    if (!team) return false;
    setError(null);

    const { error: insertError } = await supabase.from("team_calendar_events").insert({
      team_id: team.id,
      date: input.date,
      type: input.type,
      title: input.title,
      notes: input.notes || null,
      created_by: userId
    });

    if (insertError) {
      console.error("Failed to add team event", insertError);
      setError("Couldn't add that event. Try again.");
      return false;
    }

    await load();
    return true;
  }

  async function deleteEvent(id: string) {
    if (!team) return false;
    setError(null);

    const previous = events;
    setEvents((current) => current.filter((event) => event.id !== id));

    const { error: deleteError } = await supabase
      .from("team_calendar_events")
      .delete()
      .eq("id", id)
      .eq("team_id", team.id);

    if (deleteError) {
      console.error("Failed to delete team event", deleteError);
      setEvents(previous);
      setError("Couldn't remove that event. Try again.");
      return false;
    }

    return true;
  }

  return { loading, events, error, addEvent, deleteEvent, refresh: load };
}
