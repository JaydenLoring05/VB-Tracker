"use client";

import { Ruler } from "lucide-react";

import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";

const POSITIONS = ["Outside Hitter", "Middle Blocker", "Opposite", "Setter", "Libero", "Defensive Specialist"];

function numOrNull(value: string) {
  return value === "" ? null : Number(value);
}

export function PerformanceProfileForm() {
  const { loading, profile, setProfile, saveProfile } = usePerformanceProfile();

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your profile...</p>
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
