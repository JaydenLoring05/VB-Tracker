"use client";

import { useCallback, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useSupabase } from "@/hooks/useSupabase";
import { CustomProgram, parseProgramDays, ProgramAssignment } from "@/lib/customProgram";
import { Team } from "@/types";

export type TeamGroup = { id: string; name: string; memberIds: string[] };

/** Coach side of coach-built programs (schema_v43): programs, groups, and who gets which program. */
export function useCustomPrograms(team: Team) {
  const supabase = useSupabase();
  const demo = useDemo();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notSetUp, setNotSetUp] = useState(false);
  const [programs, setPrograms] = useState<CustomProgram[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);

  const load = useCallback(async () => {
    if (demo) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [programsRes, groupsRes, membersRes, assignmentsRes] = await Promise.all([
      supabase.from("team_programs").select("id, name, days, updated_at").eq("team_id", team.id).order("created_at"),
      supabase.from("team_groups").select("id, name").eq("team_id", team.id).order("name"),
      supabase.from("team_group_members").select("group_id, user_id").eq("team_id", team.id),
      supabase.from("team_program_assignments").select("program_id, scope, group_id, user_id").eq("team_id", team.id)
    ]);

    const firstError = programsRes.error ?? groupsRes.error ?? membersRes.error ?? assignmentsRes.error;
    if (firstError) {
      // 42P01 = undefined table: schema_v43 hasn't been run yet.
      if (firstError.code === "42P01" || /does not exist|schema cache/i.test(firstError.message)) {
        setNotSetUp(true);
      } else {
        console.error("Failed to load custom programs", firstError);
        setError("Couldn't load your programs. Try again.");
      }
      setLoading(false);
      return;
    }

    setNotSetUp(false);
    setPrograms(
      (programsRes.data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        days: parseProgramDays(row.days),
        updatedAt: row.updated_at
      }))
    );
    setGroups(
      (groupsRes.data ?? []).map((group) => ({
        id: group.id,
        name: group.name,
        memberIds: (membersRes.data ?? []).filter((m) => m.group_id === group.id).map((m) => m.user_id)
      }))
    );
    setAssignments(
      (assignmentsRes.data ?? []).map((row) => ({
        programId: row.program_id,
        scope: row.scope,
        groupId: row.group_id,
        userId: row.user_id
      }))
    );
    setLoading(false);
  }, [supabase, demo, team.id]);

  useEffect(() => {
    load();
  }, [load]);

  function blockedInDemo(action: string) {
    if (!demo) return false;
    demo.requestSignup(action);
    return true;
  }

  /** Creates the program when it has no id yet. Returns the saved program's id, or null on failure. */
  async function saveProgram(program: Omit<CustomProgram, "id"> & { id?: string }): Promise<string | null> {
    if (blockedInDemo("Building your own program")) return null;
    setError(null);

    const payload = {
      team_id: team.id,
      name: program.name.trim(),
      days: program.days,
      updated_at: new Date().toISOString()
    };

    const result = program.id
      ? await supabase.from("team_programs").update(payload).eq("id", program.id).eq("team_id", team.id).select("id").single()
      : await supabase.from("team_programs").insert(payload).select("id").single();

    if (result.error) {
      console.error("Failed to save program", result.error);
      setError("Couldn't save the program. Try again.");
      return null;
    }

    await load();
    return result.data.id as string;
  }

  async function deleteProgram(programId: string) {
    if (blockedInDemo("Building your own program")) return false;
    setError(null);
    const { error: deleteError } = await supabase.from("team_programs").delete().eq("id", programId).eq("team_id", team.id);
    if (deleteError) {
      setError("Couldn't delete the program. Try again.");
      return false;
    }
    await load();
    return true;
  }

  async function createGroup(name: string) {
    if (blockedInDemo("Grouping your athletes")) return false;
    setError(null);
    const { error: insertError } = await supabase.from("team_groups").insert({ team_id: team.id, name: name.trim() });
    if (insertError) {
      setError(insertError.code === "23505" ? "You already have a group with that name." : "Couldn't create the group.");
      return false;
    }
    await load();
    return true;
  }

  async function deleteGroup(groupId: string) {
    if (blockedInDemo("Grouping your athletes")) return false;
    setError(null);
    const { error: deleteError } = await supabase.from("team_groups").delete().eq("id", groupId).eq("team_id", team.id);
    if (deleteError) {
      setError("Couldn't delete the group.");
      return false;
    }
    await load();
    return true;
  }

  async function setGroupMember(groupId: string, userId: string, inGroup: boolean) {
    if (blockedInDemo("Grouping your athletes")) return false;
    setError(null);
    const { error: changeError } = inGroup
      ? await supabase.from("team_group_members").upsert(
          { group_id: groupId, team_id: team.id, user_id: userId },
          { onConflict: "group_id,user_id", ignoreDuplicates: true }
        )
      : await supabase.from("team_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    if (changeError) {
      setError("Couldn't update that group.");
      return false;
    }
    await load();
    return true;
  }

  /**
   * Points a target (the team, a group, or one athlete) at a program.
   * programId null removes the assignment, which sends that target back to
   * the next level up (group, then team, then the recommended plan).
   */
  async function assignProgram(
    target: { scope: "team" } | { scope: "group"; groupId: string } | { scope: "athlete"; userId: string },
    programId: string | null
  ) {
    if (blockedInDemo("Assigning programs")) return false;
    setError(null);

    let clear = supabase.from("team_program_assignments").delete().eq("team_id", team.id).eq("scope", target.scope);
    if (target.scope === "group") clear = clear.eq("group_id", target.groupId);
    if (target.scope === "athlete") clear = clear.eq("user_id", target.userId);
    const { error: clearError } = await clear;
    if (clearError) {
      setError("Couldn't change that assignment.");
      return false;
    }

    if (programId) {
      const { error: insertError } = await supabase.from("team_program_assignments").insert({
        team_id: team.id,
        program_id: programId,
        scope: target.scope,
        group_id: target.scope === "group" ? target.groupId : null,
        user_id: target.scope === "athlete" ? target.userId : null,
        updated_at: new Date().toISOString()
      });
      if (insertError) {
        setError("Couldn't save that assignment.");
        await load();
        return false;
      }
    }

    await load();
    return true;
  }

  return {
    loading,
    error,
    notSetUp,
    programs,
    groups,
    assignments,
    reload: load,
    saveProgram,
    deleteProgram,
    createGroup,
    deleteGroup,
    setGroupMember,
    assignProgram
  };
}
