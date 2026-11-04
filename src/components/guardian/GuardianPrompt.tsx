"use client";

import { FormEvent, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useTeam } from "@/hooks/useTeam";
import { EMPTY_GUARDIAN_ANSWER, guardianStatus, validateGuardianAnswer, type GuardianAnswer } from "@/lib/guardian";
import { AGE_GROUPS } from "@/lib/trainingProfile";

import { GuardianFields } from "./GuardianFields";

type SavedProfile = {
  is_adult?: boolean | null;
  under_13?: boolean | null;
  age_group?: string | null;
  guardian_email?: string | null;
  guardian_acknowledged_at?: string | null;
};

/**
 * For athletes who haven't told us their age (older accounts, or Google
 * sign-in from the sign-in screen): a card that asks once and disappears
 * when answered; under 13 it also asks for a parent's consent (N-03). In
 * Settings (`always`) it shows the saved age group with a Change button.
 * Hidden for coaches, in the demo, and until schema_v61 exists.
 */
export function GuardianPrompt({ always = false }: { always?: boolean }) {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const { role, loading: teamLoading } = useTeam();
  const [answer, setAnswer] = useState<GuardianAnswer>(EMPTY_GUARDIAN_ANSWER);
  const [saved, setSaved] = useState<SavedProfile>({});
  const [state, setState] = useState<"loading" | "hidden" | "summary" | "open" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("is_adult, under_13, age_group, guardian_email, guardian_acknowledged_at")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setState("hidden");
          return;
        }
        const profile = (data ?? {}) as SavedProfile;
        setSaved(profile);
        const missing = guardianStatus(profile) === "missing";
        setState(missing ? "open" : always ? "summary" : "hidden");
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, demo, userId, always]);

  if (demo || teamLoading || role === "coach" || state === "loading" || state === "hidden") return null;

  async function save(event: FormEvent) {
    event.preventDefault();
    const result = validateGuardianAnswer(answer);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setState("saving");
    const { error: saveError } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, ...result.fields }, { onConflict: "user_id" });
    if (saveError) {
      console.error("Failed to save age", saveError);
      setError("Couldn't save that. Try again.");
      setState("open");
      return;
    }
    setSaved(result.fields);
    setState(always ? "summary" : "saved");
  }

  if (state === "saved") {
    return (
      <p className="panel muted guardian-saved" role="status">
        Thanks, saved.
      </p>
    );
  }

  if (state === "summary") {
    const group = AGE_GROUPS.find((option) => option.value === saved.age_group)?.label;
    return (
      <div className="panel guardian-prompt">
        <h2>Age</h2>
        <p className="muted">
          {group ? `Age group: ${group}.` : saved.is_adult ? "18 or older." : "Under 18."}
          {saved.under_13 && saved.guardian_email ? ` Parent consent from ${saved.guardian_email}.` : ""}
        </p>
        <button type="button" className="ghost" onClick={() => setState("open")}>
          Change
        </button>
      </div>
    );
  }

  return (
    <form className="panel guardian-prompt" onSubmit={save}>
      <h2>{always ? "Age" : "One quick question"}</h2>
      <GuardianFields value={answer} onChange={setAnswer} idPrefix={always ? "settings-guardian" : "today-guardian"} />
      {error && (
        <p className="guardian-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "saving"}>
        {state === "saving" ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
