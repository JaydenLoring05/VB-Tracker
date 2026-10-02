"use client";

import { ChevronLeft, X } from "lucide-react";
import { useState } from "react";

import { formatTimestamp } from "@/lib/film";
import { buildQuickTag, QUICK_RESULTS, QUICK_SKILLS, QuickSkill, QuickTagRow } from "@/lib/filmQuickTag";
import { FilmResult } from "@/types";

import { FilmAthlete } from "./TagDetailPanel";

type Pending = { seconds: number; athleteId: string; skill: QuickSkill | null };

/**
 * Tag a play in three taps: athlete, skill, result. The video time is
 * taken on the first tap, right after the play, and the tag saves on the
 * third.
 */
export function QuickTagger({
  athletes,
  getCurrentTime,
  onSave
}: {
  athletes: FilmAthlete[];
  getCurrentTime: () => number;
  onSave: (input: { seconds: number; athleteId: string; row: QuickTagRow }) => void;
}) {
  const [pending, setPending] = useState<Pending | null>(null);

  if (athletes.length === 0) {
    return (
      <div className="quick-tagger">
        <p className="muted">Once athletes join your team, you can tag their plays here.</p>
      </div>
    );
  }

  function pickAthlete(athleteId: string) {
    setPending({ seconds: Math.floor(getCurrentTime()), athleteId, skill: null });
  }

  function pickResult(result: FilmResult) {
    if (!pending?.skill) return;
    const row = buildQuickTag(pending.skill, result);
    if (row) onSave({ seconds: pending.seconds, athleteId: pending.athleteId, row });
    setPending(null);
  }

  const athleteName = pending ? athletes.find((athlete) => athlete.userId === pending.athleteId)?.displayName : null;
  const skillLabel = pending?.skill ? QUICK_SKILLS.find((skill) => skill.value === pending.skill)?.label : null;

  return (
    <div className="quick-tagger" role="group" aria-label="Tag a play">
      <div className="quick-tagger-head">
        <span className="quick-tagger-step" aria-live="polite">
          {!pending && "Tap who made the play"}
          {pending && (
            <>
              <strong>{formatTimestamp(pending.seconds)}</strong> · {athleteName}
              {skillLabel ? ` · ${skillLabel}` : ""}
            </>
          )}
        </span>
        {pending && (
          <span className="quick-tagger-nav">
            <button
              type="button"
              className="ghost"
              onClick={() => setPending(pending.skill ? { ...pending, skill: null } : null)}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button type="button" className="ghost" aria-label="Cancel tag" onClick={() => setPending(null)}>
              <X size={16} />
            </button>
          </span>
        )}
      </div>

      {!pending && (
        <div className="quick-tagger-choices">
          {athletes.map((athlete) => (
            <button key={athlete.userId} type="button" className="quick-choice" onClick={() => pickAthlete(athlete.userId)}>
              {athlete.displayName}
            </button>
          ))}
        </div>
      )}

      {pending && !pending.skill && (
        <div className="quick-tagger-choices">
          {QUICK_SKILLS.map((skill) => (
            <button
              key={skill.value}
              type="button"
              className="quick-choice"
              onClick={() => setPending({ ...pending, skill: skill.value })}
            >
              {skill.label}
            </button>
          ))}
        </div>
      )}

      {pending?.skill && (
        <div className="quick-tagger-choices">
          {QUICK_RESULTS[pending.skill].map((result) => (
            <button
              key={result.value}
              type="button"
              className={`quick-choice quick-choice-${result.tone}`}
              onClick={() => pickResult(result.value)}
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
