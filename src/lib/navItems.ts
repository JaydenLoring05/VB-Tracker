import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clapperboard,
  Dumbbell,
  GraduationCap,
  Home,
  Play,
  type LucideIcon
} from "lucide-react";

import type { TeamRole } from "@/types";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra route prefixes that also light this item up (e.g. Plan covers /calendar). */
  alsoMatches?: string[];
};

export type NavConfig = {
  /** Always visible: the sidebar on desktop, the bottom bar on mobile. */
  primary: NavLink[];
  /** One tap away behind "More". Every route that isn't primary lives here. */
  more: NavLink[];
};

/** Every page reachable from the app nav. Each role must reach all of them. */
export const NAV_ROUTES = ["/dashboard", "/workouts", "/workout", "/stats", "/calendar", "/film", "/library", "/coach", "/plan"];

const startWorkout: NavLink = { href: "/workout", label: "Start Workout", icon: Play };
const calendar: NavLink = { href: "/calendar", label: "Calendar", icon: CalendarDays };
const library: NavLink = { href: "/library", label: "Exercise Library", icon: BookOpen };
const film: NavLink = { href: "/film", label: "Film", icon: Clapperboard };
const progress: NavLink = { href: "/stats", label: "Progress", icon: BarChart3 };

const athleteNav: NavConfig = {
  primary: [
    { href: "/dashboard", label: "Today", icon: Home, alsoMatches: ["/workout"] },
    { href: "/workouts", label: "Plan", icon: Dumbbell, alsoMatches: ["/calendar", "/plan"] },
    progress,
    film
  ],
  more: [startWorkout, calendar, library, { href: "/coach", label: "Team", icon: GraduationCap }]
};

const coachNav: NavConfig = {
  primary: [
    { href: "/coach", label: "Team", icon: GraduationCap },
    { href: "/plan", label: "Plan", icon: ClipboardList },
    film,
    progress
  ],
  more: [
    { href: "/dashboard", label: "My Training", icon: Home },
    { href: "/workouts", label: "Workouts", icon: Dumbbell },
    startWorkout,
    calendar,
    library
  ]
};

/**
 * The nav for a role. Anyone who isn't a coach (athletes, and people with no
 * team yet or whose role is still loading) gets the athlete nav.
 */
export function navItemsFor(role: TeamRole | null | undefined): NavConfig {
  return role === "coach" ? coachNav : athleteNav;
}

function matchesPath(prefix: string, pathname: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavLinkActive(link: NavLink, pathname: string) {
  return [link.href, ...(link.alsoMatches ?? [])].some((prefix) => matchesPath(prefix, pathname));
}

/** The primary item for this page, or null when the page lives under More. */
export function activePrimaryHref(config: NavConfig, pathname: string) {
  return config.primary.find((link) => isNavLinkActive(link, pathname))?.href ?? null;
}
