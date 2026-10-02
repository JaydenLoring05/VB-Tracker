// Optional personal mirror of finished workouts and stats check-ins into a
// Notion "Training Log" database. Server-only: the token never reaches the
// browser. Everything here is pure except syncTrainingLog, which takes its
// fetch as a parameter so tests never hit the real Notion API.

export const NOTION_API = "https://api.notion.com/v1";
export const NOTION_VERSION = "2025-09-03";
export const LOOKBACK_DAYS = 14;
export const SOURCE_PREFIX = "nextrep-";

// Notion caps a single rich_text/title text object at 2000 characters.
const MAX_TEXT = 2000;

export type NotionSyncConfig = {
  token: string;
  dataSourceId: string;
  userId: string;
};

export function readNotionSyncConfig(
  env: Record<string, string | undefined> = process.env
): NotionSyncConfig | null {
  const token = env.NOTION_TOKEN?.trim();
  const dataSourceId = env.NOTION_TRAINING_LOG_DATA_SOURCE_ID?.trim();
  const userId = env.NOTION_SYNC_USER_ID?.trim();
  if (!token || !dataSourceId || !userId) return null;
  return { token, dataSourceId, userId };
}

export type SyncSet = {
  exercise: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  seconds?: number | null;
};

export type SyncSession = {
  id: string;
  week: number;
  day: string;
  ended_at: string;
  duration_seconds: number | null;
  rpe: number | null;
  workout_sets: SyncSet[] | null;
};

export type SyncCheckIn = {
  id: string;
  created_at: string;
  vertical: number | null;
  approach: number | null;
  sleep: number | null;
  knee_pain: number | null;
};

// The subset of Training Log columns this sync owns. Anything else on a row
// (Rehab Done, manual notes in other columns) is left alone.
export type TrainingLogRow = {
  sourceId: string;
  session: string;
  date: string;
  type: "Weights" | "Check-in";
  minutes?: number | null;
  rpe?: number | null;
  notes?: string;
  vertical?: number | null;
  approach?: number | null;
  sleep?: number | null;
  kneeFeel?: "Good" | "Okay" | "Sore" | null;
};

export const workoutSourceId = (id: string) => `${SOURCE_PREFIX}workout-${id}`;
export const checkInSourceId = (id: string) => `${SOURCE_PREFIX}checkin-${id}`;

const finite = (value: number | null | undefined): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

// Knee pain is logged 0-10 where higher is worse.
export function kneeFeel(pain: number | null | undefined): TrainingLogRow["kneeFeel"] {
  const value = finite(pain);
  if (value == null) return null;
  if (value <= 2) return "Good";
  if (value <= 5) return "Okay";
  return "Sore";
}

function formatSet(set: SyncSet): string {
  const weight = finite(set.weight);
  const reps = finite(set.reps);
  const seconds = finite(set.seconds);
  if (seconds != null) return weight != null ? `${weight}x${seconds}s` : `${seconds}s`;
  if (weight != null && reps != null) return `${weight}x${reps}`;
  if (reps != null) return `${reps} reps`;
  if (weight != null) return `${weight}`;
  return "-";
}

// "Back Squat: 135x5, 135x5, 145x5" per exercise, in the order exercises were
// first logged.
export function summarizeSets(sets: SyncSet[]): string {
  const byExercise = new Map<string, SyncSet[]>();
  for (const set of [...sets].sort((a, b) => a.set_number - b.set_number)) {
    const list = byExercise.get(set.exercise) ?? [];
    list.push(set);
    byExercise.set(set.exercise, list);
  }
  return [...byExercise]
    .map(([exercise, list]) => `${exercise}: ${list.map(formatSet).join(", ")}`)
    .join("\n");
}

export function workoutRow(session: SyncSession): TrainingLogRow {
  const sets = session.workout_sets ?? [];
  const seconds = finite(session.duration_seconds);
  return {
    sourceId: workoutSourceId(session.id),
    session: `NextRep: Week ${session.week} ${session.day}`,
    date: session.ended_at,
    type: "Weights",
    minutes: seconds == null ? null : Math.round(seconds / 60),
    rpe: finite(session.rpe),
    notes: `${sets.length} set${sets.length === 1 ? "" : "s"}${sets.length ? `\n${summarizeSets(sets)}` : ""}`
  };
}

export function checkInRow(checkIn: SyncCheckIn): TrainingLogRow {
  return {
    sourceId: checkInSourceId(checkIn.id),
    session: "NextRep: Stats check-in",
    date: checkIn.created_at,
    type: "Check-in",
    vertical: finite(checkIn.vertical),
    approach: finite(checkIn.approach),
    sleep: finite(checkIn.sleep),
    kneeFeel: kneeFeel(checkIn.knee_pain)
  };
}

const text = (value: string) => [{ type: "text", text: { content: value.slice(0, MAX_TEXT) } }];

export function toNotionProperties(row: TrainingLogRow): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    Session: { title: text(row.session) },
    Date: { date: { start: row.date } },
    Type: { select: { name: row.type } },
    "Source ID": { rich_text: text(row.sourceId) }
  };
  if (row.minutes !== undefined) properties.Minutes = { number: row.minutes };
  if (row.rpe !== undefined) properties.RPE = { number: row.rpe };
  if (row.notes !== undefined) properties["Lifts / Notes"] = { rich_text: text(row.notes) };
  if (row.vertical !== undefined) properties["Vertical (in)"] = { number: row.vertical };
  if (row.approach !== undefined) properties["Approach Touch (in)"] = { number: row.approach };
  if (row.sleep !== undefined) properties["Sleep (hrs)"] = { number: row.sleep };
  if (row.kneeFeel !== undefined) {
    properties["Knee Feel"] = { select: row.kneeFeel ? { name: row.kneeFeel } : null };
  }
  return properties;
}

export type NotionPage = { id: string; properties: Record<string, NotionProperty> };
export type NotionProperty = {
  type?: string;
  title?: { plain_text?: string }[];
  rich_text?: { plain_text?: string }[];
  number?: number | null;
  select?: { name?: string } | null;
  date?: { start?: string } | null;
};

const plain = (parts: { plain_text?: string }[] | undefined) =>
  (parts ?? []).map((part) => part.plain_text ?? "").join("");

// Notion echoes datetimes back in its own format (e.g. "+00:00" instead of
// "Z"), so compare instants rather than strings.
const sameInstant = (a: string | undefined, b: string) => {
  if (!a) return false;
  const left = Date.parse(a);
  const right = Date.parse(b);
  return Number.isNaN(left) || Number.isNaN(right) ? a === b : left === right;
};

// True when the Notion page already holds every value this sync would write,
// so unchanged rows cost no API call.
export function pageMatchesRow(page: NotionPage, row: TrainingLogRow): boolean {
  const props = page.properties ?? {};
  const num = (name: string) => props[name]?.number ?? null;
  const checks: boolean[] = [
    plain(props.Session?.title) === row.session.slice(0, MAX_TEXT),
    sameInstant(props.Date?.date?.start, row.date),
    props.Type?.select?.name === row.type
  ];
  if (row.minutes !== undefined) checks.push(num("Minutes") === row.minutes);
  if (row.rpe !== undefined) checks.push(num("RPE") === row.rpe);
  if (row.notes !== undefined) {
    checks.push(plain(props["Lifts / Notes"]?.rich_text) === row.notes.slice(0, MAX_TEXT));
  }
  if (row.vertical !== undefined) checks.push(num("Vertical (in)") === row.vertical);
  if (row.approach !== undefined) checks.push(num("Approach Touch (in)") === row.approach);
  if (row.sleep !== undefined) checks.push(num("Sleep (hrs)") === row.sleep);
  if (row.kneeFeel !== undefined) {
    checks.push((props["Knee Feel"]?.select?.name ?? null) === row.kneeFeel);
  }
  return checks.every(Boolean);
}

export class NotionSyncError extends Error {
  constructor(readonly status: number, readonly step: string) {
    super(`Notion ${step} failed with ${status}`);
  }
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type SyncResult = { created: number; updated: number; unchanged: number };

export async function syncTrainingLog({
  config,
  sessions,
  checkIns,
  since,
  fetchImpl = fetch
}: {
  config: NotionSyncConfig;
  sessions: SyncSession[];
  checkIns: SyncCheckIn[];
  since: Date;
  fetchImpl?: FetchLike;
}): Promise<SyncResult> {
  const headers = {
    Authorization: `Bearer ${config.token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json"
  };

  async function call(step: string, url: string, method: string, body: unknown) {
    const response = await fetchImpl(url, { method, headers, body: JSON.stringify(body) });
    if (!response.ok) throw new NotionSyncError(response.status, step);
    return response.json();
  }

  const rows = [...sessions.map(workoutRow), ...checkIns.map(checkInRow)];
  if (rows.length === 0) return { created: 0, updated: 0, unchanged: 0 };

  // Existing rows this sync created, within the same window (plus a day of
  // slack for timezone edges), keyed by Source ID.
  const windowStart = new Date(since.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const existing = new Map<string, NotionPage>();
  let cursor: string | undefined;
  do {
    const page = await call("query", `${NOTION_API}/data_sources/${config.dataSourceId}/query`, "POST", {
      filter: {
        and: [
          { property: "Source ID", rich_text: { starts_with: SOURCE_PREFIX } },
          { property: "Date", date: { on_or_after: windowStart } }
        ]
      },
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {})
    });
    for (const result of (page.results ?? []) as NotionPage[]) {
      const sourceId = plain(result.properties?.["Source ID"]?.rich_text);
      if (sourceId && !existing.has(sourceId)) existing.set(sourceId, result);
    }
    cursor = page.has_more ? page.next_cursor ?? undefined : undefined;
  } while (cursor);

  const result: SyncResult = { created: 0, updated: 0, unchanged: 0 };
  // Sequential on purpose: Notion rate-limits to ~3 requests/second.
  for (const row of rows) {
    const match = existing.get(row.sourceId);
    if (!match) {
      await call("create", `${NOTION_API}/pages`, "POST", {
        parent: { type: "data_source_id", data_source_id: config.dataSourceId },
        properties: toNotionProperties(row)
      });
      result.created++;
    } else if (!pageMatchesRow(match, row)) {
      await call("update", `${NOTION_API}/pages/${match.id}`, "PATCH", {
        properties: toNotionProperties(row)
      });
      result.updated++;
    } else {
      result.unchanged++;
    }
  }
  return result;
}
