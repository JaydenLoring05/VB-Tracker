import { NextResponse, type NextRequest } from "next/server";

import { MAX_SHEET_BYTES, readCapped, SHEET_TIMEOUT_MS, sheetCsvUrl } from "@/lib/sheetLink";
import { createClient } from "@/lib/supabase/server";

// "Bring in a plan" from a Google Sheets link (F-17). Reads a sheet shared as
// "Anyone with the link" as CSV and hands it back to the browser, which reads
// it like an uploaded file and shows the coach a preview. Nothing is stored.
// Only signed-in coaches, only docs.google.com spreadsheet links with a
// well-formed id (the address fetched is built from that id), with a size cap,
// a timeout and no redirects followed.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOT_SHARED =
  "That sheet isn't shared. In Google Sheets, tap Share, set General access to \"Anyone with the link\", and try again. Or download it as .csv and upload the file.";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
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

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  // Coaches only: the user's own memberships (RLS "own membership").
  const { data: coachOf } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("role", "coach")
    .limit(1);
  if (!coachOf || coachOf.length === 0) return json({ ok: false, error: "Only coaches can bring in a plan." }, 403);

  let link = "";
  try {
    const body = await request.json();
    link = typeof body?.url === "string" ? body.url : "";
  } catch {
    // Falls through to the message below.
  }
  const csvUrl = sheetCsvUrl(link);
  if (!csvUrl) return json({ ok: false, error: "That isn't a Google Sheets link. Copy it from the address bar of the sheet." }, 400);

  let response: Response;
  try {
    response = await fetch(csvUrl, { redirect: "manual", signal: AbortSignal.timeout(SHEET_TIMEOUT_MS), cache: "no-store" });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return json(
      { ok: false, error: timedOut ? "Google took too long to answer. Try again in a moment." : "Couldn't reach Google Sheets. Try again." },
      502
    );
  }

  // A private sheet redirects to Google sign-in, or answers with a page instead of CSV.
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("text/csv")) {
    await response.body?.cancel();
    return json({ ok: false, error: NOT_SHARED }, 422);
  }

  const csv = await readCapped(response, MAX_SHEET_BYTES);
  if (csv == null) return json({ ok: false, error: "That sheet is too big to be a training plan." }, 413);
  return json({ ok: true, csv });
}
