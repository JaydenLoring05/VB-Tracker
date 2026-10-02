// The personal Notion Training Log sync is a founder feature. The browser
// only asks /api/notion-sync to run when NEXT_PUBLIC_NOTION_SYNC_ENABLED is
// "true", so regular users never trigger it.
//
// The flag is resolved at build time (next.config.ts): an explicit
// NEXT_PUBLIC_NOTION_SYNC_ENABLED wins; otherwise it is on only when all
// three server-side NOTION_* variables are set, so a deployment that already
// has the sync set up keeps working with no new variable. Only "true" or
// "false" is ever exposed to the browser, never the Notion values.

export function notionSyncFlagValue(env: Record<string, string | undefined>): "true" | "false" {
  const explicit = env.NEXT_PUBLIC_NOTION_SYNC_ENABLED?.trim().toLowerCase();
  if (explicit === "true" || explicit === "false") return explicit;
  const configured = Boolean(
    env.NOTION_TOKEN?.trim() && env.NOTION_TRAINING_LOG_DATA_SOURCE_ID?.trim() && env.NOTION_SYNC_USER_ID?.trim()
  );
  return configured ? "true" : "false";
}

export function isNotionSyncEnabled(flag: string | undefined): boolean {
  return flag === "true";
}
