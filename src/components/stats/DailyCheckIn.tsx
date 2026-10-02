"use client";

import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import {
  DAILY_SLIDERS,
  PAIN_SLIDERS,
  SLEEP_MAX,
  SLEEP_MIN,
  SLEEP_STEP,
  applyCheckIn,
  checkedInToday,
  initialCheckIn,
  stepSleep,
  type CheckInAnswers,
  type SliderField
} from "@/lib/dailyCheckIn";
import { calculateRecovery, recoveryStatus } from "@/lib/recovery";

function Slider({
  field,
  value,
  onChange
}: {
  field: SliderField;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = `checkin-${field.key}`;
  return (
    <div className="checkin-slider">
      <div className="checkin-slider-head">
        <label htmlFor={id}>{field.label}</label>
        <output htmlFor={id} className="checkin-slider-value">
          {value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={field.min}
        max={field.max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${value} out of 10`}
      />
      <div className="checkin-slider-scale" aria-hidden="true">
        <span>{field.low}</span>
        <span>{field.high}</span>
      </div>
    </div>
  );
}

/**
 * The daily check-in: sleep, four everyday sliders, and pain behind
 * "Anything hurting?". Built to take under 30 seconds on a phone with no
 * keyboard (sleep uses steppers; typing it is optional).
 */
export function DailyCheckIn({ compact = false }: { compact?: boolean }) {
  const { stats, setStats, saveStats, history } = useRecoveryStats();
  const [answers, setAnswers] = useState<CheckInAnswers>(() => initialCheckIn(stats));
  const [painOpen, setPainOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  // The tracker loads stats after mount; start from them until the athlete moves something.
  useEffect(() => {
    if (!touched) setAnswers(initialCheckIn(stats));
  }, [stats, touched]);

  // saveStats saves the context's current `stats`, so put the entry there
  // first and save on the next render, once the context has it.
  useEffect(() => {
    if (!pendingSave) return;
    setPendingSave(false);
    saveStats();
  }, [pendingSave, saveStats]);

  const alreadyToday = checkedInToday(history);

  function update(key: keyof CheckInAnswers, value: number) {
    setTouched(true);
    setSaved(null);
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const entry = applyCheckIn(stats, answers, { painOpen });
    setStats(entry);
    setPendingSave(true);
    setSaved(calculateRecovery(entry));
  }

  return (
    <section className="panel daily-checkin" aria-labelledby="daily-checkin-title">
      <p className="micro micro-gold">Daily check-in &middot; 30 seconds</p>
      <h2 id="daily-checkin-title">How are you today?</h2>
      {alreadyToday && !compact && (
        <p className="muted">You checked in today. Saving again updates today&apos;s entry.</p>
      )}

      <div className="checkin-sleep">
        <label htmlFor="checkin-sleep">Sleep last night</label>
        <div className="checkin-stepper">
          <button
            type="button"
            className="ghost"
            aria-label="Half an hour less sleep"
            onClick={() => update("sleep", stepSleep(answers.sleep, -1))}
          >
            <Minus size={22} aria-hidden="true" />
          </button>
          <span className="checkin-sleep-value">
            <input
              id="checkin-sleep"
              type="number"
              inputMode="decimal"
              min={SLEEP_MIN}
              max={SLEEP_MAX}
              step={SLEEP_STEP}
              value={answers.sleep}
              onChange={(event) => {
                const hours = Number(event.target.value);
                if (!Number.isNaN(hours)) update("sleep", Math.min(SLEEP_MAX, Math.max(SLEEP_MIN, hours)));
              }}
            />
            <span aria-hidden="true">h</span>
          </span>
          <button
            type="button"
            className="ghost"
            aria-label="Half an hour more sleep"
            onClick={() => update("sleep", stepSleep(answers.sleep, 1))}
          >
            <Plus size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      {DAILY_SLIDERS.map((field) => (
        <Slider key={field.key} field={field} value={answers[field.key]} onChange={(value) => update(field.key, value)} />
      ))}

      <button
        type="button"
        className="ghost checkin-pain-toggle"
        aria-expanded={painOpen}
        aria-controls="checkin-pain"
        onClick={() => {
          setPainOpen((open) => !open);
          setSaved(null);
        }}
      >
        Anything hurting?
        <ChevronDown size={18} aria-hidden="true" className={painOpen ? "checkin-chevron-open" : undefined} />
      </button>
      {painOpen && (
        <div id="checkin-pain" className="checkin-pain">
          <p className="muted">0 means no pain. Your coach sees anything 4 or higher.</p>
          {PAIN_SLIDERS.map((field) => (
            <Slider key={field.key} field={field} value={answers[field.key]} onChange={(value) => update(field.key, value)} />
          ))}
        </div>
      )}

      <button type="button" className="checkin-save" onClick={handleSave}>
        {alreadyToday ? "Update today's check-in" : "Save check-in"}
      </button>

      {saved !== null && (
        <p className="checkin-saved" role="status">
          <Check size={18} aria-hidden="true" /> Saved. Readiness {saved}% &middot; {recoveryStatus(saved).label}.{" "}
          {!compact && <Link href="/dashboard">Back to Today</Link>}
        </p>
      )}
    </section>
  );
}
