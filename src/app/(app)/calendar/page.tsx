import { CalendarPanel } from "@/components/calendar/CalendarPanel";
import { TrainingGoals } from "@/components/calendar/TrainingGoals";

import "@/styles/calendar.css";

export default function CalendarPage() {
  return (
    <section className="lower-grid" style={{ marginTop: 0 }}>
      <CalendarPanel />
      <TrainingGoals />
    </section>
  );
}
