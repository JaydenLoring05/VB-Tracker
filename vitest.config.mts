import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Pure-logic tests only: no DOM, no network, no real Supabase.
export default defineConfig({
  resolve: {
    alias: {
      // Mirrors "paths" in tsconfig.json.
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true
  }
});
