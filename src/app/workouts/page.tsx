import { PhaseSummary } from "@/components/workouts/PhaseSummary";
import { WeekSelector } from "@/components/workouts/WeekSelector";
import { WorkoutGrid } from "@/components/workouts/WorkoutGrid";

import "@/styles/workouts.css";

export default function WorkoutsPage() {
  return (
    <>
      <WeekSelector />
      <PhaseSummary />

      <div style={{ marginTop: 24 }}>
        <WorkoutGrid />
      </div>
    </>
  );
}
