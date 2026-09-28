import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { TrainingGoals } from "@/components/calendar/TrainingGoals";
import { PlanTabs } from "@/components/workouts/PlanTabs";

import "@/styles/calendar.css";

export default function CalendarPage() {
  return (
    <>
      <PlanTabs current="/calendar" />
      <section className="lower-grid" style={{ marginTop: 0 }}>
        <CalendarPanel />
        <TrainingGoals />
      </section>
    </>
  );
}
