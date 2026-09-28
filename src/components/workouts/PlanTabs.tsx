import Link from "next/link";

const PLAN_VIEWS = [
  { href: "/workouts", label: "Workouts" },
  { href: "/calendar", label: "Calendar" }
] as const;

/** The athlete Plan tab covers two pages; this switches between them. */
export function PlanTabs({ current }: { current: (typeof PLAN_VIEWS)[number]["href"] }) {
  return (
    <nav className="tabs plan-tabs" aria-label="Plan">
      {PLAN_VIEWS.map((view) => (
        <Link
          key={view.href}
          href={view.href}
          className={view.href === current ? "btn" : "btn btn-ghost"}
          aria-current={view.href === current ? "page" : undefined}
        >
          {view.label}
        </Link>
      ))}
    </nav>
  );
}
