// The Workout Mode active-time flush, as a plain keepalive request.
//
// supabase-js has no per-request keepalive option, and its fetch is aborted
// when the page unloads, so a tab close or hard reload could drop the last
// active window. A `fetch(..., { keepalive: true })` is allowed to outlive the
// page. It still sends the user's own JWT, so row-level security applies
// exactly as it does through supabase-js.

export function activeSecondsAfterWindow(
  previousActiveSeconds: number | null | undefined,
  resumedAt: string,
  now: number = Date.now()
): number {
  const elapsed = Math.max(0, Math.round((now - new Date(resumedAt).getTime()) / 1000));
  return (previousActiveSeconds ?? 0) + elapsed;
}

export function buildActiveTimeFlushRequest({
  supabaseUrl,
  anonKey,
  accessToken,
  sessionId,
  userId,
  activeSeconds
}: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  sessionId: string;
  userId: string;
  activeSeconds: number;
}): { url: string; init: RequestInit } {
  const base = supabaseUrl.replace(/\/+$/, "");
  const url =
    `${base}/rest/v1/workout_sessions` +
    `?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}`;

  return {
    url,
    init: {
      method: "PATCH",
      keepalive: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ active_seconds: activeSeconds, resumed_at: null })
    }
  };
}
