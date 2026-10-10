"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { WholeNumberInput } from "@/components/shared/WholeNumberInput";
import { useTrackerContext } from "@/context/TrackerContext";
import { exercises as exerciseCatalog } from "@/data/exercises";
import { POSITION_PROGRAMS, type StartingProgramKey } from "@/data/positionPrograms";
import { useCoachRoster } from "@/hooks/useCoachRoster";
import { TeamGroup, useCustomPrograms } from "@/hooks/useCustomPrograms";
import { getExerciseMeasure } from "@/lib/exerciseMeasure";
import {
  blankProgram,
  CustomProgram,
  exerciseKey,
  formatTarget,
  hasStartingTargets,
  isFinished,
  newProgramExercise,
  ownExercises,
  parseProgramDays,
  pickAssignedProgramId,
  ProgramDay,
  ProgramExercise,
  programFromRecommended,
  validateProgram
} from "@/lib/customProgram";
import { RosterAthlete, Team } from "@/types";

type Draft = Omit<CustomProgram, "id"> & { id?: string };

const RECOMMENDED = "";

/* ------------------------------ Program editor ------------------------------ */

function ExerciseRow({
  exercise,
  index,
  count,
  remembered,
  onTyping,
  onChange,
  onMove,
  onRemove
}: {
  exercise: ProgramExercise;
  index: number;
  count: number;
  /** The coach's own exercises from this and earlier programs. */
  remembered: ProgramExercise[];
  /** The name box that has focus and its text, or null when none does. */
  onTyping: (name: string | null) => void;
  onChange: (next: ProgramExercise) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const timed = exercise.seconds != null;

  return (
    <li className="custom-program-exercise">
      <input
        className="custom-program-exercise-name"
        list="custom-program-exercise-library"
        aria-label="Exercise"
        placeholder="Exercise name"
        value={exercise.name}
        onFocus={() => onTyping(exercise.name)}
        onBlur={() => onTyping(null)}
        onChange={(event) => {
          const name = event.target.value;
          onTyping(name);
          // One of the coach's own exercises picked from the suggestions (the text arrives in
          // one jump, not one letter): bring back the sets and reps it had last time, unless
          // this row's targets were already changed. Typing letter by letter never does this,
          // so "Step-up" on the way to "Step-up lateral" doesn't pull in the wrong targets.
          const picked = Math.abs(name.length - exercise.name.length) > 1;
          const before = remembered.find((r) => exerciseKey(r.name) === exerciseKey(name));
          if (picked && before && hasStartingTargets(exercise)) {
            onChange({ ...before, name });
            return;
          }
          // Follow the name's usual measure (Planks -> seconds) unless the
          // coach already switched this row away from its default.
          const followsDefault = timed === (getExerciseMeasure(exercise.name) === "time");
          const nextTimed = getExerciseMeasure(name) === "time";
          if (followsDefault && nextTimed !== timed) {
            onChange(nextTimed ? { ...exercise, name, seconds: 30, reps: null } : { ...exercise, name, seconds: null, reps: "8" });
          } else {
            onChange({ ...exercise, name });
          }
        }}
      />
      <div className="custom-program-target">
        <WholeNumberInput
          aria-label={`Sets for ${exercise.name || "exercise"}`}
          value={exercise.sets}
          onCommit={(sets) => onChange({ ...exercise, sets })}
        />
        <span aria-hidden="true">sets ×</span>
        {timed ? (
          <WholeNumberInput
            aria-label={`Seconds for ${exercise.name || "exercise"}`}
            value={exercise.seconds}
            onCommit={(seconds) => onChange({ ...exercise, seconds })}
          />
        ) : (
          <input
            inputMode="numeric"
            aria-label={`Reps for ${exercise.name || "exercise"}`}
            placeholder="8-10"
            value={exercise.reps ?? ""}
            onChange={(event) => onChange({ ...exercise, reps: event.target.value })}
          />
        )}
        <div className="custom-program-measure" role="group" aria-label="Measure">
          <button
            type="button"
            className={timed ? "ghost" : ""}
            aria-pressed={!timed}
            onClick={() => onChange({ ...exercise, seconds: null, reps: exercise.reps ?? "8" })}
          >
            Reps
          </button>
          <button
            type="button"
            className={timed ? "" : "ghost"}
            aria-pressed={timed}
            onClick={() => onChange({ ...exercise, seconds: exercise.seconds ?? 30, reps: null })}
          >
            Sec
          </button>
        </div>
      </div>
      <div className="custom-program-row-controls">
        <button type="button" className="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
          <ArrowUp size={14} />
        </button>
        <button type="button" className="ghost" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Move down">
          <ArrowDown size={14} />
        </button>
        <button type="button" className="ghost danger-button" onClick={onRemove} aria-label={`Remove ${exercise.name || "exercise"}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function DayEditor({
  day,
  remembered,
  saveState,
  onTyping,
  onChange,
  onSave
}: {
  day: ProgramDay;
  remembered: ProgramExercise[];
  /** "saving" while this day's save runs, "saved" once it has and nothing changed since. */
  saveState: "saving" | "saved" | null;
  onTyping: (name: string | null) => void;
  onChange: (next: ProgramDay) => void;
  /** Saves the whole program as it stands, without finishing it. */
  onSave: () => void;
}) {
  function updateExercise(index: number, next: ProgramExercise) {
    onChange({ ...day, exercises: day.exercises.map((exercise, i) => (i === index ? next : exercise)) });
  }

  function moveExercise(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= day.exercises.length) return;
    const exercises = [...day.exercises];
    [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
    onChange({ ...day, exercises });
  }

  return (
    <div className={`panel custom-program-day${day.rest ? " is-rest" : ""}`}>
      <div className="custom-program-day-header">
        <h4>{day.day}</h4>
        <label className="custom-program-rest-toggle">
          <input
            type="checkbox"
            checked={!day.rest}
            onChange={(event) =>
              onChange({
                ...day,
                rest: !event.target.checked,
                title: !event.target.checked ? "Rest" : day.title === "Rest" ? "Training" : day.title
              })
            }
          />
          Training day
        </label>
      </div>

      {!day.rest && (
        <>
          <div className="custom-program-day-fields">
            <input
              aria-label={`${day.day} name`}
              placeholder="Day name, e.g. Lower Body"
              value={day.title}
              onChange={(event) => onChange({ ...day, title: event.target.value })}
            />
            <input
              aria-label={`${day.day} length in minutes`}
              placeholder="Minutes, e.g. 45-60"
              value={day.minutes}
              onChange={(event) => onChange({ ...day, minutes: event.target.value })}
            />
          </div>
          <textarea
            aria-label={`${day.day} notes`}
            placeholder="Notes for athletes (optional)"
            rows={2}
            value={day.notes}
            onChange={(event) => onChange({ ...day, notes: event.target.value })}
          />

          <ul className="custom-program-exercises">
            {day.exercises.map((exercise, index) => (
              <ExerciseRow
                key={index}
                exercise={exercise}
                index={index}
                count={day.exercises.length}
                remembered={remembered}
                onTyping={onTyping}
                onChange={(next) => updateExercise(index, next)}
                onMove={(direction) => moveExercise(index, direction)}
                onRemove={() => onChange({ ...day, exercises: day.exercises.filter((_, i) => i !== index) })}
              />
            ))}
          </ul>

          <button
            type="button"
            className="ghost"
            onClick={() => onChange({ ...day, exercises: [...day.exercises, newProgramExercise("")] })}
          >
            <Plus size={14} /> Add exercise
          </button>
        </>
      )}

      <div className="custom-program-day-save">
        <button type="button" className="ghost" onClick={onSave} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : `Save ${day.day}`}
        </button>
        {saveState === "saved" && (
          <span className="muted" role="status">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The open draft is also kept in this browser on every change, so a closed
 * tab or a dead battery doesn't lose what hasn't been saved yet. It stays on
 * the device and is cleared once the program is saved.
 */
type LocalCopy = { draft: Draft; savedAt: number };

function readLocalCopy(key: string): LocalCopy | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft || !Array.isArray(parsed.draft.days)) return null;
    return {
      draft: {
        ...(typeof parsed.draft.id === "string" ? { id: parsed.draft.id } : {}),
        name: String(parsed.draft.name ?? ""),
        days: parseProgramDays(parsed.draft.days)
      },
      savedAt: Number(parsed.savedAt) || 0
    };
  } catch {
    return null;
  }
}

function writeLocalCopy(key: string, draft: Draft) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ draft: { id: draft.id, name: draft.name, days: draft.days }, savedAt: Date.now() }));
  } catch {
    // Private browsing or a full disk: the per-day save still works.
  }
}

function clearLocalCopy(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}

function ProgramEditorForm({
  initial,
  startsUnsaved,
  finishedBefore,
  storageKey,
  savedPrograms,
  saving,
  onSave,
  onSaveDraft,
  onCancel
}: {
  initial: Draft;
  /** True when `initial` came from this browser's copy and isn't saved anywhere else yet. */
  startsUnsaved: boolean;
  /** True when athletes can already be on this program (it was finished before). */
  finishedBefore: boolean;
  /** Where this browser keeps the open draft. */
  storageKey: string;
  /** Every program this team already has, newest first. */
  savedPrograms: CustomProgram[];
  saving: boolean;
  onSave: (draft: Draft) => void;
  /** Saves without finishing. Resolves to the program's id, or null on failure. */
  onSaveDraft: (draft: Draft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  // The draft as it was last saved to the database. Anything else is unsaved.
  const [lastSaved, setLastSaved] = useState<Draft | null>(startsUnsaved ? null : initial);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [savedDay, setSavedDay] = useState<string | null>(null);
  const unsaved = draft !== lastSaved;
  const [showProblems, setShowProblems] = useState(false);
  const problems = validateProgram(draft);
  // Text of the exercise name box being typed in, so its own half-typed text isn't offered back.
  const [typing, setTyping] = useState<string | null>(null);
  // The coach's own exercises, from this draft first and then saved programs, so one
  // typed on Monday is offered on Tuesday before anything is saved.
  const remembered = useMemo(
    () => ownExercises([draft, ...savedPrograms], exerciseCatalog.map((exercise) => exercise.name)),
    [draft, savedPrograms]
  );

  useEffect(() => {
    if (unsaved) writeLocalCopy(storageKey, draft);
  }, [draft, unsaved, storageKey]);

  function updateDay(next: ProgramDay) {
    setDraft((current) => ({ ...current, days: current.days.map((day) => (day.day === next.day ? next : day)) }));
  }

  async function handleSaveDay(dayName: string) {
    const snapshot = draft;
    setSavingDay(dayName);
    const id = await onSaveDraft(snapshot);
    setSavingDay(null);
    if (!id) return;
    // A new program has an id from its first save on, so later saves update it.
    const withId = snapshot.id ? snapshot : { ...snapshot, id };
    clearLocalCopy(storageKey);
    setDraft((current) => (current === snapshot ? withId : { ...current, id }));
    setLastSaved(withId);
    setSavedDay(dayName);
  }

  function handleSave() {
    if (problems.length > 0) {
      setShowProblems(true);
      return;
    }
    onSave(draft);
  }

  function handleCancel() {
    if (unsaved && !window.confirm("Leave without saving? Changes since your last save will be lost.")) return;
    clearLocalCopy(storageKey);
    onCancel();
  }

  const busy = saving || savingDay != null;

  return (
    <div className="custom-program-editor">
      <datalist id="custom-program-exercise-library">
        {exerciseCatalog.map((exercise) => (
          <option key={exercise.name} value={exercise.name} />
        ))}
        {remembered
          .filter((exercise) => typing == null || exerciseKey(exercise.name) !== exerciseKey(typing))
          .map((exercise) => (
            <option key={`own-${exercise.name}`} value={exercise.name} label={`${exercise.name} (yours)`} />
          ))}
      </datalist>

      <label className="custom-program-name">
        <span className="micro">Program name</span>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>

      <p className="muted">
        This week repeats every week. Pick training days, name them, and set each exercise as sets × reps or sets ×
        seconds. Type any exercise, or pick one from the library. Exercises you add yourself show up in the
        suggestions next time, and picking one brings back its sets and reps.
      </p>

      {draft.days.map((day) => (
        <DayEditor
          key={day.day}
          day={day}
          remembered={remembered}
          saveState={savingDay === day.day ? "saving" : !unsaved && savedDay === day.day ? "saved" : null}
          onTyping={setTyping}
          onChange={updateDay}
          onSave={() => handleSaveDay(day.day)}
        />
      ))}

      {showProblems && problems.length > 0 && (
        <ul className="program-guardrail-warning" role="alert">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <p className="muted">
        {finishedBefore
          ? "Saving a day keeps your work. Athletes keep the last finished week until you press Save program."
          : "Saving a day keeps your work, even with days still empty. Save program checks the whole week, and then you can assign it."}
      </p>

      <div className="program-full-editor-actions">
        <button type="button" onClick={handleSave} disabled={busy}>
          {saving ? "Saving…" : "Save program"}
        </button>
        <button type="button" className="ghost" onClick={handleCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ Assignments ------------------------------ */

function ProgramSelect({
  label,
  value,
  programs,
  fallbackLabel,
  onChange
}: {
  label: string;
  value: string | null;
  programs: CustomProgram[];
  fallbackLabel: string;
  onChange: (programId: string | null) => void;
}) {
  return (
    <select aria-label={label} value={value ?? RECOMMENDED} onChange={(event) => onChange(event.target.value || null)}>
      <option value={RECOMMENDED}>{fallbackLabel}</option>
      {/* A program saved day by day but never finished can't be assigned yet. */}
      {programs.filter((program) => isFinished(program) || program.id === value).map((program) => (
        <option key={program.id} value={program.id}>
          {program.name}
        </option>
      ))}
    </select>
  );
}

function GroupCard({
  group,
  roster,
  programs,
  programId,
  onToggleMember,
  onAssign,
  onDelete
}: {
  group: TeamGroup;
  roster: RosterAthlete[];
  programs: CustomProgram[];
  programId: string | null;
  onToggleMember: (userId: string, inGroup: boolean) => void;
  onAssign: (programId: string | null) => void;
  onDelete: () => void;
}) {
  return (
    <div className="custom-program-group">
      <div className="custom-program-group-header">
        <strong>{group.name}</strong>
        <ProgramSelect
          label={`Program for ${group.name}`}
          value={programId}
          programs={programs}
          fallbackLabel="Team program"
          onChange={onAssign}
        />
        <button type="button" className="ghost danger-button" onClick={onDelete} aria-label={`Delete group ${group.name}`}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="custom-program-group-members">
        {roster.length === 0 && <p className="muted">No athletes on the roster yet.</p>}
        {roster.map((athlete) => (
          <label key={athlete.userId}>
            <input
              type="checkbox"
              checked={group.memberIds.includes(athlete.userId)}
              onChange={(event) => onToggleMember(athlete.userId, event.target.checked)}
            />
            {athlete.displayName}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Panel ------------------------------ */

export function CustomProgramPanel({ team }: { team: Team }) {
  const { week } = useTrackerContext();
  const { roster } = useCoachRoster(team);
  const {
    loading,
    error,
    notSetUp,
    programs,
    groups,
    assignments,
    saveProgram,
    saveDraft,
    discardDraft,
    deleteProgram,
    createGroup,
    deleteGroup,
    setGroupMember,
    assignProgram
  } = useCustomPrograms(team);

  const [editing, setEditing] = useState<Draft | null>(null);
  // True when the open draft came from this browser's copy rather than the database.
  const [pickedUp, setPickedUp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const storageKey = `nextrep:program-draft:${team.id}`;
  // Unsaved work this browser kept from last time, offered as "Pick up where you left off".
  const [leftOver, setLeftOver] = useState<LocalCopy | null>(null);

  useEffect(() => {
    // Read after mount: the server render has no localStorage.
    if (!editing) setLeftOver(readLocalCopy(storageKey));
  }, [editing, storageKey]);

  const teamProgramId = assignments.find((a) => a.scope === "team")?.programId ?? null;
  const programName = useMemo(() => new Map(programs.map((p) => [p.id, p.name])), [programs]);

  if (loading) {
    return (
      <div className="panel">
        <p className="muted">Loading your programs...</p>
      </div>
    );
  }

  if (notSetUp) {
    return (
      <div className="panel">
        <h3>Build your own program</h3>
        <p className="muted">
          Custom programs need one database update first: run supabase/schema_v43_team_programs.sql in the Supabase
          SQL Editor, then reload.
        </p>
      </div>
    );
  }

  async function handleSave(draft: Draft) {
    setSaving(true);
    const id = await saveProgram(draft);
    setSaving(false);
    if (id) {
      clearLocalCopy(storageKey);
      setEditing(null);
    }
  }

  function startEditing(draft: Draft, fromThisBrowser = false) {
    setPickedUp(fromThisBrowser);
    setEditing(draft);
  }

  /** What the editor opens: the saved draft if there is one, else the finished week. */
  function draftOf(program: CustomProgram): Draft {
    return program.draft
      ? { id: program.id, name: program.draft.name, days: program.draft.days }
      : { id: program.id, name: program.name, days: program.days };
  }

  function pickUp(copy: LocalCopy) {
    // The program may have been deleted since; then this saves as a new one.
    const stillThere = copy.draft.id != null && programs.some((p) => p.id === copy.draft.id);
    startEditing(stillThere ? copy.draft : { name: copy.draft.name, days: copy.draft.days }, true);
  }

  async function handleDiscardDraft(program: CustomProgram) {
    if (window.confirm(`Discard the unfinished changes to "${program.name}"? Athletes keep the week they have now.`)) {
      await discardDraft(program);
    }
  }

  async function handleDelete(program: CustomProgram) {
    if (!window.confirm(`Delete "${program.name}"? Anyone on it goes back to the next program up, or the recommended plan.`)) {
      return;
    }
    await deleteProgram(program.id);
  }

  if (editing) {
    const newestFirst = [...programs].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    const saved = editing.id ? programs.find((p) => p.id === editing.id) : undefined;
    return (
      <section className="panel custom-program-panel">
        <h3>{editing.id ? `Edit ${editing.name}` : "New program"}</h3>
        <ProgramEditorForm
          initial={editing}
          startsUnsaved={pickedUp}
          finishedBefore={saved != null && isFinished(saved)}
          storageKey={storageKey}
          savedPrograms={newestFirst}
          saving={saving}
          onSave={handleSave}
          onSaveDraft={saveDraft}
          onCancel={() => setEditing(null)}
        />
        {error && <p className="muted">{error}</p>}
      </section>
    );
  }

  const groupIdsByAthlete = (userId: string) => groups.filter((g) => g.memberIds.includes(userId)).map((g) => g.id);

  return (
    <section className="panel custom-program-panel">
      <h3>Your programs</h3>
      <p className="muted">
        Build your own week with your own split, exercises, and sets × reps or time. Assign it to the whole team, a
        group, or one athlete. Anyone without a program stays on the recommended plan below.
      </p>

      {error && <p className="program-guardrail-warning">{error}</p>}

      {leftOver && (
        <div className="custom-program-resume" role="status">
          <p>
            <strong>{leftOver.draft.name.trim() || "Your program"}</strong> has changes that weren&apos;t saved.
          </p>
          <div className="custom-program-row-controls">
            <button type="button" onClick={() => pickUp(leftOver)}>
              Pick up where you left off
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                clearLocalCopy(storageKey);
                setLeftOver(null);
              }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="custom-program-new">
        <button type="button" onClick={() => startEditing(programFromRecommended(week, "My program"))}>
          <Plus size={14} /> Start from recommended
        </button>
        <button type="button" className="ghost" onClick={() => startEditing(blankProgram("My program"))}>
          <Plus size={14} /> Start blank
        </button>
        <select
          aria-label="Start from a position template"
          value=""
          onChange={(e) => {
            const template = POSITION_PROGRAMS[e.target.value as StartingProgramKey];
            // A copy, so editing never changes the shared template.
            if (template) startEditing(structuredClone(template.program));
          }}
        >
          <option value="">Start from a position template...</option>
          {Object.values(POSITION_PROGRAMS).map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
      </div>

      {programs.length > 0 && (
        <ul className="custom-program-list">
          {programs.map((program) => {
            const finished = isFinished(program);
            // A program never finished has only its draft to show.
            const shownDays = finished ? program.days : program.draft?.days ?? program.days;
            const trainingDays = shownDays.filter((day) => !day.rest);
            return (
              <li key={program.id}>
                <div>
                  <strong>{program.name}</strong>
                  {!finished && <p className="custom-program-status">Not finished yet. Finish it to assign it.</p>}
                  {finished && program.draft && (
                    <p className="custom-program-status">
                      Unfinished changes saved. Athletes see the last finished week.
                    </p>
                  )}
                  <p className="muted">
                    {trainingDays.length} training day{trainingDays.length === 1 ? "" : "s"}:{" "}
                    {trainingDays.map((day) => `${day.day.slice(0, 3)} ${day.title}`).join(" · ")}
                  </p>
                  <details>
                    <summary className="muted">Preview</summary>
                    {trainingDays.map((day) => (
                      <p key={day.day} className="muted">
                        <strong>{day.day}:</strong>{" "}
                        {day.exercises.map((exercise) => `${exercise.name} ${formatTarget(exercise)}`).join(", ")}
                      </p>
                    ))}
                  </details>
                </div>
                <div className="custom-program-row-controls">
                  <button type="button" className="ghost" onClick={() => startEditing(draftOf(program))}>
                    {finished ? "Edit" : "Keep going"}
                  </button>
                  {finished && program.draft && (
                    <button type="button" className="ghost" onClick={() => handleDiscardDraft(program)}>
                      Discard changes
                    </button>
                  )}
                  <button type="button" className="ghost danger-button" onClick={() => handleDelete(program)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {programs.length > 0 && (
        <div className="custom-program-assign">
          <h4>Who&apos;s on what</h4>

          <label className="custom-program-assign-row">
            <span>Whole team</span>
            <ProgramSelect
              label="Program for the whole team"
              value={teamProgramId}
              programs={programs}
              fallbackLabel="Recommended plan"
              onChange={(programId) => assignProgram({ scope: "team" }, programId)}
            />
          </label>

          <h4>Groups</h4>
          <p className="muted">Group athletes (like Pins or Middles) to give them their own program.</p>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              roster={roster}
              programs={programs}
              programId={assignments.find((a) => a.scope === "group" && a.groupId === group.id)?.programId ?? null}
              onToggleMember={(userId, inGroup) => setGroupMember(group.id, userId, inGroup)}
              onAssign={(programId) => assignProgram({ scope: "group", groupId: group.id }, programId)}
              onDelete={() => {
                if (window.confirm(`Delete the ${group.name} group? Its athletes go back to the team program.`)) {
                  deleteGroup(group.id);
                }
              }}
            />
          ))}
          <form
            className="custom-program-new-group"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newGroupName.trim()) return;
              if (await createGroup(newGroupName)) setNewGroupName("");
            }}
          >
            <input
              aria-label="New group name"
              placeholder="New group, e.g. Pins"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
            />
            <button type="submit" className="ghost" disabled={!newGroupName.trim()}>
              Add group
            </button>
          </form>

          <h4>Athletes</h4>
          <p className="muted">Override for one athlete. Each line shows what they&apos;re on right now.</p>
          <ul className="custom-program-athletes">
            {roster.map((athlete) => {
              const ownId =
                assignments.find((a) => a.scope === "athlete" && a.userId === athlete.userId)?.programId ?? null;
              const effectiveId = pickAssignedProgramId(assignments, athlete.userId, groupIdsByAthlete(athlete.userId));
              return (
                <li key={athlete.userId} className="custom-program-assign-row">
                  <span>
                    {athlete.displayName}
                    <span className="muted">
                      {" "}
                      · on {effectiveId ? programName.get(effectiveId) ?? "a program" : "the recommended plan"}
                    </span>
                  </span>
                  <ProgramSelect
                    label={`Program for ${athlete.displayName}`}
                    value={ownId}
                    programs={programs}
                    fallbackLabel="Group or team program"
                    onChange={(programId) => assignProgram({ scope: "athlete", userId: athlete.userId }, programId)}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
