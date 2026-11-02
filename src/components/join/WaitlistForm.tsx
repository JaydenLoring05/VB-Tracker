"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";

import { CONTACT_EMAIL } from "@/lib/contact";
import {
  POSITIONS,
  WAITLIST_AGE_GROUPS,
  WAITLIST_FIELDS,
  WAITLIST_LIMITS,
  validateWaitlistField,
  type WaitlistField,
  type WaitlistFieldErrors
} from "@/lib/waitlist";

type Values = Record<WaitlistField, string> & { website: string };
type Status = "idle" | "sending" | "success" | "unavailable" | "rate-limited";

const EMPTY: Values = { name: "", email: "", position: "", ageGroup: "", website: "" };

function buildMailto(values: Values) {
  const position = POSITIONS.find((item) => item.value === values.position)?.label ?? "";
  const age = WAITLIST_AGE_GROUPS.find((item) => item.value === values.ageGroup)?.label ?? "";
  const lines = [
    "Hi, please add me to the NextRep athlete plan list.",
    "",
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    position && `Position: ${position}`,
    age && `Age group: ${age}`
  ].filter(Boolean);
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("NextRep athlete plan sign-up")}&body=${encodeURIComponent(lines.join("\n"))}`;
}

/** Sign-up for the athlete plan before payments open (F-41). Saves to waitlist_signups. */
export function WaitlistForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<WaitlistFieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<WaitlistField, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status !== "idle" && status !== "sending") resultHeading.current?.focus();
  }, [status]);

  function update(field: WaitlistField | "website", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== "website" && touched[field]) {
      setErrors((current) => ({ ...current, [field]: validateWaitlistField(field, value) }));
    }
  }

  function blur(field: WaitlistField) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: validateWaitlistField(field, values[field]) }));
  }

  const describedBy = (field: WaitlistField) => (errors[field] ? `join-${field}-error` : undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const found: WaitlistFieldErrors = {};
    for (const field of WAITLIST_FIELDS) {
      const message = validateWaitlistField(field, values[field]);
      if (message) found[field] = message;
    }
    setTouched(Object.fromEntries(WAITLIST_FIELDS.map((field) => [field, true])));
    setErrors(found);
    const firstInvalid = WAITLIST_FIELDS.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`join-${firstInvalid}`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      if (response.ok) {
        setStatus("success");
        return;
      }
      const data = (await response.json().catch(() => null)) as { fieldErrors?: WaitlistFieldErrors } | null;
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
    const firstName = values.name.trim().split(" ")[0];
    return (
      <div className="panel pilot-result" role="status">
        <CheckCircle2 size={32} className="pilot-result-icon" aria-hidden="true" />
        <h3 ref={resultHeading} tabIndex={-1}>
          You&apos;re on the list, {firstName}.
        </h3>
        <p>
          We&apos;ll email <strong>{values.email.trim().toLowerCase()}</strong> when the athlete plan opens, with your
          7-day free trial.
        </p>
        <p className="muted">
          Want to start now? You can <Link href="/login?mode=sign-up">create a free account</Link> and train with the
          plan today.
        </p>
      </div>
    );
  }

  if (status === "unavailable" || status === "rate-limited") {
    const limited = status === "rate-limited";
    return (
      <div className="panel pilot-result" role="alert">
        <Mail size={32} className="pilot-result-icon" aria-hidden="true" />
        <h3 ref={resultHeading} tabIndex={-1}>
          {limited ? "That was a lot of tries" : "We couldn't save that just now"}
        </h3>
        <p>
          {limited
            ? "Wait a few minutes and try again, or send us your details by email."
            : "It's our side, not yours. Send your details by email instead. We filled the message in for you."}
        </p>
        <div className="pilot-result-actions">
          <a href={buildMailto(values)} className="btn">
            Email my sign-up
          </a>
          <button type="button" className="secondary" onClick={() => setStatus("idle")}>
            Back to the form
          </button>
        </div>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form className="panel pilot-form" onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <div className="pilot-field">
        <label htmlFor="join-name">Name</label>
        <input
          id="join-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={WAITLIST_LIMITS.name.max}
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          onBlur={() => blur("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          required
        />
        {errors.name && (
          <p className="pilot-error" id="join-name-error">
            {errors.name}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="join-email">Email</label>
        <input
          id="join-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={WAITLIST_LIMITS.email.max}
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={() => blur("email")}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          required
        />
        {errors.email && (
          <p className="pilot-error" id="join-email-error">
            {errors.email}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="join-position">
          Sport or position <span className="pilot-optional">(optional)</span>
        </label>
        <select
          id="join-position"
          name="position"
          value={values.position}
          onChange={(event) => update("position", event.target.value)}
          onBlur={() => blur("position")}
          aria-invalid={errors.position ? true : undefined}
          aria-describedby={describedBy("position")}
        >
          <option value="">Choose one</option>
          {POSITIONS.map((position) => (
            <option key={position.value} value={position.value}>
              {position.label}
            </option>
          ))}
        </select>
        {errors.position && (
          <p className="pilot-error" id="join-position-error">
            {errors.position}
          </p>
        )}
      </div>

      <div className="pilot-field">
        <label htmlFor="join-ageGroup">
          Age group <span className="pilot-optional">(optional)</span>
        </label>
        <select
          id="join-ageGroup"
          name="ageGroup"
          value={values.ageGroup}
          onChange={(event) => update("ageGroup", event.target.value)}
          onBlur={() => blur("ageGroup")}
          aria-invalid={errors.ageGroup ? true : undefined}
          aria-describedby={describedBy("ageGroup")}
        >
          <option value="">Choose one</option>
          {WAITLIST_AGE_GROUPS.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
        {errors.ageGroup && (
          <p className="pilot-error" id="join-ageGroup-error">
            {errors.ageGroup}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div className="pilot-trap" aria-hidden="true">
        <label htmlFor="join-website">Leave this field empty</label>
        <input
          id="join-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <button type="submit" className="pilot-submit" disabled={sending}>
        {sending ? "Saving..." : "Get early access"}
      </button>

      <p className="pilot-privacy muted">
        We only use this to email you about NextRep. No spam, and no card needed. Read the{" "}
        <Link href="/privacy">privacy policy</Link>.
      </p>
    </form>
  );
}
