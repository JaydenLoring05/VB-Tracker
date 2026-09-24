"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { PILOT_FALLBACK_EMAIL } from "@/lib/contact";
import {
  LEVELS,
  LIMITS,
  PILOT_FIELDS,
  TRACKING_METHODS,
  validateField,
  type PilotField,
  type PilotFieldErrors
} from "@/lib/pilotApplication";

type Values = Record<PilotField, string> & { website: string };
type Status = "idle" | "sending" | "success" | "unavailable" | "rate-limited";

const EMPTY: Values = {
  coachName: "",
  email: "",
  teamName: "",
  level: "",
  rosterSize: "",
  trackingMethod: "",
  notes: "",
  website: ""
};

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

function buildMailto(values: Values) {
  const lines = [
    "Hi Jayden, I'd like to apply for the NextRep founding team pilot.",
    "",
    `Name: ${values.coachName}`,
    `Email: ${values.email}`,
    `Team or club: ${values.teamName}`,
    `Level: ${labelFor(LEVELS, values.level)}`,
    `Roster size: ${values.rosterSize}`,
    `Tracking today: ${labelFor(TRACKING_METHODS, values.trackingMethod)}`
  ];
  if (values.notes.trim()) lines.push(`Notes: ${values.notes.trim().slice(0, 500)}`);

  const subject = `Founding Team Pilot application: ${values.teamName}`;
  return `mailto:${PILOT_FALLBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export function PilotForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<PilotFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<PilotField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const resultHeading = useRef<HTMLHeadingElement>(null);

  // Move focus to the result so keyboard and screen reader users land on it.
  useEffect(() => {
    if (status === "success" || status === "unavailable" || status === "rate-limited") {
      resultHeading.current?.focus();
    }
  }, [status]);

  function update(field: PilotField | "website", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // Once a field has shown an error, re-check as they fix it.
    if (field !== "website" && touched[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  }

  function blur(field: PilotField) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  }

  function describedBy(field: PilotField, extra?: string) {
    return [errors[field] ? `pilot-${field}-error` : "", extra].filter(Boolean).join(" ") || undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const found: PilotFieldErrors = {};
    for (const field of PILOT_FIELDS) {
      const message = validateField(field, values[field]);
      if (message) found[field] = message;
    }
    setTouched(Object.fromEntries(PILOT_FIELDS.map((field) => [field, true])));
    setErrors(found);

    const firstInvalid = PILOT_FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      const id = firstInvalid === "level" ? "pilot-level-high_school" : `pilot-${firstInvalid}`;
      document.getElementById(id)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        setStatus("success");
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: PilotFieldErrors;
      } | null;

      if (response.status === 400 && data?.fieldErrors) {
        setErrors(data.fieldErrors);
        setStatus("idle");
        return;
      }
      setStatus(response.status === 429 ? "rate-limited" : "unavailable");
    } catch {
      setStatus("unavailable");
    }
  }

  if (status === "success") {
    const firstName = values.coachName.trim().split(" ")[0];
    return (
      <div className="panel pilot-result" role="status">
        <CheckCircle2 size={32} className="pilot-result-icon" aria-hidden="true" />
        <h2 ref={resultHeading} tabIndex={-1}>
          Thanks, {firstName}. Your application is in.
        </h2>
        <p>
          Jayden reads every application personally. He will email you at{" "}
          <strong>{values.email.trim().toLowerCase()}</strong> to talk about {values.teamName.trim()} and
          how the free 30-day pilot would work for your roster.
        </p>
        <p className="muted">
          Nothing else to do for now. No credit card, and no account needed yet.
        </p>
        <Link href="/">
          <button type="button" className="secondary">
            Back to NextRep
          </button>
        </Link>
      </div>
    );
  }

  if (status === "unavailable" || status === "rate-limited") {
    const limited = status === "rate-limited";
    return (
      <div className="panel pilot-result" role="alert">
        <Mail size={32} className="pilot-result-icon" aria-hidden="true" />
        <h2 ref={resultHeading} tabIndex={-1}>
          {limited ? "That was a lot of tries" : "We could not save that just now"}
        </h2>
        <p>
          {limited
            ? "Please wait a few minutes before sending again, or email your details straight to Jayden."
            : "It is our side, not yours. Email your details to Jayden instead and he will pick it up from there. We filled the message in for you."}
        </p>
        <div className="pilot-result-actions">
          <a href={buildMailto(values)}>
            <button type="button">Email my application</button>
          </a>
          <button type="button" className="secondary" onClick={() => setStatus("idle")}>
            Back to the form
          </button>
        </div>
        <p className="muted">
          Or write to <a href={`mailto:${PILOT_FALLBACK_EMAIL}`}>{PILOT_FALLBACK_EMAIL}</a>.
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form className="panel pilot-form" onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <div className="pilot-field">
        <label htmlFor="pilot-coachName">Your name</label>
        <input
          id="pilot-coachName"
          name="coachName"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.name.max}
          value={values.coachName}
          onChange={(event) => update("coachName", event.target.value)}
          onBlur={() => blur("coachName")}
          aria-invalid={errors.coachName ? true : undefined}
          aria-describedby={describedBy("coachName")}
          required
        />
        {errors.coachName && (
          <p className="pilot-error" id="pilot-coachName-error">
            {errors.coachName}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="pilot-email">Email</label>
        <input
          id="pilot-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={LIMITS.email.max}
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => blur("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          required
        />
        {errors.email && (
          <p className="pilot-error" id="pilot-email-error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="pilot-teamName">Team or club name</label>
        <input
          id="pilot-teamName"
          name="teamName"
          type="text"
          autoComplete="organization"
          maxLength={LIMITS.team.max}
          value={values.teamName}
          onChange={(event) => update("teamName", event.target.value)}
          onBlur={() => blur("teamName")}
          aria-invalid={errors.teamName ? true : undefined}
          aria-describedby={describedBy("teamName")}
          required
        />
        {errors.teamName && (
          <p className="pilot-error" id="pilot-teamName-error">
            {errors.teamName}
          </p>
        )}
      </div>

      <fieldset className="pilot-field pilot-fieldset" aria-describedby={describedBy("level")}>
        <legend>Level you coach</legend>
        <div className="pilot-choices">
          {LEVELS.map((level) => (
            <div className="pilot-choice" key={level.value}>
              <input
                id={`pilot-level-${level.value}`}
                type="radio"
                name="level"
                value={level.value}
                checked={values.level === level.value}
                onChange={() => update("level", level.value)}
              />
              <label htmlFor={`pilot-level-${level.value}`}>{level.label}</label>
            </div>
          ))}
        </div>
        {errors.level && (
          <p className="pilot-error" id="pilot-level-error">
            {errors.level}
          </p>
        )}
      </fieldset>

      <div className="pilot-field">
        <label htmlFor="pilot-rosterSize">Roster size</label>
        <input
          id="pilot-rosterSize"
          name="rosterSize"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={3}
          value={values.rosterSize}
          onChange={(event) => update("rosterSize", event.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => blur("rosterSize")}
          aria-invalid={errors.rosterSize ? true : undefined}
          aria-describedby={describedBy("rosterSize", "pilot-rosterSize-hint")}
          required
        />
        <p className="pilot-hint" id="pilot-rosterSize-hint">
          Athletes on the team, roughly is fine.
        </p>
        {errors.rosterSize && (
          <p className="pilot-error" id="pilot-rosterSize-error">
            {errors.rosterSize}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="pilot-trackingMethod">How do you track training today?</label>
        <select
          id="pilot-trackingMethod"
          name="trackingMethod"
          value={values.trackingMethod}
          onChange={(event) => update("trackingMethod", event.target.value)}
          onBlur={() => blur("trackingMethod")}
          aria-invalid={errors.trackingMethod ? true : undefined}
          aria-describedby={describedBy("trackingMethod")}
          required
        >
          <option value="">Choose one</option>
          {TRACKING_METHODS.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
        {errors.trackingMethod && (
          <p className="pilot-error" id="pilot-trackingMethod-error">
            {errors.trackingMethod}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="pilot-notes">
          Anything we should know <span className="pilot-optional">(optional)</span>
        </label>
        <textarea
          id="pilot-notes"
          name="notes"
          rows={4}
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
          onBlur={() => blur("notes")}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={describedBy("notes", "pilot-notes-count")}
        />
        <p
          className={`pilot-hint pilot-count ${values.notes.length > LIMITS.notes.max ? "pilot-count-over" : ""}`}
          id="pilot-notes-count"
        >
          {values.notes.length} / {LIMITS.notes.max}
        </p>
        {errors.notes && (
          <p className="pilot-error" id="pilot-notes-error">
            {errors.notes}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className="pilot-trap" aria-hidden="true">
        <label htmlFor="pilot-website">Leave this field empty</label>
        <input
          id="pilot-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <button type="submit" className="pilot-submit" disabled={sending}>
        {sending ? "Sending..." : "Apply for the pilot"}
      </button>

      <p className="pilot-privacy muted">
        We use these details only to reply to your application. Read the{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </form>
  );
}
