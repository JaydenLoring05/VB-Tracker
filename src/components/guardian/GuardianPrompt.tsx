"use client";

import { FormEvent, useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import { useTeam } from "@/hooks/useTeam";
import { guardianStatus, validateGuardianAnswer, type GuardianAnswer } from "@/lib/guardian";

import { GuardianFields } from "./GuardianFields";

const EMPTY: GuardianAnswer = { isAdult: null, name: "", email: "", acknowledged: false };

/**
 * For athletes who joined before onboarding asked their age: a card that
 * asks once and disappears when answered. In Settings (`always`) it stays
 * and shows the saved answer so it can be changed. Hidden for coaches, in
 * the demo, and until schema_v52 exists.
 */
export function GuardianPrompt({ always = false }: { always?: boolean }) {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const { role, loading: teamLoading } = useTeam();
  const [answer, setAnswer] = useState<GuardianAnswer>(EMPTY);
  const [state, setState] = useState<"loading" | "hidden" | "open" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("is_adult, guardian_name, guardian_email, guardian_acknowledged_at")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setState("hidden");
          return;
        }
        const profile = data ?? {};
        setAnswer({
          isAdult: (profile as { is_adult?: boolean | null }).is_adult ?? null,
          name: (profile as { guardian_name?: string | null }).guardian_name ?? "",
          email: (profile as { guardian_email?: string | null }).guardian_email ?? "",
          acknowledged: Boolean((profile as { guardian_acknowledged_at?: string | null }).guardian_acknowledged_at)
        });
        setState(always || guardianStatus(profile) === "missing" ? "open" : "hidden");
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
      console.error("Failed to save guardian info", saveError);
      setError("Couldn't save that. Try again.");
      setState("open");
      return;
    }
    setState(always ? "open" : "saved");
  }

  if (state === "saved") {
    return (
      <p className="panel muted guardian-saved" role="status">
        Thanks, saved.
      </p>
    );
  }

  return (
    <form className="panel guardian-prompt" onSubmit={save}>
      <h2>{always ? "Age and parent or guardian" : "One quick question"}</h2>
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
