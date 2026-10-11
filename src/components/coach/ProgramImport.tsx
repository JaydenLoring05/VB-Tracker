import { useRef, useState } from "react";

import { ExerciseSuggestions, SectionEditor } from "@/components/coach/ProgramSectionEditor";
import {
  CustomProgram,
  dayExercises,
  ImportedPlan,
  ProgramDay,
  ProgramExercise,
  programFromImport,
  ProgramSection,
  WEEKDAYS,
  type Weekday
} from "@/lib/customProgram";
import { PLAN_FILE_TYPES, PlanFileError, readPastedPlan, readPlanFile, readSheetLink } from "@/lib/planFiles";
import { isSheetLink } from "@/lib/sheetLink";

const EXAMPLE = `Monday
Back squat 3x8
RDL - 4 x 8-10
Plank 3x30 sec

Wednesday
Bench press 3x8
Abs:
Dead bug 3x10`;

/**
 * Bring in a plan the coach already has: paste it (lines, or cells copied
 * from a sheet) or pick a file, check and fix the preview, then open it in
 * the builder. Files are read in the browser and never uploaded. Nothing is saved or added until
 * the coach presses "Use this plan", and even then it's an unsaved program.
 */
export function ProgramImport({
  remembered,
  onUse,
  onCancel
}: {
  /** The coach's own exercises, offered in the name boxes. */
  remembered: ProgramExercise[];
  onUse: (program: Omit<CustomProgram, "id">) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<ImportedPlan | null>(null);
  const [name, setName] = useState("My program");
  const [problem, setProblem] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  /** fallbackName: what to call the program when the plan has no title of its own. */
  function show(found: ImportedPlan, from: string, fallbackName?: string) {
    const empty = found.days.length === 0;
    setProblem(empty ? `No exercises found in ${from}. Put one exercise on each line, like "Back squat 3x8".` : null);
    setPlan(empty ? null : found);
    const suggested = found.title ?? fallbackName;
    if (!empty && suggested) setName(suggested.slice(0, 80));
  }

  /** Reads a file or a sheet link, which take a moment, showing the preview or what went wrong. */
  async function readAsync(read: () => Promise<ImportedPlan>, from: string, fallbackName?: string) {
    setReading(true);
    setProblem(null);
    try {
      show(await read(), from, fallbackName);
    } catch (error) {
      setProblem(
        error instanceof PlanFileError
          ? error.message
          : "Couldn't read that. Save it as .csv and upload it, or copy the cells and paste them here."
      );
    } finally {
      setReading(false);
      // Lets the same file be picked again after fixing it.
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function readText() {
    // A Google Sheets link on its own is read from the sheet; anything else is the plan itself.
    if (isSheetLink(text)) readAsync(() => readSheetLink(text), "that sheet");
    else show(readPastedPlan(text), "what you pasted");
  }

  if (!plan) {
    return (
      <div className="custom-program-import">
        <p className="muted">
          Paste your plan from a doc, a note or an email, or copy the cells from your spreadsheet. One exercise per
          line, like &quot;Back squat 3x8&quot;, with a day name on its own line to start that day. Or paste a Google
          Sheets link, or upload the file. You&apos;ll check everything before it&apos;s added.
        </p>
        <textarea
          aria-label="Your plan"
          placeholder={EXAMPLE}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        {problem && (
          <p className="program-guardrail-warning" role="alert">
            {problem}
          </p>
        )}
        <div className="custom-program-import-actions">
          <button
            type="button"
            onClick={readText}
            disabled={!text.trim() || reading}
          >
            Read my plan
          </button>
          <button type="button" className="ghost" onClick={() => fileInput.current?.click()} disabled={reading}>
            {reading ? "Reading…" : "Upload a file"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={PLAN_FILE_TYPES}
            aria-label="Plan file (.csv, .xlsx, .docx or .txt)"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              // A program named after its file is easier to find later.
              if (file) readAsync(() => readPlanFile(file), file.name, file.name.split(".").slice(0, -1).join("."));
            }}
          />
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Every-day sections count once: they're fixed once and copied on at the end.
  const parts = [...plan.days, { sections: plan.everyDay }];
  const exerciseCount = parts.reduce((count, day) => count + dayExercises(day).length, 0);
  const missingReps = parts.reduce(
    (count, day) => count + dayExercises(day).filter((e) => e.seconds == null && !e.reps?.trim()).length,
    0
  );
  const everyDayNotes = Object.entries(plan.notes["every day"] ?? {});

  function updateEveryDay(sections: ProgramSection[]) {
    setPlan((current) => current && { ...current, everyDay: sections });
  }

  function updateDay(index: number, next: ProgramDay) {
    setPlan((current) => current && { ...current, days: current.days.map((day, i) => (i === index ? next : day)) });
  }

  /** Moves a day to another weekday. If that weekday is taken, the two days swap. */
  function moveDay(index: number, weekday: Weekday) {
    setPlan((current) => {
      if (!current) return current;
      const from = current.days[index].day as Weekday;
      const days = current.days
        .map((day, i) => (i === index ? { ...day, day: weekday } : day.day === weekday ? { ...day, day: from } : day))
        .sort((a, b) => WEEKDAYS.indexOf(a.day as Weekday) - WEEKDAYS.indexOf(b.day as Weekday));
      const notes = { ...current.notes, [weekday]: current.notes[from], [from]: current.notes[weekday] };
      return { ...current, days, notes };
    });
  }

  function removeDay(index: number) {
    setPlan((current) => current && { ...current, days: current.days.filter((_, i) => i !== index) });
  }

  return (
    <div className="custom-program-import">
      <ExerciseSuggestions remembered={remembered} typing={typing} />

      <label className="custom-program-name">
        <span className="micro">Program name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>

      <p className="muted" role="status">
        Found {plan.days.length} day{plan.days.length === 1 ? "" : "s"} and {exerciseCount} exercise
        {exerciseCount === 1 ? "" : "s"}. Check them and fix anything that came in wrong.
        {missingReps > 0 &&
          ` ${missingReps} exercise${missingReps === 1 ? " has" : "s have"} no reps yet; ${
            missingReps === 1 ? "it's" : "they're"
          } marked. Fill ${missingReps === 1 ? "it" : "them"} here: an every-day one is filled once here, but on each day in the builder.`}
      </p>

      {plan.leftOut.length > 0 && (
        <div className="program-guardrail-warning">
          <p>Not brought in:</p>
          <ul>
            {plan.leftOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.everyDay.length > 0 && (
        <div className="panel custom-program-day">
          <h4>Every training day</h4>
          <p className="muted">Goes on each day below: warm-ups first, the rest (like abs) after.</p>
          {plan.everyDay.map((section, sectionIndex) => (
            <SectionEditor
              key={sectionIndex}
              section={section}
              dayName="every day"
              showName
              remembered={remembered}
              onTyping={setTyping}
              onChange={(next) => updateEveryDay(plan.everyDay.map((s, i) => (i === sectionIndex ? next : s)))}
              onRemove={() => updateEveryDay(plan.everyDay.filter((_, i) => i !== sectionIndex))}
            />
          ))}
          {everyDayNotes.length > 0 && (
            <div className="muted">
              <p className="micro">Notes, added to each day&apos;s notes</p>
              <ul>
                {everyDayNotes.map(([exercise, note]) => (
                  <li key={exercise}>
                    {exercise}: {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {plan.days.map((day, index) => {
        const notes = Object.entries(plan.notes[day.day as Weekday] ?? {});
        const showNames = day.sections.length > 1 || day.sections.some((section) => section.name.trim() !== "");
        // Athletes see the first unnamed list as "Main" (see programToWorkoutDays).
        const mainIndex = day.sections.findIndex((section) => section.name.trim() === "");
        return (
          <div key={day.day} className="panel custom-program-day">
            <div className="custom-program-import-day-header">
              <select
                aria-label={`Weekday for ${day.day}`}
                value={day.day}
                onChange={(event) => moveDay(index, event.target.value as Weekday)}
              >
                {WEEKDAYS.map((weekday) => (
                  <option key={weekday} value={weekday}>
                    {weekday}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${day.day} name`}
                placeholder="Day name"
                value={day.title}
                onChange={(event) => updateDay(index, { ...day, title: event.target.value })}
              />
              <button
                type="button"
                className="ghost danger-button"
                onClick={() => removeDay(index)}
                aria-label={`Leave out ${day.day}`}
              >
                Leave out
              </button>
            </div>

            {day.sections.map((section, sectionIndex) => (
              <SectionEditor
                key={sectionIndex}
                section={section}
                dayName={day.day}
                showName={showNames}
                namePlaceholder={sectionIndex === mainIndex ? "Main" : undefined}
                remembered={remembered}
                onTyping={setTyping}
                onChange={(next) =>
                  updateDay(index, { ...day, sections: day.sections.map((s, i) => (i === sectionIndex ? next : s)) })
                }
                onRemove={
                  day.sections.length > 1
                    ? () => updateDay(index, { ...day, sections: day.sections.filter((_, i) => i !== sectionIndex) })
                    : undefined
                }
              />
            ))}

            {notes.length > 0 && (
              <div className="muted">
                <p className="micro">Notes, added to the day&apos;s notes</p>
                <ul>
                  {notes.map(([exercise, note]) => (
                    <li key={exercise}>
                      {exercise}: {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}

      <div className="custom-program-import-actions">
        <button
          type="button"
          onClick={() => onUse(programFromImport({ ...plan, days: plan.days }, name))}
          disabled={plan.days.length === 0}
        >
          Use this plan
        </button>
        <button type="button" className="ghost" onClick={() => setPlan(null)}>
          Back
        </button>
      </div>
      <p className="muted">It opens in the builder. Nothing is saved until you save it there.</p>
    </div>
  );
}
