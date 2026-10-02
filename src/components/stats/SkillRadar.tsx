"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

import { InlineError } from "@/components/shared/InlineError";
import { Skeleton, SkeletonRegion } from "@/components/shared/Skeleton";
import { useSkillRatings } from "@/hooks/useSkillRatings";
import {
  SKILL_AXES,
  SKILL_MAX,
  SKILL_MIN,
  hasAnyRating,
  skillExtremes,
  skillRadarData,
  skillTotal,
  type SkillKey,
  type SkillRatings
} from "@/lib/skillRatings";

const SCALE = Array.from({ length: SKILL_MAX - SKILL_MIN + 1 }, (_, index) => SKILL_MIN + index);

export function SkillRadar() {
  const { loading, ratings, setRatings, saveRatings, saving, dirty, error, retry } = useSkillRatings();

  if (loading) {
    return (
      <SkeletonRegion label="Loading your skill ratings" className="panel">
        <Skeleton className="skeleton-line-lg" style={{ width: "40%", marginBottom: 16 }} />
        <Skeleton style={{ height: 260 }} />
      </SkeletonRegion>
    );
  }

  // Same rule as the profile form: never show blank ratings after a failed
  // load, because saving them would wipe the real ratings.
  if (error) {
    return (
      <div className="panel">
        <h2>Skill Radar</h2>
        <InlineError message={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <SkillRadarView
      ratings={ratings}
      onRate={(key, value) => setRatings((current) => ({ ...current, [key]: value }))}
      onSave={saveRatings}
      saving={saving}
      dirty={dirty}
    />
  );
}

/** The chart and rating taps on their own, with no data loading. */
export function SkillRadarView({
  ratings,
  onRate,
  onSave,
  saving,
  dirty
}: {
  ratings: SkillRatings;
  onRate: (key: SkillKey, value: number | null) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  const rated = hasAnyRating(ratings);
  const { total, rated: ratedCount, max } = skillTotal(ratings);
  const extremes = skillExtremes(ratings);

  return (
    <div className="panel">
      <h2>Skill Radar</h2>
      <p className="muted">
        Rate yourself {SKILL_MIN} to {SKILL_MAX} on each skill. Be honest: the shape matters more than the total.
      </p>

      <div className="skill-radar">
        <div className="skill-radar-chart">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={skillRadarData(ratings)} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--muted)", fontSize: 13, fontWeight: 700 }} />
              <PolarRadiusAxis domain={[0, SKILL_MAX]} tickCount={SKILL_MAX + 1} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="var(--gold)"
                strokeWidth={2}
                fill="var(--gold)"
                fillOpacity={rated ? 0.28 : 0}
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>

          <p className="skill-radar-summary" aria-live="polite">
            {rated ? (
              <>
                <strong>
                  {total} / {max}
                </strong>
                {ratedCount < SKILL_AXES.length && (
                  <span className="muted">
                    {" "}
                    · {ratedCount} of {SKILL_AXES.length} rated
                  </span>
                )}
                {extremes && (
                  <span className="muted">
                    {" "}
                    · Strongest: {extremes.strongest} · Work on: {extremes.weakest}
                  </span>
                )}
              </>
            ) : (
              <span className="muted">Tap a number to draw your shape.</span>
            )}
          </p>
        </div>

        <div className="skill-radar-inputs">
          {SKILL_AXES.map(({ key, label, hint }) => {
            const value = ratings[key];

            return (
              <div key={key} className="skill-rating" role="group" aria-label={`${label}: ${value ?? "not rated"}`}>
                <span className="skill-rating-head">
                  <span>{label}</span>
                  <span className="muted skill-rating-hint">{hint}</span>
                </span>
                <span className="skill-rating-scale">
                  {SCALE.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={value === step ? "skill-step is-active" : "skill-step"}
                      aria-pressed={value === step}
                      aria-label={`${label} ${step} out of ${SKILL_MAX}`}
                      // Tapping the current rating again clears it.
                      onClick={() => onRate(key, value === step ? null : step)}
                    >
                      {step}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="button-row">
        <button onClick={onSave} disabled={!dirty || saving}>
          {saving ? "Saving..." : dirty ? "Save Ratings" : "Saved"}
        </button>
      </div>
    </div>
  );
}
