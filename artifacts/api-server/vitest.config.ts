import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // DB-integration suites share the same Postgres tables and module-level
    // durable counters; never interleave them across files.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Workspace packages export raw .ts (see lib/db/package.json "exports").
    // Inline them so vitest transforms the TypeScript instead of trying to
    // require the source through Node.
    server: { deps: { inline: [/@workspace\//] } },
  },
});
