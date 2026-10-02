"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Brand } from "@/components/shared/Brand";
import { joinErrorMessage, normalizeInviteCode, PENDING_INVITE_KEY } from "@/lib/invite";
import { createClient } from "@/lib/supabase/client";

type State =
  | { kind: "checking" }
  | { kind: "invalid" }
  | { kind: "signedOut"; teamName: string | null }
  | { kind: "ready"; teamName: string | null }
  | { kind: "joining"; teamName: string | null }
  | { kind: "error"; teamName: string | null; message: string };

function remember(code: string | null) {
  try {
    if (code) window.localStorage.setItem(PENDING_INVITE_KEY, code);
    else window.localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // Storage can be blocked; sign-up also stores the code on the account.
  }
}

/**
 * /join/<code>: a signed-in athlete joins in one tap; a signed-out visitor
 * has the code saved and is sent to sign up, and onboarding joins them at
 * the end. A wrong or regenerated code gets a clear message, never a blank
 * page.
 */
export function JoinTeam({ rawCode }: { rawCode: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const code = normalizeInviteCode(rawCode);
  const [state, setState] = useState<State>(code ? { kind: "checking" } : { kind: "invalid" });

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      // Which team is this? Before schema_v49 the function doesn't exist;
      // then we can't name the team, but joining still works.
      const preview = await supabase.rpc("invite_preview", { p_invite_code: code });
      const rows = (preview.data ?? []) as { team_name: string }[];
      if (!preview.error && rows.length === 0) {
        remember(null);
        if (!cancelled) setState({ kind: "invalid" });
        return;
      }
      const teamName = preview.error ? null : rows[0].team_name;

      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setState({ kind: "ready", teamName });
      } else {
        remember(code);
        setState({ kind: "signedOut", teamName });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, supabase]);

  async function join() {
    if (!code || state.kind === "invalid" || state.kind === "checking") return;
    const teamName = "teamName" in state ? state.teamName : null;
    setState({ kind: "joining", teamName });
    const { error } = await supabase.rpc("join_team", { p_invite_code: code });
    if (error) {
      setState({ kind: "error", teamName, message: joinErrorMessage(error.message) });
      return;
    }
    remember(null);
    router.replace("/dashboard");
    router.refresh();
  }

  const teamLabel = "teamName" in state && state.teamName ? state.teamName : "your team";

  return (
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <Link href="/" className="auth-back-link">
        <span aria-hidden="true">←</span> NextRep
      </Link>

      <div className="panel auth-card join-card" aria-live="polite">
        <div className="auth-brand">
          <Brand />
        </div>

        {state.kind === "checking" && <p className="muted">Checking your invite…</p>}

        {state.kind === "invalid" && (
          <>
            <h1>This invite link doesn&apos;t work</h1>
            <p className="muted">
              The code may have been typed wrong, or your coach made a new one. Ask your coach for the latest invite
              link or code.
            </p>
            <Link href="/dashboard" className="button-link">
              Go to NextRep
            </Link>
          </>
        )}

        {state.kind === "signedOut" && (
          <>
            <h1>Join {teamLabel}</h1>
            <p className="muted">
              Create your free athlete account. You&apos;ll be added to {teamLabel} when you finish setting up.
            </p>
            <Link href="/login?mode=sign-up" className="button-link join-primary">
              Create account
            </Link>
            <Link href="/login" className="join-secondary">
              I already have an account
            </Link>
          </>
        )}

        {(state.kind === "ready" || state.kind === "joining" || state.kind === "error") && (
          <>
            <h1>Join {teamLabel}</h1>
            <p className="muted">Your coach will see your check-ins and training. You can leave a team any time.</p>
            {state.kind === "error" && (
              <p className="auth-error" role="alert">
                {state.message}
              </p>
            )}
            <button type="button" className="join-primary" onClick={join} disabled={state.kind === "joining"}>
              {state.kind === "joining" ? "Joining…" : `Join ${teamLabel}`}
            </button>
            <Link href="/dashboard" className="join-secondary">
              Not now
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
