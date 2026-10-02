"use client";

import type { GuardianAnswer } from "@/lib/guardian";

/**
 * "Are you 18 or older?" and, for under 18, a parent or guardian's name,
 * email and a confirmation. Controlled; used in onboarding, on Today for
 * athletes who haven't answered, and in Settings.
 */
export function GuardianFields({
  value,
  onChange,
  idPrefix = "guardian"
}: {
  value: GuardianAnswer;
  onChange: (next: GuardianAnswer) => void;
  idPrefix?: string;
}) {
  const set = (patch: Partial<GuardianAnswer>) => onChange({ ...value, ...patch });

  return (
    <fieldset className="guardian-fields">
      <legend>Are you 18 or older?</legend>
      <div className="guardian-choice">
        <label>
          <input type="radio" name={`${idPrefix}-adult`} checked={value.isAdult === true} onChange={() => set({ isAdult: true })} />
          Yes
        </label>
        <label>
          <input type="radio" name={`${idPrefix}-adult`} checked={value.isAdult === false} onChange={() => set({ isAdult: false })} />
          No
        </label>
      </div>

      {value.isAdult === false && (
        <div className="guardian-details">
          <p className="muted">Athletes under 18 need a parent or guardian who knows they use NextRep.</p>
          <label htmlFor={`${idPrefix}-name`}>Parent or guardian name</label>
          <input
            id={`${idPrefix}-name`}
            value={value.name}
            onChange={(e) => set({ name: e.target.value })}
            autoComplete="off"
            maxLength={100}
          />
          <label htmlFor={`${idPrefix}-email`}>Parent or guardian email</label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            inputMode="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
          />
          <label className="guardian-ack">
            <input type="checkbox" checked={value.acknowledged} onChange={(e) => set({ acknowledged: e.target.checked })} />
            My parent or guardian knows I&apos;m using NextRep and that my coach can see my check-ins, including soreness and
            pain.
          </label>
        </div>
      )}
    </fieldset>
  );
}
