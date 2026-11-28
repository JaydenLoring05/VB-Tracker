"use client";

import { useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useTrainingProfile } from "@/hooks/useTrainingProfile";
import { startDateForWeek } from "@/lib/programSchedule";
import { todayISO } from "@/lib/storage";
import {
  AGE_GROUPS,
  DAY_ROLES,
  DayRole,
  INJURY_AREAS,
  INJURY_DISCLAIMER,
  InjuryArea,
  injuryLabel,
  TRAINING_LEVELS,
  Weekday,
  WEEKDAYS
} from "@/lib/trainingProfile";

/**
 * Level and sore-area picker (F-31). The plan everywhere in the app
 * (Workouts, Start a Workout, the dashboard) adapts to what's picked here.
 */
export function TrainingProfileCard({ adaptedCount }: { adaptedCount?: number }) {
  const { profile, checkInAreas, weekAdjust, setProfile } = useTrainingProfile();
  const { week, setWeek, setProgramStartDate } = useTrackerContext();
  const [repeating, setRepeating] = useState(false);
  const checkInOnly = checkInAreas.filter((area) => !profile.injuries.includes(area));

  const setDayRole = (day: Weekday, role: DayRole | "off") => {
    const weekly = { ...(profile.weekly ?? {}) };
    if (role === "off") delete weekly[day];
    else weekly[day] = role;
    setProfile({ ...profile, weekly });
  };

  async function repeatLastWeek() {
    setRepeating(true);
    const previous = Math.max(1, week - 1);
    if (await setProgramStartDate(startDateForWeek(previous, todayISO()))) setWeek(previous);
    setRepeating(false);
  }

  const toggleInjury = (area: InjuryArea) => {
    const injuries = profile.injuries.includes(area)
      ? profile.injuries.filter((value) => value !== area)
      : [...profile.injuries, area];
    setProfile({ ...profile, injuries });
  };

  return (
    <div className="panel training-profile-card">
      <h3>Your plan fits you</h3>
      <p className="muted">
        Pick your level and anything that hurts. Exercises swap to safer or better-fitting versions and rehab work
        gets added.
      </p>

      <p className="training-profile-label">Age</p>
      <div className="filter-row" role="group" aria-label="Age group">
        {AGE_GROUPS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={profile.ageGroup === option.value ? "" : "ghost"}
            aria-pressed={profile.ageGroup === option.value}
            onClick={() => setProfile({ ...profile, ageGroup: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>
      {profile.ageGroup === "under14" && (
        <p className="muted training-profile-summary">
          Under 14: no heavy barbell lifts or depth jumps, lighter sets, and landing practice on every jump day.
        </p>
      )}

      <p className="training-profile-label">Level</p>
      <div className="filter-row" role="group" aria-label="Training level">
        {TRAINING_LEVELS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={profile.level === option.value ? "" : "ghost"}
            aria-pressed={profile.level === option.value}
            title={option.hint}
            onClick={() => setProfile({ ...profile, level: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="training-profile-label">Sore or injured (pick any)</p>
      <div className="filter-row" role="group" aria-label="Sore or injured areas">
        <button
          type="button"
          className={profile.injuries.length === 0 ? "" : "ghost"}
          aria-pressed={profile.injuries.length === 0}
          onClick={() => setProfile({ ...profile, injuries: [] })}
        >
          None
        </button>
        {INJURY_AREAS.map((option) => {
          const active = profile.injuries.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={active ? "" : "ghost"}
              aria-pressed={active}
              onClick={() => toggleInjury(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <details className="training-profile-week">
        <summary>My week: what you already do outside NextRep</summary>
        <p className="muted">
          On practice days the jumping comes out (you get it at practice). On days you lift somewhere else, NextRep is
          rehab, core and mobility only.
        </p>
        <div className="training-profile-week-grid">
          {WEEKDAYS.map((day) => (
            <label key={day}>
              <span>{day.slice(0, 3)}</span>
              <select
                value={profile.weekly?.[day] ?? "off"}
                onChange={(event) => setDayRole(day, event.target.value as DayRole | "off")}
                aria-label={`What you do on ${day}`}
              >
                {DAY_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </details>

      {weekAdjust.reasons.length > 0 && (
        <div className="training-profile-this-week" role="status">
          <p className="training-profile-label">This week</p>
          <ul>
            {weekAdjust.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {weekAdjust.repeatWeek && week > 1 && (
            <button type="button" className="secondary" onClick={repeatLastWeek} disabled={repeating}>
              {repeating ? "Saving…" : `Repeat week ${week - 1}`}
            </button>
          )}
        </div>
      )}

      {checkInOnly.length > 0 && (
        <p className="training-profile-checkin" role="status">
          Today&apos;s check-in flagged {checkInOnly.map((area) => injuryLabel(area).toLowerCase()).join(" and ")} pain, so
          that&apos;s on for today too. It turns off tomorrow unless you pick it above.
        </p>
      )}

      {typeof adaptedCount === "number" && adaptedCount > 0 && (
        <p className="muted training-profile-summary">
          {adaptedCount} {adaptedCount === 1 ? "exercise" : "exercises"} changed or added this week to fit you.
        </p>
      )}
      {profile.injuries.includes("knee") && (
        <p className="muted training-profile-summary">
          Knee: less jumping, landing practice on jump days, and squats to a box at parallel, step-ups and wall sits
          instead of deep loaded knee bends.
        </p>
      )}
      {profile.injuries.includes("shoulder") && (
        <p className="muted training-profile-summary">
          Shoulder: no overhead pressing or hanging, landmine presses and rows instead, fewer full-power swings, and
          rotator cuff and shoulder blade work every training day.
        </p>
      )}
      <p className="muted training-profile-disclaimer" role="note">
        {INJURY_DISCLAIMER}
      </p>
    </div>
  );
}
