"use client";

import Link from "next/link";
import { useState } from "react";

import { Brand } from "@/components/shared/Brand";
import { parseUnsubscribeToken } from "@/lib/checkInReminders";

/** The unsubscribe link's landing page: one tap, no sign-in needed. */
export function UnsubscribeReminders({ token }: { token: string | null }) {
  const valid = parseUnsubscribeToken(token);
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

  async function unsubscribe() {
    if (!valid) return;
    setState("working");
    const response = await fetch(`/api/reminders/unsubscribe?t=${valid}`, { method: "POST" }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }

  return (
    <main id="main-content" tabIndex={-1} className="auth-shell">
      <div className="panel auth-card unsubscribe-card" aria-live="polite">
        <div className="auth-brand">
          <Brand />
        </div>
        {!valid ? (
          <>
            <h1>This link doesn&apos;t work</h1>
            <p className="muted">You can turn check-in reminders off in Settings after signing in.</p>
            <Link href="/login" className="button-link">
              Sign in
            </Link>
          </>
        ) : state === "done" ? (
          <>
            <h1>You&apos;re unsubscribed</h1>
            <p className="muted">No more check-in reminder emails. You can turn them back on in Settings any time.</p>
          </>
        ) : (
          <>
            <h1>Stop check-in reminders?</h1>
            <p className="muted">You won&apos;t get the daily &quot;you haven&apos;t checked in yet&quot; email anymore.</p>
            {state === "error" && (
              <p className="auth-error" role="alert">
                Couldn&apos;t unsubscribe right now. Try again in a minute.
              </p>
            )}
            <button type="button" className="unsubscribe-primary" onClick={unsubscribe} disabled={state === "working"}>
              {state === "working" ? "Unsubscribing…" : "Unsubscribe"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
