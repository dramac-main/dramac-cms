import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globals: true,
    // Default 5 s is too tight under parallel worker contention —
    // several portal DAL tests individually clock ~1.3 s (transform-
    // heavy mocks), and when N files run in parallel the first
    // `import()` of a heavy file can queue past 5 s on some workers.
    // 20 s removes the flakiness without masking real hangs.
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
