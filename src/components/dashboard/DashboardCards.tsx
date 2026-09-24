"use client";

import { ArrowRight, BarChart3, CalendarDays, Flame, HeartPulse, Trophy } from "lucide-react";
import Link from "next/link";

import { TeamNudge } from "@/components/dashboard/TeamNudge";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { statusTone } from "@/components/shared/StatusLabel";
import { useTrackerContext } from "@/context/TrackerContext";
import { resolveWorkoutDays } from "@/lib/programResolution";
import { getPhase, getWorkoutDays } from "@/data/workoutPlan";
import { usePRs } from "@/hooks/usePRs";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { useStartWorkout } from "@/hooks/useStartWorkout";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

const RECOVERY_COLOR: Record<string, string> = {
  Elite: "var(--green)",
  Good: "var(--green)",
  Caution: "var(--warn)",
  Low: "var(--red)"
};

export function DashboardCards() {
  const today = todayName();
  const { workoutStreak, teamOverride, substitutions } = useTrackerContext();

  const { recovery, status, hasLoggedStats, readinessExplanation } = useRecoveryStats();
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { prs } = usePRs();
  const { openSession } = useStartWorkout();

  const todayWorkout = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions).find(
    (day) => day.day === today
  );
  const ringColor = RECOVERY_COLOR[status.label] ?? "var(--gold)";
  const phase = getPhase(week);
  const recentPRs = prs.slice(0, 3);

  return (
    <>
      <TeamNudge />

      {todayWorkout && !todayWorkout.rest && (
        <Link href="/workout">
          <button className="dashboard-hero-cta">
            {openSession ? "Continue Workout" : "Start Today's Workout"}
            <ArrowRight size={22} aria-hidden="true" />
          </button>
        </Link>
      )}

      <section id="dashboard" className="grid-4 dashboard-grid">
        <div className="card dashboard-card dashboard-card-today">
          <div className="dashboard-card-icon">
            <CalendarDays size={18} />
          </div>
          <h3>Today</h3>
          <h2>{today}</h2>
          <p className="muted">{todayWorkout?.title}</p>

          {workoutStreak > 0 && (
            <div className="dashboard-streak">
              <Flame size={14} />
              {workoutStreak} day{workoutStreak === 1 ? "" : "s"} strong
            </div>
          )}
        </div>

        <div className="card dashboard-card dashboard-card-recovery">
          <div className="dashboard-card-icon">
            <HeartPulse size={18} />
          </div>
          <h3>Recovery</h3>

          {hasLoggedStats ? (
            <div className="dashboard-recovery-body">
              <ProgressRing value={recovery} color={ringColor} size={88}>
                <strong>{recovery}%</strong>
              </ProgressRing>
              <div>
                <span className={`status status-${statusTone(status.label) ?? "ready"}`}>{status.label}</span>
                <p className="muted">{readinessExplanation ?? status.message}</p>
              </div>
            </div>
          ) : (
            <>
              <h2>--</h2>
              <p className="muted">No check-in yet. Log sleep, energy and soreness to get today&apos;s recovery score.</p>
              <Link href="/stats" className="button-link dashboard-card-cta">
                Log today&apos;s check-in
              </Link>
            </>
          )}
        </div>

        <div className="card dashboard-card dashboard-card-progress">
          <div className="dashboard-card-icon">
            <BarChart3 size={18} />
          </div>
          <h3>Weekly Progress</h3>
          <p className="muted dashboard-phase-label">
            Week {week} &middot; {phase.name}
          </p>
          <h2>{progress}%</h2>
          <p className="muted">
            {completedExercises} / {totalExercises} exercises completed
          </p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card dashboard-card dashboard-card-pr">
          <div className="dashboard-card-icon">
            <Trophy size={18} />
          </div>
          <h3>Recent PRs</h3>

          {recentPRs.length > 0 ? (
            <ul className="dashboard-pr-list">
              {recentPRs.map((pr) => (
                <li key={pr.id}>
                  <strong>
                    {pr.value} {pr.unit}
                  </strong>
                  <span className="muted"> on {pr.exercise}</span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <h2>0</h2>
              <p className="muted">
                No PRs yet. They&apos;re saved automatically when you beat a best in a workout, or add one on{" "}
                <Link href="/stats" className="dashboard-inline-link">
                  Stats
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
