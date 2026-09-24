"use client";

import { Ruler } from "lucide-react";

import { InlineError } from "@/components/shared/InlineError";
import { Skeleton, SkeletonRegion } from "@/components/shared/Skeleton";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero", "Defensive Specialist"];

function numOrNull(value: string) {
  return value === "" ? null : Number(value);
}

export function PerformanceProfileForm() {
  const { loading, profile, setProfile, saveProfile, error, retry } = usePerformanceProfile();

  if (loading) {
    return (
      <SkeletonRegion label="Loading your profile" className="panel">
        <Skeleton className="skeleton-line-lg" style={{ width: "45%", marginBottom: 16 }} />
        <div className="skeleton-stack">
          <Skeleton style={{ height: 44 }} />
          <Skeleton style={{ height: 44 }} />
          <Skeleton style={{ height: 44 }} />
        </div>
      </SkeletonRegion>
    );
  }

  // Don't show an empty form after a failed load: saving it would overwrite
  // the athlete's real measurements with blanks.
  if (error) {
    return (
      <div className="panel">
        <InlineError message={error} onRetry={retry} />
      </div>
    );
  }

  const approachVertical =
    profile.approach_touch_in != null && profile.standing_reach_in != null
      ? profile.approach_touch_in - profile.standing_reach_in
      : null;

  return (
    <div className="panel">
      <h2>
        <Ruler size={22} /> Performance Profile
      </h2>

      <div className="stats-grid">
        <label>
          Position
          <select
            value={profile.position ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, position: e.target.value || null }))}
          >
            <option value="">Select...</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>

        <label>
          Height (in)
          <input
            type="number"
            value={profile.height_in ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, height_in: numOrNull(e.target.value) }))}
          />
        </label>

        <label>
          Standing Reach (in)
          <input
            type="number"
            value={profile.standing_reach_in ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, standing_reach_in: numOrNull(e.target.value) }))
            }
          />
        </label>

        <label>
          Approach Touch (in)
          <input
            type="number"
            value={profile.approach_touch_in ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, approach_touch_in: numOrNull(e.target.value) }))
            }
          />
        </label>

        <label>
          Block Touch (in)
          <input
            type="number"
            value={profile.block_touch_in ?? ""}
            onChange={(e) => setProfile((current) => ({ ...current, block_touch_in: numOrNull(e.target.value) }))}
          />
        </label>

        <label>
          Body Weight (lbs)
          <input
            type="number"
            value={profile.body_weight_lbs ?? ""}
            onChange={(e) =>
              setProfile((current) => ({ ...current, body_weight_lbs: numOrNull(e.target.value) }))
            }
          />
        </label>
      </div>

      {approachVertical != null && (
        <p className="muted">Approach vertical: {approachVertical.toFixed(1)}"</p>
      )}

      <div className="button-row">
        <button onClick={saveProfile}>Save Profile</button>
      </div>
    </div>
  );
}
