"use client";

import { Flame, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Brand } from "@/components/shared/Brand";
import { useTrackerContext } from "@/context/TrackerContext";
import { useNavRole } from "@/hooks/useNavRole";
import { activePrimaryHref, isNavLinkActive, navItemsFor, type NavLink } from "@/lib/navItems";
import { TeamRole } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const role = useNavRole();
  const { workoutStreak } = useTrackerContext();

  return (
    <aside className="sidebar">
      <div className="brand">
        <Brand tagline="Athlete OS" />
      </div>

      <MainNav role={role} pathname={pathname} />

      <div className="streak-box">
        <p className="display streak-title">
          <Flame size={18} aria-hidden="true" /> Current Streak
        </p>
        <p className="display streak-count">
          {workoutStreak} day{workoutStreak === 1 ? "" : "s"}
        </p>
        <p className="muted">
          {workoutStreak > 0
            ? "Keep it going."
            : "Log a workout today to start a streak."}
        </p>
      </div>
    </aside>
  );
}

function NavItem({ item, active, onNavigate }: { item: NavLink; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={active ? "active" : ""}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <Icon size={20} aria-hidden="true" />
      <span className="nav-label">{item.label}</span>
    </Link>
  );
}

/** Four primary destinations for the role, plus "More" for everything else. */
export function MainNav({ role, pathname }: { role: TeamRole | null; pathname: string }) {
  const config = navItemsFor(role);
  const primaryHref = activePrimaryHref(config, pathname);
  const activeMore = primaryHref ? null : (config.more.find((item) => isNavLinkActive(item, pathname)) ?? null);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  const moreRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMoreOpen(false);
      toggleRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [moreOpen]);

  return (
    <nav className="nav" aria-label="Main">
      {config.primary.map((item) => (
        <NavItem key={item.href} item={item} active={item.href === primaryHref} />
      ))}

      <div className="nav-more" ref={moreRef}>
        <button
          ref={toggleRef}
          type="button"
          className={`nav-more-toggle${activeMore ? " active" : ""}`}
          aria-expanded={moreOpen}
          aria-controls={moreId}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span className="nav-label">More</span>
        </button>

        <div id={moreId} className="nav-more-menu" hidden={!moreOpen}>
          {config.more.map((item) => (
            <NavItem
              key={item.href}
              // Feedback records which page it's about.
              item={item.href === "/feedback" ? { ...item, href: `/feedback?from=${encodeURIComponent(pathname)}` } : item}
              active={item === activeMore}
              onNavigate={() => setMoreOpen(false)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
