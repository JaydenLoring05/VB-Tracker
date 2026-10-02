"use client";

import Link from "next/link";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CoachDashboard } from "@/components/coach/CoachDashboard";
import { DashboardCards } from "@/components/dashboard/DashboardCards";
import { DemoProvider, type DemoContextValue } from "@/context/DemoContext";
import { buildDemoData, type DemoData } from "@/data/demoData";

import { DemoBanner } from "./DemoBanner";
import { DemoFilmRoom } from "./DemoFilmRoom";
import { DemoSignupPrompt } from "./DemoSignupPrompt";
import { DemoTour } from "./DemoTour";
import { DemoTrackerProvider } from "./DemoTrackerProvider";
import { DemoWorkout } from "./DemoWorkout";

type DemoView = "coach" | "athlete" | "workout" | "film";

const VIEWS: { id: DemoView; label: string; title: string }[] = [
  { id: "coach", label: "Coach view", title: "Coach dashboard" },
  { id: "athlete", label: "Athlete view", title: "Athlete view" },
  { id: "workout", label: "Workout Mode", title: "Workout Mode" },
  { id: "film", label: "Film room", title: "Film room" }
];

// App routes that have a demo version: clicking a link to them switches tabs
// instead of asking the visitor to sign up.
const DEMO_VIEW_FOR_PATH: Record<string, DemoView> = { "/workout": "workout", "/film": "film" };

// The only routes the demo may navigate to: everything else needs a login.
const PUBLIC_LINK_PATHS = ["/", "/login", "/demo"];

const TOUR_KEY = "nextrep-demo-tour-dismissed";
const TOUR_START_DELAY_MS = 900;

function tourWasDismissed() {
  try {
    return window.localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberTourDismissed() {
  try {
    window.localStorage.setItem(TOUR_KEY, "1");
  } catch {
    // Storage can be blocked (private windows); the tour just shows again next visit.
  }
}

export function DemoExperience() {
  // Dates in the sample data are relative to "today", so it is built on the
  // client after mount to avoid a server/browser timezone mismatch.
  const [data, setData] = useState<DemoData | null>(null);
  const [view, setView] = useState<DemoView>("coach");
  const [promptFeature, setPromptFeature] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    setData(buildDemoData());
  }, []);

  useEffect(() => {
    if (!data || tourWasDismissed()) return;

    const timer = window.setTimeout(() => setTourOpen(true), TOUR_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data]);

  const requestSignup = useCallback((feature?: string) => setPromptFeature(feature ?? "That action"), []);
  const closePrompt = useCallback(() => setPromptFeature(null), []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    rememberTourDismissed();
  }, []);

  const startTour = useCallback(() => {
    setView("coach");
    setTourOpen(true);
  }, []);

  const demoValue = useMemo<DemoContextValue | null>(
    () => (data ? { data, requestSignup } : null),
    [data, requestSignup]
  );

  // Safety net: real components link to app routes that need a login. Inside
  // the demo those clicks explain the demo instead of bouncing to /login.
  function interceptAppLinks(event: MouseEvent<HTMLElement>) {
    const link = (event.target as HTMLElement).closest("a[href]");
    const href = link?.getAttribute("href");
    const path = href?.split(/[?#]/)[0] ?? "";
    if (!href || !href.startsWith("/") || PUBLIC_LINK_PATHS.includes(path)) return;

    event.preventDefault();
    event.stopPropagation();
    const demoView = DEMO_VIEW_FOR_PATH[path] ?? (path.startsWith("/workout/") ? "workout" : undefined);
    if (demoView) {
      setView(demoView);
      window.scrollTo({ top: 0 });
      return;
    }
    requestSignup("That page");
  }

  return (
    <div className="demo-page">
      <DemoBanner onStartTour={startTour} />

      <main id="main-content" tabIndex={-1} className="demo-main" onClickCapture={interceptAppLinks}>
        {!data || !demoValue ? (
          <div className="panel demo-loading" role="status">
            <p className="muted">Loading the sample team...</p>
          </div>
        ) : (
          <DemoProvider value={demoValue}>
            <DemoTrackerProvider data={data} requestSignup={requestSignup}>
              <div className="demo-intro">
                <div>
                  <p className="micro micro-gold">Interactive demo</p>
                  <h1>{VIEWS.find((option) => option.id === view)?.title}</h1>
                  <p className="muted">
                    {view === "coach"
                      ? `${data.team.name}, week ${data.spotlight.week} of the season. Click around, nothing is saved.`
                      : view === "athlete"
                        ? "This is what Ava Thompson sees when she opens NextRep today."
                        : view === "workout"
                          ? `Ava's ${data.workout.day} lower-body session. Log a set, start the rest timer, finish for the summary. Nothing is saved.`
                          : "Review game film and tag plays by athlete, with the mouse, the keyboard (press ?) or your voice."}
                  </p>
                </div>

                <div className="demo-view-switch" data-demo-view-switch role="group" aria-label="Demo view">
                  {VIEWS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={view === option.id ? "" : "ghost"}
                      aria-pressed={view === option.id}
                      onClick={() => setView(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="demo-view" key={view}>
                {view === "coach" ? (
                  <CoachDashboard
                    teams={[data.team]}
                    activeTeam={data.team}
                    onSelectTeam={() => {}}
                    onCreateTeam={async () => {
                      requestSignup("Creating more teams");
                      return false;
                    }}
                    regenerateInviteCode={async () => {
                      requestSignup("Regenerating invite codes");
                      return false;
                    }}
                  />
                ) : view === "athlete" ? (
                  <DashboardCards />
                ) : view === "workout" ? (
                  <DemoWorkout workout={data.workout} onExit={() => setView("athlete")} />
                ) : (
                  <DemoFilmRoom data={data} requestSignup={requestSignup} />
                )}
              </div>

              <section className="panel demo-closing">
                <h2>Ready to run this with your own team?</h2>
                <p className="muted">
                  Set up your roster in minutes. Free for 30 days, no credit card.
                </p>
                <div className="demo-closing-actions">
                  <Link href="/login?mode=sign-up" className="demo-cta">
                    Start Free Team Pilot
                  </Link>
                  <Link href="/" className="demo-secondary-link">
                    Back to the NextRep home page
                  </Link>
                </div>
              </section>
            </DemoTrackerProvider>
          </DemoProvider>
        )}
      </main>

      <DemoTour open={tourOpen && view === "coach"} onClose={closeTour} />
      <DemoSignupPrompt feature={promptFeature} onClose={closePrompt} />
    </div>
  );
}
