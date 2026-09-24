"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type TourStep = { selector: string; title: string; body: string };

// Steps point at the real dashboard by selector so the tour never forks or
// wraps the production components.
const STEPS: TourStep[] = [
  {
    selector: ".demo-snapshot",
    title: "Your team at a glance",
    body: "Readiness, jump numbers and workout completion for the whole roster, updated as athletes check in."
  },
  {
    selector: ".attention-center",
    title: "Start with the Attention Center",
    body: "Your day, ranked. Pain trends, readiness drops, missed workouts and new PRs, computed from check-ins."
  },
  {
    selector: ".roster-table",
    title: "See every athlete's readiness",
    body: "Color-coded scores for the whole roster. Tap any athlete for recovery, PR and workout history."
  },
  {
    selector: "[data-demo-view-switch]",
    title: "Then see what athletes see",
    body: "Switch to the athlete view to preview the daily check-in, workout and PR tracking on their side."
  }
];

const TARGET_CLASS = "demo-tour-target";
// Below the sticky banner, matching the scroll-margin on the highlighted target.
const TARGET_MIN_TOP = 80;

export function DemoTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Start from the first step every time the tour is opened.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const target = document.querySelector<HTMLElement>(current.selector);
    if (!target) return;

    target.classList.add(TARGET_CLASS);

    // Only scroll when the target is not already comfortably in view, so the
    // tour never yanks the page on first load.
    const { top } = target.getBoundingClientRect();
    if (top < TARGET_MIN_TOP || top > window.innerHeight * 0.5) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }

    return () => target.classList.remove(TARGET_CLASS);
  }, [open, current.selector]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <section className="demo-tour" role="region" aria-label="Guided tour" aria-live="polite">
      <div className="demo-tour-header">
        <p className="demo-tour-step">
          Step {step + 1} of {STEPS.length}
        </p>
        <button type="button" className="ghost demo-tour-close" onClick={onClose} aria-label="Skip the tour">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <h2>{current.title}</h2>
      <p className="muted">{current.body}</p>

      <div className="demo-tour-actions">
        {step > 0 && (
          <button type="button" className="ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button type="button" onClick={() => (isLast ? onClose() : setStep(step + 1))}>
          {isLast ? "Done" : "Next"}
        </button>
      </div>
    </section>
  );
}
