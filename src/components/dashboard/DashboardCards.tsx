"use client";

import { BarChart3, CalendarDays, HeartPulse, Play, Trophy } from "lucide-react";
import Link from "next/link";

import { getWorkoutDays } from "@/data/workoutPlan";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { usePRs } from "@/hooks/usePRs";
import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";
import { todayName } from "@/lib/storage";

export function DashboardCards() {
  const today = todayName();

  const { recovery, status, hasLoggedStats } = useRecoveryStats();
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { latestPR } = usePRs();

  const todayWorkout = getWorkoutDays(week).find((day) => day.day === today);

  return (
    <section id="dashboard" className="grid-4">
      <div className="card">
        <h3>
          <CalendarDays size={18} /> Today
        </h3>
        <h2>{today}</h2>
        <p className="muted">{todayWorkout?.title}</p>

        {todayWorkout && !todayWorkout.rest && (
          <Link href="/workout">
            <button style={{ marginTop: 14, width: "100%" }}>
              <Play size={16} /> Start Workout
            </button>
          </Link>
        )}
      </div>

      <div className="card">
        <h3>
          <HeartPulse size={18} /> Recovery
        </h3>
        {hasLoggedStats ? (
          <>
            <h2>{recovery}%</h2>
            <span className="pill">{status.label}</span>
            <p className="muted">{status.message}</p>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${recovery}%` }} />
            </div>
          </>
        ) : (
          <>
            <h2>--</h2>
            <p className="muted">No stats logged yet. Fill out today&apos;s check-in to see your recovery.</p>
          </>
        )}
      </div>

      <div className="card">
        <h3>
          <BarChart3 size={18} /> Weekly Progress
        </h3>
        <h2>{progress}%</h2>
        <p className="muted">
          {completedExercises} / {totalExercises} exercises completed
        </p>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card">
        <h3>
          <Trophy size={18} /> PR Board
        </h3>

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
