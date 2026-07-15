"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useWorkoutProgress } from "@/hooks/useWorkoutProgress";

const navItems = [
  { href: "/", label: "🏠 Dashboard" },
  { href: "/workouts", label: "🏋️ Workouts" },
  { href: "/workout", label: "▶️ Start Workout" },
  { href: "/stats", label: "📊 Stats" },
  { href: "/calendar", label: "🗓️ Calendar" },
  { href: "/library", label: "📚 Exercise Library" }
];

export function Sidebar() {
  const pathname = usePathname();
  const { completedExercises } = useWorkoutProgress();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">🏐</div>
        <div>
          <h2>V18.5 TRACKER</h2>
          <p>ATHLETE OPERATING SYSTEM</p>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="streak-box">
        <h3>🔥 Current Streak</h3>
        <h2>{completedExercises > 0 ? 1 : 0} day</h2>
        <p className="muted">A humble beginning. Civilization limps forward.</p>
      </div>
    </aside>
  );
}
