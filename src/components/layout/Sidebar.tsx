"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Dumbbell,
  Flame,
  GraduationCap,
  Home,
  Play
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/shared/Brand";
import { useTrackerContext } from "@/context/TrackerContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/workout", label: "Start Workout", icon: Play },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/library", label: "Exercise Library", icon: BookOpen },
  { href: "/coach", label: "Team", icon: GraduationCap }
];

export function Sidebar() {
  const pathname = usePathname();
  const { workoutStreak } = useTrackerContext();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Brand tagline="Athlete OS" />
      </div>

      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
              aria-label={item.label}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="streak-box">
        <h3>
          <Flame size={18} /> Current Streak
        </h3>
        <h2>
          {workoutStreak} day{workoutStreak === 1 ? "" : "s"}
        </h2>
        <p className="muted">
          {workoutStreak > 0
            ? "Keep it going."
            : "Log a workout today to start a streak."}
        </p>
      </div>
    </aside>
  );
}
