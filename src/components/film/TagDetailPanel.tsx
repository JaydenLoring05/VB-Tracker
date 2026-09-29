"use client";

import { RefObject } from "react";

import { formatTimestamp } from "@/lib/film";
import { TagDraft } from "@/lib/filmHotkeys";

import {
  ATTACK_DIRECTION_LABELS,
  ATTACK_DIRECTIONS,
  BLOCK_OUTCOME_LABELS,
  BLOCK_OUTCOMES,
  detailKindFor,
  PASS_RATINGS,
  SET_TYPE_LABELS,
  SET_TYPES,
  SET_ZONES,
  TAG_LABELS,
  TagDetailFields
} from "./tagMeta";

export type FilmAthlete = { userId: string; displayName: string };

function Choice<T extends string | number>({
  label,
  options,
  value,
  format,
  onChange
}: {
  label: string;
  options: readonly T[];
  value: T | null | undefined;
  format?: (option: T) => string;
  onChange: (value: T | null) => void;
}) {
  return (
    <div className="tag-detail-field" role="group" aria-label={label}>
      <span className="tag-detail-label">{label}</span>
      <div className="tag-detail-choices">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={String(option)}
              type="button"
              className={active ? "ghost tag-chip active" : "ghost tag-chip"}
              aria-pressed={active}
              onClick={() => onChange(active ? null : option)}
            >
              {format ? format(option) : String(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The inline panel that opens when a tag button (or tag hotkey) is
 * pressed. Holds the athlete, the contextual detail for that tag type, an
 * optional note, and Save.
 */
export function TagDetailPanel({
  draft,
  athletes,
  selectedAthleteId,
  note,
  hint,
  noteRef,
  onAthleteChange,
  onDetailsChange,
  onNoteChange,
  onSave,
  onCancel
}: {
  draft: TagDraft;
  athletes: FilmAthlete[];
  selectedAthleteId: string | null;
  note: string;
  hint: string | null;
  noteRef: RefObject<HTMLInputElement | null>;
  onAthleteChange: (athleteId: string | null) => void;
  onDetailsChange: (details: Partial<TagDetailFields>) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const kind = detailKindFor(draft.tag);
  const details = draft.details;

  return (
    <div className="tag-detail-panel" aria-label={`New ${TAG_LABELS[draft.tag]} tag`}>
      <div className="tag-detail-head">
        <strong>
          {TAG_LABELS[draft.tag]} <span className="muted">@ {formatTimestamp(draft.seconds)}</span>
        </strong>
        {hint && (
          <span className="tag-detail-hint" aria-live="polite">
            {hint}
          </span>
        )}
      </div>

      <label className="tag-detail-field">
        <span className="tag-detail-label">Athlete</span>
        <select
          value={selectedAthleteId ?? ""}
          onChange={(event) => onAthleteChange(event.target.value || null)}
        >
          <option value="">No athlete</option>
          {athletes.map((athlete, index) => (
            <option key={athlete.userId} value={athlete.userId}>
              {index < 9 ? `${index + 1}. ` : ""}
              {athlete.displayName}
            </option>
          ))}
        </select>
      </label>

      {kind === "pass" && (
        <Choice
          label="Rating"
          options={PASS_RATINGS}
          value={details.pass_rating}
          onChange={(pass_rating) => onDetailsChange({ pass_rating })}
        />
      )}

      {kind === "set" && (
        <>
          <Choice
            label="Zone"
            options={SET_ZONES}
            value={details.set_zone}
            onChange={(set_zone) => onDetailsChange({ set_zone })}
          />
          <Choice
            label="Set type"
            options={SET_TYPES}
            value={details.set_type}
            format={(option) => SET_TYPE_LABELS[option]}
            onChange={(set_type) => onDetailsChange({ set_type })}
          />
        </>
      )}

      {kind === "block" && (
        <Choice
          label="Outcome"
          options={BLOCK_OUTCOMES}
          value={details.block_outcome}
          format={(option) => BLOCK_OUTCOME_LABELS[option]}
          onChange={(block_outcome) => onDetailsChange({ block_outcome })}
        />
      )}

      {kind === "attack" && (
        <Choice
          label="Direction"
          options={ATTACK_DIRECTIONS}
          value={details.attack_direction}
          format={(option) => ATTACK_DIRECTION_LABELS[option]}
          onChange={(attack_direction) => onDetailsChange({ attack_direction })}
        />
      )}

      <label className="tag-detail-field">
        <span className="tag-detail-label">Note</span>
        <input
          ref={noteRef}
          value={note}
          maxLength={280}
          placeholder="Optional"
          onChange={(event) => onNoteChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSave();
            } else if (event.key === "Escape") {
              event.preventDefault();
              onCancel();
            }
          }}
        />
      </label>

      <div className="button-row">
        <button type="button" onClick={onSave}>
          Save tag
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
