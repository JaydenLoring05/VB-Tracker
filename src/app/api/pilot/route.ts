import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { validatePilotApplication } from "@/lib/pilotApplication";

// Public write endpoint for /pilot. It inserts with the normal anon key; the
// pilot_applications RLS policy only allows INSERT, so this route can never
// read applications back. Nothing here uses a service-role key.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;

// Best-effort per-IP limiter. Serverless instances do not share memory, so this
// only slows down a single noisy client; the unique email index and the
// database flood guard are the real backstops.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_TRACKED_IPS = 5000;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  if (attempts.size > MAX_TRACKED_IPS) {
    for (const [key, times] of attempts) {
      if (times.every((time) => now - time > WINDOW_MS)) attempts.delete(key);
    }
    if (attempts.size > MAX_TRACKED_IPS) attempts.clear();
  }

  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: real people never see this field. Answer like a success so bots
  // learn nothing, and store nothing.
  const honeypot = (body as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return json({ ok: true });
  }

  if (rateLimited(clientIp(request), Date.now())) {
    return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": "600" });
  }

  const result = validatePilotApplication(body);
  if (!result.ok) return json({ ok: false, error: "validation", fieldErrors: result.errors }, 400);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return json({ ok: false, error: "unavailable" }, 503);

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const application = result.value;
  const { error } = await supabase.from("pilot_applications").insert({
    coach_name: application.coachName,
    email: application.email,
    team_name: application.teamName,
    level: application.level,
    roster_size: application.rosterSize,
    tracking_method: application.trackingMethod,
    notes: application.notes || null
  });

  if (!error) return json({ ok: true });

  // Same email applied before: report success so the endpoint does not reveal
  // which addresses already exist.
  if (error.code === "23505") return json({ ok: true });

  if (error.message?.includes("pilot_applications_rate_limited")) {
    return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": "600" });
  }

  // Missing table (SQL not run yet, PGRST205 / 42P01), permission problems, or
  // any other failure: the form shows the email fallback instead of an error.
  console.error("pilot application insert failed", { code: error.code });
  return json({ ok: false, error: "unavailable" }, 503);
}
