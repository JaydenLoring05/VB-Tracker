"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { FEEDBACK_MAX_LENGTH } from "@/lib/feedback";

/** "Send feedback": one text box. Context (page, role, team, version, device) is added on the server. */
export function FeedbackForm({ fromPage }: { fromPage: string | null }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, page: fromPage })
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (response?.ok && result?.ok) {
      setStatus("sent");
      setMessage("");
      return;
    }
    setStatus("error");
    setError(result?.error ?? "Couldn't send that. Check your connection and try again.");
  }

  if (status === "sent") {
    return (
      <section className="panel feedback-panel" role="status">
        <h1>Thanks!</h1>
        <p className="muted">We read every message. If you asked something, we&apos;ll reply by email.</p>
        <div className="button-row">
          <button type="button" className="ghost" onClick={() => setStatus("idle")}>
            Send more
          </button>
          {fromPage && (
            <Link href={fromPage} className="button-link">
              Back
            </Link>
          )}
        </div>
      </section>
    );
  }

  return (
    <form className="panel feedback-panel" onSubmit={submit}>
      <h1>Send feedback</h1>
      <p className="muted">Something broken, confusing, or missing? Tell us. It goes straight to the NextRep team.</p>
      <label htmlFor="feedback-message" className="sr-only">
        Your feedback
      </label>
      <textarea
        id="feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={6}
        maxLength={FEEDBACK_MAX_LENGTH}
        placeholder="What happened, or what would make NextRep better?"
        required
        aria-describedby={error ? "feedback-error" : undefined}
      />
      <p className="muted feedback-meta">
        We also attach the page you came from, your role and team, the app version and your device type. No check-in
        data.
      </p>
      {error && (
        <p className="feedback-error" id="feedback-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={!message.trim() || status === "sending"}>
        {status === "sending" ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
