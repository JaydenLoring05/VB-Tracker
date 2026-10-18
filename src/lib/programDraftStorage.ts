import { CustomProgram, parseProgramDays } from "@/lib/customProgram";

/**
 * The program a coach is building, kept in this browser on every change
 * (F-16), so closing the tab or losing signal doesn't cost unsaved days.
 * One draft per team. Cleared once everything in it is saved.
 */

export type StoredProgramDraft = {
  draft: Omit<CustomProgram, "id"> & { id?: string };
  /** When the draft was last changed, ISO. */
  changedAt: string;
};

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

export function programDraftKey(teamId: string): string {
  return `nextrep:program-draft:${teamId}`;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadProgramDraft(teamId: string, storage: Storage | null = browserStorage()): StoredProgramDraft | null {
  try {
    const raw = storage?.getItem(programDraftKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { draft?: Record<string, unknown>; changedAt?: unknown };
    const draft = parsed.draft;
    if (!draft || typeof draft !== "object") return null;
    const days = parseProgramDays(draft.days);
    if (days.length === 0) return null;
    return {
      draft: {
        ...(typeof draft.id === "string" && draft.id ? { id: draft.id } : {}),
        name: String(draft.name ?? ""),
        days
      },
      changedAt: typeof parsed.changedAt === "string" ? parsed.changedAt : ""
    };
  } catch {
    return null;
  }
}

export function saveProgramDraft(
  teamId: string,
  draft: StoredProgramDraft["draft"],
  storage: Storage | null = browserStorage(),
  now: Date = new Date()
): void {
  try {
    const value: StoredProgramDraft = { draft, changedAt: now.toISOString() };
    storage?.setItem(programDraftKey(teamId), JSON.stringify(value));
  } catch {
    // Storage full or blocked: the draft just isn't kept on this device.
  }
}

export function clearProgramDraft(teamId: string, storage: Storage | null = browserStorage()): void {
  try {
    storage?.removeItem(programDraftKey(teamId));
  } catch {
    // Nothing to do.
  }
}
