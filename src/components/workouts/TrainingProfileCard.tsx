"use client";

import { useTrainingProfile } from "@/hooks/useTrainingProfile";
import { AGE_GROUPS, INJURY_AREAS, InjuryArea, injuryLabel, TRAINING_LEVELS } from "@/lib/trainingProfile";

/**
 * Level and sore-area picker (F-31). The plan everywhere in the app
 * (Workouts, Start a Workout, the dashboard) adapts to what's picked here.
 */
export function TrainingProfileCard({ adaptedCount }: { adaptedCount?: number }) {
  const { profile, checkInAreas, setProfile } = useTrainingProfile();
  const checkInOnly = checkInAreas.filter((area) => !profile.injuries.includes(area));

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
      <p className="muted training-profile-disclaimer">
        Sharp pain, swelling, or pain that gets worse during a set means stop and see a doctor or athletic trainer.
      </p>
    </div>
  );
}
