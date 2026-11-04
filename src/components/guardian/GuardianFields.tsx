"use client";

import Link from "next/link";

import { needsParentConsent, type GuardianAnswer } from "@/lib/guardian";

/**
 * "How old are you?" and, under 13 only, a parent or guardian's email and
 * their consent (N-03). Controlled; used on sign-up, in onboarding when the
 * age isn't known yet, on Today for athletes who haven't answered, and in
 * Settings.
 */
export function GuardianFields({
  value,
  onChange,
  idPrefix = "guardian",
  showAge = true
}: {
  value: GuardianAnswer;
  onChange: (next: GuardianAnswer) => void;
  idPrefix?: string;
  /** False when the age box is rendered elsewhere (sign-up keeps it with the other fields). */
  showAge?: boolean;
}) {
  const set = (patch: Partial<GuardianAnswer>) => onChange({ ...value, ...patch });
  const underThirteen = needsParentConsent(value.age);

  return (
    <div className="guardian-fields">
      {showAge && (
        <div className="auth-field">
          <label htmlFor={`${idPrefix}-age`}>How old are you?</label>
          <input
            id={`${idPrefix}-age`}
            type="number"
            inputMode="numeric"
            min={5}
            max={99}
            value={value.age}
            onChange={(e) => set({ age: e.target.value })}
            required
          />
        </div>
      )}

      {underThirteen && (
        <fieldset className="guardian-details">
          <legend>Parent or guardian</legend>
          <p className="muted">
            Because you&apos;re under 13, a parent or guardian needs to say it&apos;s OK before we make your account.
            Hand the phone to them for this part.
          </p>
          <label htmlFor={`${idPrefix}-email`}>Parent or guardian email</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            value={value.parentEmail}
            onChange={(e) => set({ parentEmail: e.target.value })}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
          />
          <label className="guardian-ack">
            <input type="checkbox" checked={value.agreed} onChange={(e) => set({ agreed: e.target.checked })} required />
            <span>
              I&apos;m this athlete&apos;s parent or guardian. I agree to them using NextRep and to the{" "}
              <Link href="/privacy" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </fieldset>
      )}
    </div>
  );
}
