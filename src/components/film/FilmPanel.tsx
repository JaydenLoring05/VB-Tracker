"use client";

import { ExternalLink, Keyboard, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NewFilmTag } from "@/hooks/useTeamFilm";
import { useVoiceTagging } from "@/hooks/useVoiceTagging";
import { formatTimestamp, parseYouTubeId } from "@/lib/film";
import { handleHotkey, isTypingTarget, pendingHint, TagDraft } from "@/lib/filmHotkeys";
import { parseVoiceCommand } from "@/lib/filmVoice";
import { FilmTag, FilmTagType, TeamFilm } from "@/types";

import { AddTagControls } from "./AddTagControls";
import { FilmToast, FilmToastMessage } from "./FilmToast";
import { HotkeyOverlay } from "./HotkeyOverlay";
import { FilmAthlete, TagDetailPanel } from "./TagDetailPanel";
import { TagFilterChips } from "./TagFilterChips";
import { TagList } from "./TagList";
import { describeTag, detailsForTag, TagDetailFields } from "./tagMeta";
import { YouTubePlayer, YouTubePlayerHandle } from "./YouTubePlayer";

const UNASSIGNED = "__unassigned__";

export function FilmPanel({
  film,
  tags,
  isCoach,
  athletes,
  athleteName,
  onAddTag,
  onDeleteTag,
  onUndoTag
}: {
  film: TeamFilm;
  tags: FilmTag[];
  isCoach: boolean;
  /** Coach: the team roster in roster order. Athlete: just themselves. */
  athletes: FilmAthlete[];
  athleteName: (athleteId: string | null) => string | null;
  onAddTag: (input: NewFilmTag) => Promise<FilmTag | null>;
  /** Asks for confirmation first. */
  onDeleteTag: (tag: FilmTag) => void;
  /** Removes immediately, for Undo. */
  onUndoTag: (id: string) => void;
}) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilmTagType | null>(null);
  const [athleteFilter, setAthleteFilter] = useState<string>("");

  const [draft, setDraft] = useState<TagDraft | null>(null);
  const [note, setNote] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<FilmToastMessage | null>(null);

  // Tags saved in this session, newest last, for Ctrl+Z.
  const undoStackRef = useRef<string[]>([]);

  const youTubeId = useMemo(() => parseYouTubeId(film.video_url), [film.video_url]);

  // Refs mirror state so the window key listener always sees current values.
  const stateRef = useRef({ draft, note, selectedAthleteId, showHelp, athletes });
  useEffect(() => {
    stateRef.current = { draft, note, selectedAthleteId, showHelp, athletes };
  });

  // Switching films drops any half-made tag and the undo history.
  useEffect(() => {
    setDraft(null);
    setNote("");
    undoStackRef.current = [];
  }, [film.id]);

  const getCurrentTime = useCallback(() => playerRef.current?.getCurrentTime() ?? 0, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((text: string, tone: FilmToastMessage["tone"], onUndo?: () => void) => {
    setToast({ id: Date.now(), text, tone, onUndo });
  }, []);

  const undoTag = useCallback(
    (id: string) => {
      undoStackRef.current = undoStackRef.current.filter((tagId) => tagId !== id);
      onUndoTag(id);
    },
    [onUndoTag]
  );

  const saveTag = useCallback(
    async (input: {
      tag: FilmTagType;
      seconds: number;
      details: Partial<TagDetailFields>;
      athleteId: string | null;
      note?: string;
    }) => {
      const saved = await onAddTag({ filmId: film.id, ...input });
      if (!saved) {
        showToast("Couldn't save that tag. Try again.", "error");
        return;
      }
      undoStackRef.current.push(saved.id);
      const label = describeTag(
        { tag: input.tag, ...detailsForTag(input.tag, input.details) },
        athleteName(input.athleteId)
      );
      showToast(`${label} @ ${formatTimestamp(input.seconds)}`, "saved", () => undoTag(saved.id));
    },
    [film.id, onAddTag, athleteName, showToast, undoTag]
  );

  const commitDraft = useCallback(
    (toSave: TagDraft) => {
      const { note: currentNote, selectedAthleteId: athleteId } = stateRef.current;
      setDraft(null);
      setNote("");
      saveTag({
        tag: toSave.tag,
        seconds: toSave.seconds,
        details: toSave.details,
        athleteId,
        note: currentNote.trim() || undefined
      });
    },
    [saveTag]
  );

  const cancelDraft = useCallback(() => {
    setDraft(null);
    setNote("");
  }, []);

  const cycleAthlete = useCallback((delta: number) => {
    const { athletes: list, selectedAthleteId: current } = stateRef.current;
    if (list.length === 0) return;
    const index = list.findIndex((athlete) => athlete.userId === current);
    const next = index === -1 ? (delta > 0 ? 0 : list.length - 1) : (index + delta + list.length) % list.length;
    setSelectedAthleteId(list[next].userId);
  }, []);

  // Keyboard tagging (coach only).
  useEffect(() => {
    if (!isCoach) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target as HTMLElement | null)) return;
      // Leave confirm dialogs alone; the shortcut overlay only listens for Esc and "?".
      const inDialog = (event.target as HTMLElement | null)?.closest?.('[role="dialog"]');
      if (inDialog && !stateRef.current.showHelp) return;
      if (stateRef.current.showHelp && (event.key === "Escape" || event.key === "?")) {
        event.preventDefault();
        setShowHelp(false);
        return;
      }
      if (event.repeat && event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const next = handleHotkey(stateRef.current.draft, event, getCurrentTime());
      if (!next.handled) return;
      event.preventDefault();

      for (const action of next.actions) {
        switch (action.type) {
          case "save":
            commitDraft(action.draft);
            break;
          case "cancel":
            setNote("");
            break;
          case "focus_note":
            requestAnimationFrame(() => noteRef.current?.focus());
            break;
          case "play_toggle":
            playerRef.current?.togglePlay();
            break;
          case "seek":
            playerRef.current?.seekBy(action.delta);
            break;
          case "undo": {
            const last = undoStackRef.current.at(-1);
            if (last) {
              undoTag(last);
              showToast("Removed the last tag.", "saved");
            }
            break;
          }
          case "athlete_cycle":
            cycleAthlete(action.delta);
            break;
          case "athlete_pick": {
            const athlete = stateRef.current.athletes[action.index];
            if (athlete) setSelectedAthleteId(athlete.userId);
            break;
          }
          case "toggle_help":
            setShowHelp((open) => !open);
            break;
        }
      }
      setDraft(next.draft);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCoach, getCurrentTime, commitDraft, cycleAthlete, undoTag, showToast]);

  // Clicking the YouTube iframe moves keyboard focus into it (a separate
  // document), which would swallow every hotkey. When the window blurs
  // because the iframe took focus, hand focus straight back to the page.
  // The click itself has already reached the player.
  useEffect(() => {
    if (!isCoach || !youTubeId) return;

    function handleBlur() {
      setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLIFrameElement && active.closest(".film-player-shell")) {
          active.blur();
          window.focus();
        }
      }, 0);
    }

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isCoach, youTubeId]);

  const voice = useVoiceTagging({
    enabled: isCoach && Boolean(youTubeId),
    getCurrentTime,
    onError: (message) => showToast(message, "error"),
    onTranscript: (transcript, seconds) => {
      const parsed = parseVoiceCommand(transcript, stateRef.current.athletes);
      if (!parsed.ok) {
        showToast(`Didn't catch a tag in "${parsed.heard || "…"}". Nothing saved.`, "error");
        return;
      }
      saveTag({
        tag: parsed.tag,
        seconds: Math.max(0, Math.floor(seconds)),
        details: parsed.details,
        athleteId: parsed.athleteId ?? stateRef.current.selectedAthleteId,
        note: parsed.note ?? undefined
      });
    }
  });

  function handleSeek(seconds: number) {
    playerRef.current?.seekTo(seconds);
  }

  function startDraft({ seconds, tag }: { seconds: number; tag: FilmTagType }) {
    // Clicking another tag button while one is pending saves the pending one, like the hotkeys do.
    if (draft) commitDraft(draft);
    setDraft({ tag, seconds, details: {} });
    if (tag === "note") requestAnimationFrame(() => noteRef.current?.focus());
  }

  const hasUnassigned = tags.some((tag) => !tag.athlete_id);
  const visibleTags = tags.filter((tag) => {
    if (activeFilter && tag.tag !== activeFilter) return false;
    if (athleteFilter === UNASSIGNED) return !tag.athlete_id;
    if (athleteFilter) return tag.athlete_id === athleteFilter;
    return true;
  });

  const hint = pendingHint(draft);

  return (
    <div className="film-panel">
      <div className="film-panel-head">
        <h3>{film.title}</h3>
        {isCoach && (
          <div className="film-panel-tools">
            {voice.supported && (
              <button
                type="button"
                className={voice.listening ? "ghost film-mic active" : "ghost film-mic"}
                aria-pressed={voice.listening}
                onClick={voice.toggle}
                title="Voice tagging (or hold ` to talk)"
              >
                {voice.listening ? <Mic size={16} /> : <MicOff size={16} />}
                {voice.listening ? (voice.mode === "ptt" ? "Talking…" : "Listening") : "Voice"}
              </button>
            )}
            <button
              type="button"
              className="ghost"
              onClick={() => setShowHelp(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={16} /> ?
            </button>
          </div>
        )}
      </div>

      {youTubeId ? (
        <div className="film-player-shell">
          <YouTubePlayer ref={playerRef} videoId={youTubeId} />
        </div>
      ) : (
        <a className="film-external-link" href={film.video_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> Open video
        </a>
      )}

      {isCoach && voice.listening && voice.interim && (
        <p className="muted film-voice-interim" aria-live="polite">
          Hearing: “{voice.interim}”
        </p>
      )}

      {isCoach && (
        <>
          <AddTagControls isYouTube={Boolean(youTubeId)} getCurrentTime={getCurrentTime} onStartTag={startDraft} />

          {draft ? (
            <TagDetailPanel
              draft={draft}
              athletes={athletes}
              selectedAthleteId={selectedAthleteId}
              note={note}
              hint={hint}
              noteRef={noteRef}
              onAthleteChange={setSelectedAthleteId}
              onDetailsChange={(changes) =>
                setDraft((current) => (current ? { ...current, details: { ...current.details, ...changes } } : current))
              }
              onNoteChange={setNote}
              onSave={() => commitDraft(draft)}
              onCancel={cancelDraft}
            />
          ) : (
            athletes.length > 0 && (
              <p className="muted film-athlete-current">
                Tagging for{" "}
                <strong>{athletes.find((athlete) => athlete.userId === selectedAthleteId)?.displayName ?? "no athlete"}</strong>
                {youTubeId && " · [ ] to switch, ? for shortcuts"}
              </p>
            )
          )}
        </>
      )}

      <div className="film-filter-bar">
        <TagFilterChips tags={tags} activeFilter={activeFilter} onChange={setActiveFilter} />
        {athletes.length > 0 && (
          <label className="film-athlete-filter">
            <span className="sr-only">Filter by athlete</span>
            <select value={athleteFilter} onChange={(event) => setAthleteFilter(event.target.value)}>
              <option value="">All athletes</option>
              {athletes.map((athlete) => (
                <option key={athlete.userId} value={athlete.userId}>
                  {athlete.displayName}
                </option>
              ))}
              {hasUnassigned && <option value={UNASSIGNED}>No athlete</option>}
            </select>
          </label>
        )}
      </div>

      <TagList
        tags={visibleTags}
        isCoach={isCoach}
        athleteName={athleteName}
        onSeek={handleSeek}
        onDelete={onDeleteTag}
      />

      {showHelp && <HotkeyOverlay onClose={() => setShowHelp(false)} />}
      {toast && <FilmToast toast={toast} onDismiss={dismissToast} />}
    </div>
  );
}
