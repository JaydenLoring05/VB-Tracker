"use client";

import { useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { programWeekOn, startDateForWeek } from "@/lib/programSchedule";
import { todayISO } from "@/lib/storage";

export function WeekSelector() {
  const { week, setWeek } = useWorkoutProgress();
  const { programStartDate, setProgramStartDate } = useTrackerContext();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const currentWeek = programStartDate ? programWeekOn(programStartDate, todayISO()) : null;

  async function makeCurrentWeek() {
    setSaving(true);
    setSaveError(false);
    const ok = await setProgramStartDate(startDateForWeek(week, todayISO()));
    setSaving(false);
    setSaveError(!ok);
  }

  return (
    <>
      <section className="tabs">
        {[1, 5, 9, 13, 17].map((value) => (
          <button
            key={value}
            className={week === value ? "" : "ghost"}
            onClick={() => setWeek(value)}
          >
            Week {value}-{Math.min(value + 3, 20)}
          </button>
        ))}

        <select aria-label="Jump to week" value={week} onChange={(e) => setWeek(Number(e.target.value))}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((value) => (
            <option key={value} value={value}>
              Week {value}
            </option>
          ))}
        </select>
      </section>

      <p className="muted program-week-status" role="status">
        {currentWeek != null ? `You're in week ${currentWeek} of your program.` : "Your program week isn't set yet."}{" "}
        {currentWeek !== week && (
          <button type="button" className="ghost" onClick={makeCurrentWeek} disabled={saving}>
            {saving ? "Saving..." : `Make week ${week} my current week`}
          </button>
        )}
        {saveError && " Couldn't save that. Try again."}
      </p>
    </>
  );
}
