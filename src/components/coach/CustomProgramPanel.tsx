"use client";

import { ArrowDown, ArrowUp, MessageSquarePlus, Plus, Save, Trash2 } from "lucide-react";
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
  copyDay,
  CustomProgram,
  exerciseKey,
  formatTarget,
  hasStartingTargets,
  isProgramComplete,
  newProgramExercise,
  ownExercises,
  pickAssignedProgramId,
  ProgramDay,
  ProgramExercise,
  programFromRecommended,
  validateDraft,
  validateProgram
} from "@/lib/customProgram";
import { clearProgramDraft, loadProgramDraft, saveProgramDraft, StoredProgramDraft } from "@/lib/programDraftStorage";
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
  const [noteOpen, setNoteOpen] = useState(false);
  const showNote = noteOpen || Boolean(exercise.note);

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
        {!timed && (
          <label className="custom-program-percent">
            <span aria-hidden="true">@</span>
            <input
              inputMode="numeric"
              aria-label={`Percent of max for ${exercise.name || "exercise"}`}
              placeholder="—"
              value={exercise.percent ?? ""}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 3);
                onChange({ ...exercise, percent: digits === "" ? null : Number(digits) });
              }}
            />
            <span aria-hidden="true">% max</span>
          </label>
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
            onClick={() => onChange({ ...exercise, seconds: exercise.seconds ?? 30, reps: null, percent: null })}
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
      {showNote ? (
        <input
          className="custom-program-exercise-note"
          aria-label={`Note for ${exercise.name || "exercise"}`}
          placeholder="Note for athletes, e.g. land on the balls of your feet"
          autoFocus={noteOpen && !exercise.note}
          value={exercise.note ?? ""}
          onChange={(event) => onChange({ ...exercise, note: event.target.value })}
          onBlur={() => {
            if (!exercise.note?.trim()) {
              setNoteOpen(false);
              if (exercise.note != null) onChange({ ...exercise, note: undefined });
            }
          }}
        />
      ) : (
        <button type="button" className="ghost custom-program-add-note" onClick={() => setNoteOpen(true)}>
          <MessageSquarePlus size={14} /> Add note
        </button>
      )}
    </li>
  );
}

const EVERY_OTHER_TRAINING_DAY = "__every_other_training_day__";

function DayEditor({
  day,
  open,
  otherDays,
  remembered,
  onOpen,
  onCopy,
  saving,
  status,
  onSaveDay,
  onTyping,
  onChange
}: {
  day: ProgramDay;
  /** Only the day being edited is open, so the week isn't one long scroll on a phone. */
  open: boolean;
  otherDays: ProgramDay[];
  remembered: ProgramExercise[];
  onOpen: () => void;
  onCopy: (to: string[]) => void;
  saving: boolean;
  /** "Monday saved at 4:52 PM", shown under this day's save button. */
  status: string | null;
  onSaveDay: () => void;
  onTyping: (name: string | null) => void;
  onChange: (next: ProgramDay) => void;
}) {
  function handleCopy(choice: string) {
    const to =
      choice === EVERY_OTHER_TRAINING_DAY ? otherDays.filter((other) => !other.rest).map((other) => other.day) : [choice];
    if (to.length === 0) return;
    const overwritten = otherDays.filter((other) => to.includes(other.day) && other.exercises.length > 0);
    if (
      overwritten.length > 0 &&
      !window.confirm(`Replace what's on ${overwritten.map((other) => other.day).join(", ")} with ${day.day}?`)
    ) {
      return;
    }
    onCopy(to);
  }

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
    <div className={`panel custom-program-day${day.rest ? " is-rest" : ""}${open ? " is-open" : ""}`}>
      <div className="custom-program-day-header">
        <h4>{day.day}</h4>
        <label className="custom-program-rest-toggle">
          <input
            type="checkbox"
            checked={!day.rest}
            onChange={(event) => {
              onChange({
                ...day,
                rest: !event.target.checked,
                title: !event.target.checked ? "Rest" : day.title === "Rest" ? "Training" : day.title
              });
              if (event.target.checked) onOpen();
            }}
          />
          Training day
        </label>
      </div>

      {!day.rest && !open && (
        <button type="button" className="ghost custom-program-day-summary" onClick={onOpen}>
          <span>
            {day.title || "Training"} · {day.exercises.length} exercise{day.exercises.length === 1 ? "" : "s"}
          </span>
          <span className="micro">Edit</span>
        </button>
      )}

      {!day.rest && open && (
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

          {day.exercises.length > 0 && (
            <select
              className="custom-program-copy"
              aria-label={`Copy ${day.day} to another day`}
              value=""
              onChange={(event) => handleCopy(event.target.value)}
            >
              <option value="">Copy {day.day} to...</option>
              {otherDays.some((other) => !other.rest) && (
                <option value={EVERY_OTHER_TRAINING_DAY}>Every other training day</option>
              )}
              {otherDays.map((other) => (
                <option key={other.day} value={other.day}>
                  {other.day}
                  {other.rest ? " (rest now)" : other.exercises.length > 0 ? " (replaces it)" : ""}
                </option>
              ))}
            </select>
          )}
          <div className="custom-program-day-save">
            <button type="button" onClick={onSaveDay} disabled={saving}>
              <Save size={14} /> {saving ? "Saving…" : `Save ${day.day}`}
            </button>
            {status && (
              <span className="muted" role="status">
                {status}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProgramEditorForm({
  initial,
  restored,
  teamId,
  assigned,
  savedPrograms,
  saving,
  onSave,
  onSaveDay,
  onCancel
}: {
  initial: Draft;
  /** True when the draft came back from this browser and has unsaved changes. */
  restored: boolean;
  teamId: string;
  /** Athletes are on this program, so every save has to leave it complete. */
  assigned: boolean;
  /** Every program this team already has, newest first. */
  savedPrograms: CustomProgram[];
  saving: boolean;
  /** Saves and closes. */
  onSave: (draft: Draft) => void;
  /** Saves and stays open. Returns the program's id, or null when it failed. */
  onSaveDay: (draft: Draft) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [shownProblems, setShownProblems] = useState<string[]>([]);
  const problems = validateProgram(draft);
  // The one day being edited. Starts on the first training day.
  const [openDay, setOpenDay] = useState<string | null>(() => initial.days.find((day) => !day.rest)?.day ?? null);
  // What the database has, so only real changes are kept in the browser.
  const [savedJson, setSavedJson] = useState<string | null>(() => (restored ? null : JSON.stringify(initial)));
  const dirty = JSON.stringify(draft) !== savedJson;
  const [dayStatus, setDayStatus] = useState<{ day: string; text: string } | null>(null);

  // Keep every unsaved change on this device, so a closed tab doesn't lose a day.
  useEffect(() => {
    if (dirty) saveProgramDraft(teamId, draft);
  }, [dirty, draft, teamId]);
  // Text of the exercise name box being typed in, so its own half-typed text isn't offered back.
  const [typing, setTyping] = useState<string | null>(null);
  // The coach's own exercises, from this draft first and then saved programs, so one
  // typed on Monday is offered on Tuesday before anything is saved.
  const remembered = useMemo(
    () => ownExercises([draft, ...savedPrograms], exerciseCatalog.map((exercise) => exercise.name)),
    [draft, savedPrograms]
  );

  function updateDay(next: ProgramDay) {
    setDraft((current) => ({ ...current, days: current.days.map((day) => (day.day === next.day ? next : day)) }));
  }

  function handleSave() {
    if (problems.length > 0) {
      setShownProblems(problems);
      return;
    }
    onSave(draft);
  }

  async function handleSaveDay(dayName: string) {
    // Days not filled in yet don't block this save, unless athletes are already on the program.
    const blocking = assigned ? problems : validateDraft(draft);
    if (blocking.length > 0) {
      setShownProblems(blocking);
      setDayStatus(null);
      return;
    }
    setShownProblems([]);
    const id = await onSaveDay(draft);
    if (!id) return;
    const saved = { ...draft, id };
    setDraft(saved);
    setSavedJson(JSON.stringify(saved));
    clearProgramDraft(teamId);
    const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setDayStatus({ day: dayName, text: `${dayName} saved at ${time}` });
  }

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

      {dirty && draft.id == null && (
        <p className="micro">Not saved yet. Your changes are kept on this device until you save.</p>
      )}

      <p className="muted">
        Save each day as you finish it. This week repeats every week. Pick training days, name them, and set each
        exercise as sets × reps or sets × seconds. Type any exercise, or pick one from the library, and add a note
        under any exercise for your athletes. Fill in &ldquo;% max&rdquo; to give each athlete their own weight, worked out from
        their best logged set. Exercises you add yourself show up in the suggestions next time, and
        picking one brings back its sets, reps and note.
      </p>

      {draft.days.map((day) => (
        <DayEditor
          key={day.day}
          day={day}
          open={openDay === day.day}
          otherDays={draft.days.filter((other) => other.day !== day.day)}
          remembered={remembered}
          onOpen={() => setOpenDay(day.day)}
          onCopy={(to) => setDraft((current) => ({ ...current, days: copyDay(current.days, day.day, to) }))}
          saving={saving}
          status={dayStatus?.day === day.day && !dirty ? dayStatus.text : null}
          onSaveDay={() => handleSaveDay(day.day)}
          onTyping={setTyping}
          onChange={updateDay}
        />
      ))}

      {shownProblems.length > 0 && (
        <ul className="program-guardrail-warning" role="alert">
          {shownProblems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="program-full-editor-actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save program"}
        </button>
        <button type="button" className="ghost" onClick={onCancel} disabled={saving}>
          {dirty ? "Cancel" : "Close"}
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
      {programs.map((program) => {
        const unfinished = !isProgramComplete(program);
        return (
          <option key={program.id} value={program.id} disabled={unfinished && program.id !== value}>
            {program.name}
            {unfinished ? " (unfinished)" : ""}
          </option>
        );
      })}
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
    deleteProgram,
    createGroup,
    deleteGroup,
    setGroupMember,
    assignProgram
  } = useCustomPrograms(team);

  const [editing, setEditing] = useState<Draft | null>(null);
  const [restored, setRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  // A program left half-built in this browser, offered back when the coach returns.
  const [storedDraft, setStoredDraft] = useState<StoredProgramDraft | null>(() => loadProgramDraft(team.id));
  const [newGroupName, setNewGroupName] = useState("");

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

  function startEditing(draft: Draft, fromDevice = false) {
    setRestored(fromDevice);
    setEditing(draft);
  }

  function stopEditing() {
    setEditing(null);
    setStoredDraft(loadProgramDraft(team.id));
  }

  async function handleSave(draft: Draft) {
    setSaving(true);
    const id = await saveProgram(draft);
    setSaving(false);
    if (id) {
      clearProgramDraft(team.id);
      stopEditing();
    }
  }

  async function handleSaveDay(draft: Draft) {
    setSaving(true);
    const id = await saveProgram(draft);
    setSaving(false);
    return id;
  }

  async function handleDelete(program: CustomProgram) {
    if (!window.confirm(`Delete "${program.name}"? Anyone on it goes back to the next program up, or the recommended plan.`)) {
      return;
    }
    await deleteProgram(program.id);
  }

  if (editing) {
    const newestFirst = [...programs].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    return (
      <section className="panel custom-program-panel">
        <h3>{editing.id ? `Edit ${editing.name}` : "New program"}</h3>
        <ProgramEditorForm
          initial={editing}
          restored={restored}
          teamId={team.id}
          assigned={editing.id != null && assignments.some((a) => a.programId === editing.id)}
          savedPrograms={newestFirst}
          saving={saving}
          onSave={handleSave}
          onSaveDay={handleSaveDay}
          onCancel={stopEditing}
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

      {storedDraft && (
        <div className="custom-program-resume" role="status">
          <p>
            You have unsaved changes to <strong>{storedDraft.draft.name || "a program"}</strong>
            {storedDraft.changedAt
              ? ` from ${new Date(storedDraft.changedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit"
                })}`
              : ""}
            .
          </p>
          <div className="custom-program-row-controls">
            <button type="button" onClick={() => startEditing(storedDraft.draft, true)}>
              Pick up where you left off
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                if (window.confirm("Throw away these unsaved changes?")) {
                  clearProgramDraft(team.id);
                  setStoredDraft(null);
                }
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
            const trainingDays = program.days.filter((day) => !day.rest);
            return (
              <li key={program.id}>
                <div>
                  <strong>{program.name}</strong>
                  {!isProgramComplete(program) && (
                    <span className="micro custom-program-unfinished"> Unfinished: fill every training day to assign it</span>
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
                        {day.exercises
                          .map((exercise) => `${exercise.name} ${formatTarget(exercise)}${exercise.note ? ` (${exercise.note})` : ""}`)
                          .join(", ")}
                      </p>
                    ))}
                  </details>
                </div>
                <div className="custom-program-row-controls">
                  <button type="button" className="ghost" onClick={() => startEditing(program)}>
                    Edit
                  </button>
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
