import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach real Supabase or Notion: replace the server client and fetch.
type QueryResult = { data: unknown[] | null; error: { code: string } | null };

const getUser = vi.fn();
const tableResults: Record<string, QueryResult> = {};
const tableCalls: Record<string, { method: string; args: unknown[] }[]> = {};

function queryBuilder(table: string) {
  tableCalls[table] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "not", "gte", "order"]) {
    builder[method] = (...args: unknown[]) => {
      tableCalls[table].push({ method, args });
      return builder;
    };
  }
  builder.then = (resolve: (value: QueryResult) => unknown) => resolve(tableResults[table]);
  return builder;
}

const from = vi.fn((table: string) => queryBuilder(table));
const createClient = vi.fn(async () => ({ auth: { getUser }, from }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient()
}));

const HOST = "nextrep.test";
const USER_ID = "user-1";

function post(origin?: string) {
  const headers: Record<string, string> = { host: HOST };
  if (origin) headers.origin = origin;
  return new NextRequest(`https://${HOST}/api/notion-sync`, { method: "POST", headers });
}

const fetchMock = vi.fn();

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/notion-sync/route")).POST;
}

function enableSync() {
  vi.stubEnv("NOTION_TOKEN", "secret_test");
  vi.stubEnv("NOTION_TRAINING_LOG_DATA_SOURCE_ID", "ds-1");
  vi.stubEnv("NOTION_SYNC_USER_ID", USER_ID);
}

beforeEach(() => {
  vi.stubEnv("NOTION_TOKEN", "");
  vi.stubEnv("NOTION_TRAINING_LOG_DATA_SOURCE_ID", "");
  vi.stubEnv("NOTION_SYNC_USER_ID", "");
  vi.stubGlobal("fetch", fetchMock);
  getUser.mockResolvedValue({ data: { user: { id: USER_ID } }, error: null });
  tableResults.workout_sessions = {
    data: [
      {
        id: "s1",
        week: 1,
        day: "Monday",
        ended_at: new Date().toISOString(),
        duration_seconds: 1800,
        rpe: 6,
        workout_sets: [{ exercise: "Back Squat", set_number: 1, weight: 135, reps: 5 }]
      }
    ],
    error: null
  };
  tableResults.stats_history = {
    data: [{ id: "c1", created_at: new Date().toISOString(), vertical: 28, approach: 120, sleep: 8, knee_pain: 1 }],
    error: null
  };
  fetchMock.mockImplementation(async (url: string) =>
    new Response(JSON.stringify(url.endsWith("/query") ? { results: [], has_more: false } : { id: "new" }), {
      status: 200
    })
  );
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/notion-sync", () => {
  it("is a no-op when the env vars are not set, without touching Supabase", async () => {
    const POST = await loadRoute();
    const response = await POST(post());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, skipped: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is a no-op for any user other than NOTION_SYNC_USER_ID", async () => {
    enableSync();
    getUser.mockResolvedValue({ data: { user: { id: "someone-else" } }, error: null });
    const POST = await loadRoute();
    const response = await POST(post());

    expect(await response.json()).toEqual({ ok: true, skipped: true });
    expect(from).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    enableSync();
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const POST = await loadRoute();
    const response = await POST(post());

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request", async () => {
    enableSync();
    const POST = await loadRoute();
    expect((await POST(post("https://evil.example"))).status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("syncs the last 14 days of workouts and check-ins for the configured user", async () => {
    enableSync();
    const POST = await loadRoute();
    const before = Date.now();
    const response = await POST(post(`https://${HOST}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, created: 2, updated: 0, unchanged: 0 });

    expect(from).toHaveBeenCalledWith("workout_sessions");
    expect(from).toHaveBeenCalledWith("stats_history");
    const sessionCalls = tableCalls.workout_sessions;
    expect(sessionCalls).toContainEqual({ method: "eq", args: ["user_id", USER_ID] });
    expect(sessionCalls).toContainEqual({ method: "not", args: ["ended_at", "is", null] });
    const gte = sessionCalls.find((call) => call.method === "gte")!;
    expect(gte.args[0]).toBe("ended_at");
    const lookbackMs = before - Date.parse(gte.args[1] as string);
    expect(lookbackMs).toBeGreaterThanOrEqual(14 * 24 * 60 * 60 * 1000 - 1000);
    expect(lookbackMs).toBeLessThanOrEqual(14 * 24 * 60 * 60 * 1000 + 1000);
    expect(tableCalls.stats_history).toContainEqual({ method: "eq", args: ["user_id", USER_ID] });

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      "https://api.notion.com/v1/data_sources/ds-1/query",
      "https://api.notion.com/v1/pages",
      "https://api.notion.com/v1/pages"
    ]);
  });

  it("returns 500 without calling Notion when a Supabase read fails", async () => {
    enableSync();
    tableResults.stats_history = { data: null, error: { code: "42501" } };
    const POST = await loadRoute();
    const response = await POST(post());

    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("read_failed");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 without leaking Notion's error body", async () => {
    enableSync();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ message: "token secret_test invalid" }), { status: 401 }));
    const POST = await loadRoute();
    const response = await POST(post());

    expect(response.status).toBe(502);
    const body = JSON.stringify(await response.json());
    expect(body).toContain("notion_failed");
    expect(body).not.toContain("secret_test");
    expect(console.error).toHaveBeenCalledWith("notion sync failed", { step: "query", status: 401 });
  });
});
