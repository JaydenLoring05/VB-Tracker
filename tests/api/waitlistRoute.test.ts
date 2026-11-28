import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Never reach a real Supabase project: replace the client.
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const createClient = vi.fn(() => ({ from }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => (createClient as (...a: unknown[]) => unknown)(...args)
}));

const HOST = "nextrep.test";
const signup = { name: "Maya Chen", email: "Maya@Example.com", position: "outside", ageGroup: "14to17" };

let ipCounter = 0;
const nextIp = () => `198.51.100.${++ipCounter}`;

function post(body: unknown, { ip = nextIp(), origin, raw }: { ip?: string; origin?: string; raw?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json", host: HOST, "x-forwarded-for": ip };
  if (origin) headers.origin = origin;
  return new NextRequest(`https://${HOST}/api/waitlist`, { method: "POST", headers, body: raw ?? JSON.stringify(body) });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/waitlist/route")).POST;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder");
  insert.mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/waitlist", () => {
  it("stores a valid sign-up in waitlist_signups with a lowercased email", async () => {
    const POST = await loadRoute();
    const response = await POST(post(signup));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(from).toHaveBeenCalledWith("waitlist_signups");
    expect(insert).toHaveBeenCalledWith({
      name: "Maya Chen",
      email: "maya@example.com",
      position: "outside",
      age_group: "14to17"
    });
  });

  it("stores blank optional fields as null", async () => {
    const POST = await loadRoute();
    await POST(post({ name: "Sam", email: "sam@example.com", position: "", ageGroup: "" }));
    expect(insert).toHaveBeenCalledWith({ name: "Sam", email: "sam@example.com", position: null, age_group: null });
  });

  it("rejects a bad email or an unknown position with field errors", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...signup, email: "nope", position: "quarterback" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(Object.keys(body.fieldErrors).sort()).toEqual(["email", "position"]);
    expect(insert).not.toHaveBeenCalled();
  });

  it("answers a filled honeypot with a fake success and stores nothing", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...signup, website: "spam.example" }));
    expect(response.status).toBe(200);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests and non-JSON bodies", async () => {
    const POST = await loadRoute();
    expect((await POST(post(signup, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await POST(post(null, { raw: "{nope" }))).status).toBe(400);
  });

  it("reports success for a duplicate email", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate" } });
    const POST = await loadRoute();
    expect((await POST(post(signup))).status).toBe(200);
  });

  it("returns 503 when the table is missing (SQL not run yet)", async () => {
    insert.mockResolvedValue({ error: { code: "PGRST205", message: "missing" } });
    const POST = await loadRoute();
    const response = await POST(post(signup));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
  });

  it("maps the database flood guard to 429", async () => {
    insert.mockResolvedValue({ error: { code: "P0001", message: "waitlist_signups_rate_limited" } });
    const POST = await loadRoute();
    expect((await POST(post(signup))).status).toBe(429);
  });

  it("rate limits one IP after five tries", async () => {
    const POST = await loadRoute();
    for (let i = 0; i < 5; i++) expect((await POST(post(signup, { ip: "192.0.2.9" }))).status).toBe(200);
    expect((await POST(post(signup, { ip: "192.0.2.9" }))).status).toBe(429);
  });
});
