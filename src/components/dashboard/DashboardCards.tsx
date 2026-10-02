"use client";

import { ArrowRight, ClipboardCheck, Flame } from "lucide-react";
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
import { checkedInToday } from "@/lib/dailyCheckIn";
import { todayName } from "@/lib/storage";

const RECOVERY_COLOR: Record<string, string> = {
  Elite: "var(--green)",
  Good: "var(--green)",
  Caution: "var(--warn)",
  Low: "var(--red)"
};

/**
 * The athlete home screen has one job: today's workout and a big Start button.
 * Recovery, weekly progress and PRs are one summary line each that expand on tap.
 */
export function DashboardCards() {
  const today = todayName();
  const { workoutStreak, teamOverride, substitutions } = useTrackerContext();

  const { recovery, status, hasLoggedStats, readinessExplanation, history } = useRecoveryStats();
  const needsCheckIn = !checkedInToday(history);
  const { week, completedExercises, totalExercises, progress } = useWorkoutProgress();
  const { prs } = usePRs();
  const { openSession } = useStartWorkout();

  const todayWorkout = resolveWorkoutDays(getWorkoutDays(week), week, teamOverride, substitutions).find(
    (day) => day.day === today
  );
  const isRestDay = !todayWorkout || Boolean(todayWorkout.rest);
  const ringColor = RECOVERY_COLOR[status.label] ?? "var(--gold)";
  const phase = getPhase(week);
  const recentPRs = prs.slice(0, 3);

  return (
    <>
      <TeamNudge />

      {needsCheckIn && (
        <Link href="/check-in" className="panel today-checkin">
          <ClipboardCheck size={26} aria-hidden="true" />
          <span>
            <strong>Daily check-in</strong>
            <span className="muted">30 seconds. Sleep, energy, soreness, anything hurting.</span>
          </span>
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      )}

      <section id="dashboard" className="panel today-hero" aria-labelledby="today-title">
        <p className="micro micro-gold">Today &middot; {today}</p>
        <h2 id="today-title" className="today-title">
          {todayWorkout?.title ?? "Rest day"}
        </h2>
        <p className="muted today-meta">
          {isRestDay
            ? "Recovery day. Sleep, mobility and a light walk count."
            : `${todayWorkout?.exercises.length ?? 0} exercises${todayWorkout?.minutes ? ` · ${todayWorkout.minutes} min` : ""}`}
          {workoutStreak > 0 && (
            <span className="dashboard-streak">
              <Flame size={14} aria-hidden="true" />
              {workoutStreak} day{workoutStreak === 1 ? "" : "s"} strong
            </span>
          )}
        </p>

        {!isRestDay || openSession ? (
          <Link href="/workout" className="btn dashboard-hero-cta">
            {openSession ? "Continue Workout" : "Start Today's Workout"}
            <ArrowRight size={22} aria-hidden="true" />
          </Link>
        ) : (
          <Link href="/workout" className="dashboard-inline-link">
            Want to train anyway? Pick a workout
          </Link>
        )}
      </section>

      <div className="today-lines">
        <details className="today-line">
          <summary>
            <span className="today-line-label">Recovery</span>
            {hasLoggedStats ? (
              <span className="today-line-value">
                <strong>{recovery}%</strong>
                <span className={`status status-${statusTone(status.label) ?? "ready"}`}>{status.label}</span>
              </span>
            ) : (
              <span className="today-line-value muted">No check-in yet</span>
            )}
          </summary>

          <div className="today-line-body">
            {hasLoggedStats ? (
              <div className="dashboard-recovery-body">
                <ProgressRing value={recovery} color={ringColor} size={88}>
                  <strong>{recovery}%</strong>
                </ProgressRing>
                <p className="muted">{readinessExplanation ?? status.message}</p>
              </div>
            ) : (
              <>
                <p className="muted">Log sleep, energy and soreness to get today&apos;s recovery score.</p>
                <Link href="/check-in" className="button-link dashboard-card-cta">
                  Log today&apos;s check-in
                </Link>
              </>
            )}
          </div>
        </details>

        <details className="today-line">
          <summary>
            <span className="today-line-label">This week</span>
            <span className="today-line-value">
              <strong>{progress}%</strong>
              <span className="muted">
                {completedExercises}/{totalExercises} done
              </span>
            </span>
          </summary>

          <div className="today-line-body">
            <p className="muted dashboard-phase-label">
              Week {week} &middot; {phase.name}
            </p>
            <div className="progress-bar" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </details>

        <details className="today-line">
          <summary>
            <span className="today-line-label">Recent PRs</span>
            <span className="today-line-value">
              {recentPRs.length > 0 ? (
                <>
                  <strong>
                    {recentPRs[0].value} {recentPRs[0].unit}
                  </strong>
                  <span className="muted">{recentPRs[0].exercise}</span>
                </>
              ) : (
                <span className="muted">None yet</span>
              )}
            </span>
          </summary>

          <div className="today-line-body">
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
              <p className="muted">
                PRs are saved automatically when you beat a best in a workout, or you can{" "}
                <Link href="/stats" className="dashboard-inline-link">
                  add one by hand
                </Link>
                .
              </p>
            )}
          </div>
        </details>
      </div>
    </>
  );
}
