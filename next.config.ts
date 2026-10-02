import type { NextConfig } from "next";

import { notionSyncFlagValue } from "./src/lib/notionSyncFlag";

const nextConfig: NextConfig = {
  env: {
    // Resolved at build time; see src/lib/notionSyncFlag.ts. Only "true" or
    // "false" reaches the browser.
    NEXT_PUBLIC_NOTION_SYNC_ENABLED: notionSyncFlagValue(process.env)
  }
};

export default nextConfig;
