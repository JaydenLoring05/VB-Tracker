import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The route must never reach a real Supabase project: replace the client.
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
const createClient = vi.fn(() => ({ from }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => (createClient as (...a: unknown[]) => unknown)(...args)
}));

const HOST = "nextrep.test";

const application = {
  coachName: "Coach Carter",
  email: "Coach@Example.com",
  teamName: "Varsity Girls",
  level: "high_school",
  rosterSize: 14,
  trackingMethod: "spreadsheets",
  notes: "We start in August."
};

let ipCounter = 0;
const nextIp = () => `203.0.113.${++ipCounter}`;

function post(
  body: unknown,
  { ip = nextIp(), origin, raw }: { ip?: string; origin?: string | null; raw?: string } = {}
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    host: HOST,
    "x-forwarded-for": ip
  };
  if (origin) headers.origin = origin;
  return new NextRequest(`https://${HOST}/api/pilot`, {
    method: "POST",
    headers,
    body: raw ?? JSON.stringify(body)
  });
}

// Fresh module per test so the in-memory rate limiter starts empty.
async function loadRoute() {
  vi.resetModules();
  return (await import("@/app/api/pilot/route")).POST;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://placeholder.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "placeholder");
  insert.mockResolvedValue({ error: null });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("POST /api/pilot", () => {
  it("stores a valid application and maps it to database columns", async () => {
    const POST = await loadRoute();
    const response = await POST(post(application));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(createClient).toHaveBeenCalledWith(
      "https://placeholder.supabase.co",
      "placeholder",
      expect.objectContaining({ auth: { persistSession: false, autoRefreshToken: false } })
    );
    expect(from).toHaveBeenCalledWith("pilot_applications");
    expect(insert).toHaveBeenCalledWith({
      coach_name: "Coach Carter",
      email: "coach@example.com",
      team_name: "Varsity Girls",
      level: "high_school",
      roster_size: 14,
      tracking_method: "spreadsheets",
      notes: "We start in August."
    });
  });

  it("stores empty notes as null", async () => {
    const POST = await loadRoute();
    await POST(post({ ...application, notes: "   " }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ notes: null }));
  });

  it("rejects an invalid email with field errors and does not touch the database", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...application, email: "not-an-email" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("validation");
    expect(body.fieldErrors.email).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("answers a filled honeypot with a fake success and stores nothing", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...application, website: "http://spam.example" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(insert).not.toHaveBeenCalled();
  });

  it("ignores a blank honeypot", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...application, website: "   " }));

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("rejects a body over 8 KB with 413", async () => {
    const POST = await loadRoute();
    const response = await POST(post({ ...application, notes: "x".repeat(9000) }));

    expect(response.status).toBe(413);
    expect((await response.json()).error).toBe("too_large");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request with 403", async () => {
    const POST = await loadRoute();
    const response = await POST(post(application, { origin: "https://evil.example" }));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("forbidden");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a malformed Origin header", async () => {
    const POST = await loadRoute();
    const response = await POST(post(application, { origin: "not a url" }));
    expect(response.status).toBe(403);
  });

  it("accepts a same-origin request", async () => {
    const POST = await loadRoute();
    const response = await POST(post(application, { origin: `https://${HOST}` }));
    expect(response.status).toBe(200);
  });

  it("returns 400 for a body that is not JSON", async () => {
    const POST = await loadRoute();
    const response = await POST(post(null, { raw: "{nope" }));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("bad_request");
  });

  it("treats JSON null and arrays as validation failures instead of crashing", async () => {
    const POST = await loadRoute();
    for (const raw of ["null", "[]", '"text"', "7"]) {
      const response = await POST(post(null, { raw }));
      expect(response.status, raw).toBe(400);
      expect((await response.json()).error, raw).toBe("validation");
    }
  });

  it("reports success for a duplicate email (unique violation 23505)", async () => {
    insert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
    const POST = await loadRoute();
    const response = await POST(post(application));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns 503 so the form shows the email fallback when the table is missing", async () => {
    for (const code of ["PGRST205", "42P01"]) {
      insert.mockResolvedValue({ error: { code, message: "relation does not exist" } });
      const POST = await loadRoute();
      const response = await POST(post(application));

      expect(response.status, code).toBe(503);
      expect((await response.json()).error, code).toBe("unavailable");
    }
  });

  it("returns 503 for any other database failure without leaking details", async () => {
    insert.mockResolvedValue({ error: { code: "42501", message: "permission denied for secret_table" } });
    const POST = await loadRoute();
    const response = await POST(post(application));

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret_table");
  });

  it("maps the database flood guard to 429 with Retry-After", async () => {
    insert.mockResolvedValue({
      error: { code: "P0001", message: "pilot_applications_rate_limited" }
    });
    const POST = await loadRoute();
    const response = await POST(post(application));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("600");
    expect((await response.json()).error).toBe("rate_limited");
  });

  it("returns 503 when Supabase env vars are not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const POST = await loadRoute();
    const response = await POST(post(application));

    expect(response.status).toBe(503);
    expect(createClient).not.toHaveBeenCalled();
  });

  describe("per-IP rate limit", () => {
    it("allows 5 requests per 10 minutes and blocks the 6th", async () => {
      const POST = await loadRoute();
      const ip = "198.51.100.7";

      for (let i = 0; i < 5; i++) {
        expect((await POST(post(application, { ip }))).status).toBe(200);
      }

      const blocked = await POST(post(application, { ip }));
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("retry-after")).toBe("600");

      // A different client is unaffected.
      expect((await POST(post(application, { ip: "198.51.100.8" }))).status).toBe(200);
    });

    it("counts invalid submissions toward the limit", async () => {
      const POST = await loadRoute();
      const ip = "198.51.100.20";

      for (let i = 0; i < 5; i++) {
        expect((await POST(post({ ...application, email: "bad" }, { ip }))).status).toBe(400);
      }
      expect((await POST(post(application, { ip }))).status).toBe(429);
    });

    it("does not count honeypot hits", async () => {
      const POST = await loadRoute();
      const ip = "198.51.100.30";

      for (let i = 0; i < 10; i++) {
        await POST(post({ ...application, website: "bot" }, { ip }));
      }
      expect((await POST(post(application, { ip }))).status).toBe(200);
    });

    it("forgets attempts after the 10 minute window", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-20T12:00:00Z"));
      const POST = await loadRoute();
      const ip = "198.51.100.40";

      for (let i = 0; i < 5; i++) await POST(post(application, { ip }));
      expect((await POST(post(application, { ip }))).status).toBe(429);

      vi.setSystemTime(new Date("2026-07-20T12:10:01Z"));
      expect((await POST(post(application, { ip }))).status).toBe(200);
    });

    it("uses the first x-forwarded-for hop as the client address", async () => {
      const POST = await loadRoute();
      const chain = (last: string) => `198.51.100.50, ${last}`;

      for (let i = 0; i < 5; i++) await POST(post(application, { ip: chain(`10.0.0.${i}`) }));
      expect((await POST(post(application, { ip: chain("10.0.0.99") }))).status).toBe(429);
    });
  });
});
