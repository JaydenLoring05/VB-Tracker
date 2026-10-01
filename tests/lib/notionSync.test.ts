import { describe, expect, it, vi } from "vitest";

import {
  checkInRow,
  checkInSourceId,
  kneeFeel,
  NotionSyncError,
  pageMatchesRow,
  readNotionSyncConfig,
  summarizeSets,
  syncTrainingLog,
  toNotionProperties,
  workoutRow,
  workoutSourceId,
  type NotionPage,
  type NotionProperty,
  type SyncCheckIn,
  type SyncSession
} from "@/lib/notionSync";

const config = { token: "secret_test", dataSourceId: "ds-1", userId: "user-1" };

const session: SyncSession = {
  id: "s1",
  week: 3,
  day: "Monday",
  ended_at: "2026-09-27T18:30:00.000Z",
  duration_seconds: 2730,
  rpe: 7,
  workout_sets: [
    { exercise: "Back Squat", set_number: 2, weight: 145, reps: 5 },
    { exercise: "Back Squat", set_number: 1, weight: 135, reps: 5 },
    { exercise: "Box Jump", set_number: 1, weight: null, reps: 6 }
  ]
};

const checkIn: SyncCheckIn = {
  id: "c1",
  created_at: "2026-09-26T12:00:00.000Z",
  vertical: 28.5,
  approach: 124,
  sleep: 7.5,
  knee_pain: 4
};

// Builds a page shaped like Notion's query response for a row.
function pageFor(id: string, properties: Record<string, unknown>): NotionPage {
  const plainText = (value: unknown) =>
    (value as { text: { content: string } }[]).map((part) => ({ plain_text: part.text.content }));
  const out: Record<string, NotionProperty> = {};
  for (const [name, prop] of Object.entries(properties)) {
    const p = prop as Record<string, unknown>;
    if (p.title) out[name] = { title: plainText(p.title) };
    else if (p.rich_text) out[name] = { rich_text: plainText(p.rich_text) };
    else out[name] = p as NotionProperty;
  }
  return { id, properties: out };
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("readNotionSyncConfig", () => {
  it("returns null unless all three variables are set", () => {
    expect(readNotionSyncConfig({})).toBeNull();
    expect(readNotionSyncConfig({ NOTION_TOKEN: "t", NOTION_TRAINING_LOG_DATA_SOURCE_ID: "d" })).toBeNull();
    expect(
      readNotionSyncConfig({ NOTION_TOKEN: " ", NOTION_TRAINING_LOG_DATA_SOURCE_ID: "d", NOTION_SYNC_USER_ID: "u" })
    ).toBeNull();
  });

  it("reads and trims the server-only variables", () => {
    expect(
      readNotionSyncConfig({
        NOTION_TOKEN: " t ",
        NOTION_TRAINING_LOG_DATA_SOURCE_ID: "d",
        NOTION_SYNC_USER_ID: "u"
      })
    ).toEqual({ token: "t", dataSourceId: "d", userId: "u" });
  });
});

describe("row building", () => {
  it("maps knee pain (0-10, higher is worse) to Knee Feel", () => {
    expect(kneeFeel(null)).toBeNull();
    expect(kneeFeel(0)).toBe("Good");
    expect(kneeFeel(2)).toBe("Good");
    expect(kneeFeel(3)).toBe("Okay");
    expect(kneeFeel(5)).toBe("Okay");
    expect(kneeFeel(6)).toBe("Sore");
    expect(kneeFeel(Number.NaN)).toBeNull();
  });

  it("groups sets per exercise in set order", () => {
    expect(summarizeSets(session.workout_sets!)).toBe("Back Squat: 135x5, 145x5\nBox Jump: 6 reps");
  });

  it("builds a workout row with sets, minutes, and RPE", () => {
    expect(workoutRow(session)).toEqual({
      sourceId: "nextrep-workout-s1",
      session: "NextRep: Week 3 Monday",
      date: "2026-09-27T18:30:00.000Z",
      type: "Weights",
      minutes: 46,
      rpe: 7,
      notes: "3 sets\nBack Squat: 135x5, 145x5\nBox Jump: 6 reps"
    });
  });

  it("handles a workout with no sets, duration, or rating", () => {
    const row = workoutRow({ ...session, workout_sets: null, duration_seconds: null, rpe: null });
    expect(row.notes).toBe("0 sets");
    expect(row.minutes).toBeNull();
    expect(row.rpe).toBeNull();
  });

  it("builds a check-in row with vertical, approach, sleep, and knee feel", () => {
    expect(checkInRow(checkIn)).toEqual({
      sourceId: "nextrep-checkin-c1",
      session: "NextRep: Stats check-in",
      date: "2026-09-26T12:00:00.000Z",
      type: "Check-in",
      vertical: 28.5,
      approach: 124,
      sleep: 7.5,
      kneeFeel: "Okay"
    });
  });

  it("only writes the columns a row owns", () => {
    const workoutProps = toNotionProperties(workoutRow(session));
    expect(Object.keys(workoutProps).sort()).toEqual(
      ["Date", "Lifts / Notes", "Minutes", "RPE", "Session", "Source ID", "Type"].sort()
    );
    const checkInProps = toNotionProperties(checkInRow({ ...checkIn, knee_pain: null }));
    expect(checkInProps["Knee Feel"]).toEqual({ select: null });
    expect(checkInProps).not.toHaveProperty("RPE");
  });

  it("truncates text to Notion's 2000 character limit", () => {
    const long = { ...session, workout_sets: [{ exercise: "x".repeat(3000), set_number: 1, weight: 1, reps: 1 }] };
    const props = toNotionProperties(workoutRow(long)) as Record<string, { rich_text: { text: { content: string } }[] }>;
    expect(props["Lifts / Notes"].rich_text[0].text.content).toHaveLength(2000);
  });
});

describe("pageMatchesRow", () => {
  it("matches a page holding the same values, even with Notion's date format", () => {
    const row = workoutRow(session);
    const page = pageFor("p1", toNotionProperties(row));
    (page.properties.Date as { date: { start: string } }).date.start = "2026-09-27T18:30:00.000+00:00";
    expect(pageMatchesRow(page, row)).toBe(true);
  });

  it("detects a changed value such as a new RPE", () => {
    const page = pageFor("p1", toNotionProperties(workoutRow({ ...session, rpe: null })));
    expect(pageMatchesRow(page, workoutRow(session))).toBe(false);
  });
});

describe("syncTrainingLog", () => {
  const since = new Date("2026-09-14T00:00:00.000Z");

  it("does nothing when there is nothing to sync", async () => {
    const fetchImpl = vi.fn();
    const result = await syncTrainingLog({ config, sessions: [], checkIns: [], since, fetchImpl });
    expect(result).toEqual({ created: 0, updated: 0, unchanged: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("creates missing rows, updates changed ones, and skips unchanged ones", async () => {
    const changed = { ...session, id: "s2", rpe: 9 };
    const existing = [
      pageFor("page-s1", toNotionProperties(workoutRow(session))),
      pageFor("page-s2", toNotionProperties(workoutRow({ ...changed, rpe: null })))
    ];
    const fetchImpl = vi.fn(async (url: string, _init: RequestInit) => {
      if (url.endsWith("/query")) return response({ results: existing, has_more: false, next_cursor: null });
      return response({ id: "new" });
    });

    const result = await syncTrainingLog({ config, sessions: [session, changed], checkIns: [checkIn], since, fetchImpl });

    expect(result).toEqual({ created: 1, updated: 1, unchanged: 1 });
    const calls = fetchImpl.mock.calls.map(([url, init]) => [url, init.method]);
    expect(calls).toEqual([
      ["https://api.notion.com/v1/data_sources/ds-1/query", "POST"],
      ["https://api.notion.com/v1/pages/page-s2", "PATCH"],
      ["https://api.notion.com/v1/pages", "POST"]
    ]);

    const [, queryInit] = fetchImpl.mock.calls[0];
    const headers = queryInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret_test");
    expect(headers["Notion-Version"]).toBe("2025-09-03");
    const query = JSON.parse(queryInit.body as string);
    expect(query.filter.and[0]).toEqual({ property: "Source ID", rich_text: { starts_with: "nextrep-" } });
    // Lookback window plus one day of slack.
    expect(query.filter.and[1]).toEqual({ property: "Date", date: { on_or_after: "2026-09-13T00:00:00.000Z" } });

    const create = JSON.parse(fetchImpl.mock.calls[2][1].body as string);
    expect(create.parent).toEqual({ type: "data_source_id", data_source_id: "ds-1" });
    expect(create.properties["Source ID"].rich_text[0].text.content).toBe(checkInSourceId("c1"));
  });

  it("follows query pagination before writing", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      if (!url.endsWith("/query")) return response({ id: "new" });
      const body = JSON.parse(init.body as string);
      return body.start_cursor
        ? response({ results: [pageFor("page-s1", toNotionProperties(workoutRow(session)))], has_more: false })
        : response({ results: [], has_more: true, next_cursor: "cursor-2" });
    });

    const result = await syncTrainingLog({ config, sessions: [session], checkIns: [], since, fetchImpl });
    expect(result).toEqual({ created: 0, updated: 0, unchanged: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws a NotionSyncError naming the failed step", async () => {
    const fetchImpl = vi.fn(async () => response({ message: "unauthorized" }, 401));
    await expect(
      syncTrainingLog({ config, sessions: [session], checkIns: [], since, fetchImpl })
    ).rejects.toMatchObject({ status: 401, step: "query" });
    await expect(
      syncTrainingLog({ config, sessions: [session], checkIns: [], since, fetchImpl })
    ).rejects.toBeInstanceOf(NotionSyncError);
  });

  it("uses stable source IDs", () => {
    expect(workoutSourceId("abc")).toBe("nextrep-workout-abc");
    expect(checkInSourceId("abc")).toBe("nextrep-checkin-abc");
  });
});
