// Fire-and-forget nudge for /api/notion-sync. The route decides whether sync
// is enabled for this user, so this is safe to call for everyone; failures
// never surface in the UI because the Notion mirror is optional.
export function requestNotionSync() {
  if (typeof fetch !== "function") return;
  fetch("/api/notion-sync", { method: "POST", keepalive: true }).catch(() => undefined);
}
