import { CoachPanel } from "@/components/stats/CoachPanel";
import { DailyCheckIn } from "@/components/stats/DailyCheckIn";
import { PerformanceProfileForm } from "@/components/stats/PerformanceProfileForm";
import { PRTracker } from "@/components/stats/PRTracker";
import { ProgressCharts } from "@/components/stats/ProgressCharts";
import { SkillRadar } from "@/components/stats/SkillRadar";
import { StatsForm } from "@/components/stats/StatsForm";
import { StatsHeadline } from "@/components/stats/StatsHeadline";

import "@/styles/stats.css";

export default function StatsPage() {
  return (
    <>
      <StatsHeadline />

      <section id="stats" className="lower-grid">
        <DailyCheckIn compact />
        <StatsForm />
        <ProgressCharts />
      </section>

      <section className="lower-grid" style={{ marginTop: 24 }}>
        <PRTracker />
        <CoachPanel />
      </section>

      <section style={{ marginTop: 24 }}>
        <SkillRadar />
      </section>

      <section style={{ marginTop: 24 }}>
        <PerformanceProfileForm />
      </section>
    </>
  );
}
