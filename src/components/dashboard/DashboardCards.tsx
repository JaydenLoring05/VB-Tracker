"use client";

import { BarChart3, CalendarDays, Flame, HeartPulse, Play, Trophy } from "lucide-react";
import Link from "next/link";

import { useTrackerContext } from "@/context/TrackerContext";
import { getWorkoutDays } from "@/data/workoutPlan";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { usePRs } from "@/hooks/usePRs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

const RECOVERY_COLOR: Record<string, string> = {
  Elite: "var(--green)",
  Good: "var(--green)",
  Caution: "var(--gold)",
  Low: "var(--red)"
};

export function DashboardCards() {
  const today = todayName();
  const { workoutStreak } = useTrackerContext();

  const { recovery, status, hasLoggedStats } = useRecoveryStats();
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { latestPR } = usePRs();

  const todayWorkout = getWorkoutDays(week).find((day) => day.day === today);
  const ringColor = RECOVERY_COLOR[status.label] ?? "var(--gold)";

  return (
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

        {todayWorkout && !todayWorkout.rest && (
          <Link href="/workout">
            <button className="dashboard-card-cta">
              <Play size={16} /> Start Workout
            </button>
          </Link>
        )}
      </div>

      <div className="card dashboard-card dashboard-card-recovery">
        <div className="dashboard-card-icon">
          <HeartPulse size={18} />
        </div>
        <h3>Recovery</h3>

        {hasLoggedStats ? (
          <div className="dashboard-recovery-body">
            <div
              className="recovery-ring"
              style={{
                background: `conic-gradient(${ringColor} ${recovery * 3.6}deg, rgba(255, 255, 255, 0.08) 0deg)`
              }}
            >
              <div className="recovery-ring-inner">
                <strong>{recovery}%</strong>
              </div>
            </div>
            <div>
              <span className="pill" style={{ color: ringColor, borderColor: ringColor }}>
                {status.label}
              </span>
              <p className="muted">{status.message}</p>
            </div>
          </div>
        ) : (
          <>
            <h2>--</h2>
            <p className="muted">No stats logged yet. Fill out today&apos;s check-in to see your recovery.</p>
          </>
        )}
      </div>

      <div className="card dashboard-card dashboard-card-progress">
        <div className="dashboard-card-icon">
          <BarChart3 size={18} />
        </div>
        <h3>Weekly Progress</h3>
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
        <h3>PR Board</h3>

        {latestPR ? (
          <>
            <h2>{latestPR.value}</h2>
            <p className="muted">
              {latestPR.unit} on {latestPR.exercise}
            </p>
          </>
        ) : (
          <>
            <h2>0</h2>
            <p className="muted">No PRs logged yet.</p>
          </>
        )}
      </div>
    </section>
  );
}
