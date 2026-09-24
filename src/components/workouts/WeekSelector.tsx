"use client";

import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";

export function WeekSelector() {
  const { week, setWeek } = useWorkoutProgress();

  return (
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
  );
}
