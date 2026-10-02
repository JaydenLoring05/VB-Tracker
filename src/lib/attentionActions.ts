import { AttentionItem } from "@/lib/attentionCenter";

/**
 * What the coach can do with an Attention Center item, and which items they've
 * cleared. Clearing is per device (localStorage): it's a to-do list for the
 * coach, not a record anyone else needs to see.
 */

/** A cleared item comes back after this long if the problem is still there. */
export const DISMISS_DAYS = 3;
/** Entries older than this are dropped when the list is saved. */
const PRUNE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Item id plus the date of the signal behind it: a new signal (another PR, a new check-in) shows the item again. */
export function dismissalKey(item: Pick<AttentionItem, "id" | "signalDate">): string {
  return `${item.id}@${item.signalDate}`;
}

export function attentionDismissStorageKey(teamId: string): string {
  return `nextrep-attention-cleared-${teamId}`;
}

/** key -> ISO time it was cleared */
export type Dismissals = Record<string, string>;

export function parseDismissals(raw: string | null): Dismissals {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && !Number.isNaN(Date.parse(entry[1]))
      )
    );
  } catch {
    return {};
  }
}

export function isDismissed(item: AttentionItem, dismissals: Dismissals, now: Date = new Date()): boolean {
  const at = dismissals[dismissalKey(item)];
  if (!at) return false;
  return now.getTime() - Date.parse(at) < DISMISS_DAYS * DAY_MS;
}

export function visibleItems(items: AttentionItem[], dismissals: Dismissals, now: Date = new Date()): AttentionItem[] {
  return items.filter((item) => !isDismissed(item, dismissals, now));
}

export function addDismissal(dismissals: Dismissals, item: AttentionItem, now: Date = new Date()): Dismissals {
  const cutoff = now.getTime() - PRUNE_DAYS * DAY_MS;
  const kept = Object.fromEntries(Object.entries(dismissals).filter(([, at]) => Date.parse(at) >= cutoff));
  return { ...kept, [dismissalKey(item)]: now.toISOString() };
}

export function removeDismissal(dismissals: Dismissals, item: AttentionItem): Dismissals {
  const next = { ...dismissals };
  delete next[dismissalKey(item)];
  return next;
}

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "there";
}

/**
 * A ready-to-send message for items the coach acts on by messaging the
 * athlete. NextRep has no in-app chat, so the coach shares this to a text or
 * the team chat. Null for items that are handled by opening the athlete.
 */
export function attentionMessage(item: AttentionItem): string | null {
  const name = firstName(item.displayName);

  if (item.id.endsWith("-missed-workouts")) {
    return `Hey ${name}, checking in: you've missed some workouts this week. Can you get today's done in NextRep? Let me know if something's getting in the way.`;
  }

  if (item.id.endsWith("-new-pr")) {
    const exercise = item.reason.replace(/^New PR:\s*/, "").trim();
    return exercise
      ? `${name}, congrats on your new PR in ${exercise}! That's real work paying off. Keep it up.`
      : `${name}, congrats on your new PR! That's real work paying off. Keep it up.`;
  }

  return null;
}
