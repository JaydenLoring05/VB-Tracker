import { CoachPanel } from "@/components/stats/CoachPanel";
import { PerformanceProfileForm } from "@/components/stats/PerformanceProfileForm";
import { PRTracker } from "@/components/stats/PRTracker";
import { ProgressCharts } from "@/components/stats/ProgressCharts";
import { StatsForm } from "@/components/stats/StatsForm";

import "@/styles/stats.css";

export default function StatsPage() {
  return (
    <>
      <section id="stats" className="lower-grid">
        <StatsForm />
        <ProgressCharts />
      </section>

      <section className="lower-grid" style={{ marginTop: 24 }}>
        <PRTracker />
        <CoachPanel />
      </section>

      <section style={{ marginTop: 24 }}>
        <PerformanceProfileForm />
      </section>
    </>
  );
}
