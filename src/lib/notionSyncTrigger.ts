import { isNotionSyncEnabled } from "@/lib/notionSyncFlag";

// Fire-and-forget nudge for /api/notion-sync. Only sent when the founder
// feature flag is on (see src/lib/notionSyncFlag.ts), so regular users never
// call it. The route still decides whether sync applies to this user, and
// failures never surface in the UI because the Notion mirror is optional.
export function requestNotionSync() {
  if (!isNotionSyncEnabled(process.env.NEXT_PUBLIC_NOTION_SYNC_ENABLED)) return;
  if (typeof fetch !== "function") return;
  fetch("/api/notion-sync", { method: "POST", keepalive: true }).catch(() => undefined);
}
