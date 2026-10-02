import { describe, expect, it } from "vitest";

import { isNotionSyncEnabled, notionSyncFlagValue } from "@/lib/notionSyncFlag";

const configured = {
  NOTION_TOKEN: "secret",
  NOTION_TRAINING_LOG_DATA_SOURCE_ID: "ds",
  NOTION_SYNC_USER_ID: "u1"
};

describe("notionSyncFlagValue", () => {
  it("is off by default", () => {
    expect(notionSyncFlagValue({})).toBe("false");
  });

  it("stays on for a deployment that already has Notion sync set up", () => {
    expect(notionSyncFlagValue(configured)).toBe("true");
  });

  it("is off when only part of the Notion setup exists", () => {
    expect(notionSyncFlagValue({ NOTION_TOKEN: "secret" })).toBe("false");
  });

  it("lets the explicit flag win either way", () => {
    expect(notionSyncFlagValue({ ...configured, NEXT_PUBLIC_NOTION_SYNC_ENABLED: "false" })).toBe("false");
    expect(notionSyncFlagValue({ NEXT_PUBLIC_NOTION_SYNC_ENABLED: "TRUE" })).toBe("true");
  });

  it("never exposes the server-only Notion values", () => {
    expect(notionSyncFlagValue(configured)).not.toContain("secret");
  });
});

describe("isNotionSyncEnabled", () => {
  it("reads the public flag", () => {
    expect(isNotionSyncEnabled("true")).toBe(true);
    expect(isNotionSyncEnabled("false")).toBe(false);
    expect(isNotionSyncEnabled(undefined)).toBe(false);
  });
});

describe("requestNotionSync", () => {
  it("does nothing while the flag is off, and posts once it's on", async () => {
    const { vi } = await import("vitest");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    vi.stubEnv("NEXT_PUBLIC_NOTION_SYNC_ENABLED", "false");
    vi.resetModules();
    (await import("@/lib/notionSyncTrigger")).requestNotionSync();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("NEXT_PUBLIC_NOTION_SYNC_ENABLED", "true");
    vi.resetModules();
    (await import("@/lib/notionSyncTrigger")).requestNotionSync();
    expect(fetchMock).toHaveBeenCalledWith("/api/notion-sync", { method: "POST", keepalive: true });

    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
