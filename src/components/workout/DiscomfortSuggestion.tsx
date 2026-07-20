"use client";

import { useState } from "react";

import { getExercise } from "@/data/exercises";
import { getSubstitutionCandidates } from "@/hooks/useExerciseSubstitutions";
import { StatEntry } from "@/types";

const BODY_PART_CATEGORIES: {
  key: "kneePain" | "shoulderPain" | "lowerBackPain" | "anklePain";
  label: string;
  categories: string[];
}[] = [
  { key: "kneePain", label: "knee", categories: ["Jump Development", "Landing Mechanics", "Knee Strength"] },
  { key: "shoulderPain", label: "shoulder", categories: ["Shoulder Health", "Hitting Power"] },
  { key: "lowerBackPain", label: "lower-back", categories: ["Rotational Core"] },
  { key: "anklePain", label: "ankle", categories: ["Jump Development", "Landing Mechanics", "Speed & Agility"] }
];

const DISCOMFORT_THRESHOLD = 4;

/**
 * A dismissible nudge, not an automatic swap -- surfaces one of an
 * exercise's existing curated substitutions when today's check-in reports
 * discomfort relevant to that exercise's category. Reuses the same
 * substitution system DayCard's manual swap picker already uses.
 */
export function DiscomfortSuggestion({
  originalExercise,
  stats,
  onSwap
}: {
  originalExercise: string;
  stats: StatEntry | null;
  onSwap: (chosen: string) => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !stats) return null;

  const catalogEntry = getExercise(originalExercise);
  if (!catalogEntry) return null;

  const match = BODY_PART_CATEGORIES.find(
    ({ key, categories }) => Number(stats[key]) >= DISCOMFORT_THRESHOLD && categories.includes(catalogEntry.category)
  );
  if (!match) return null;

  const candidates = getSubstitutionCandidates(originalExercise);
  if (candidates.length === 0) return null;

  const topCandidate = candidates[0];

  return (
    <div className="discomfort-suggestion">
      <p>
        You reported {match.label} discomfort today. Want to swap to <strong>{topCandidate.name}</strong> instead?
      </p>
      <div className="discomfort-suggestion-actions">
        <button type="button" onClick={() => onSwap(topCandidate.name)}>
          Swap
        </button>
        <button type="button" className="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
