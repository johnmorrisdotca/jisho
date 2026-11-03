import { defineConfig } from "vitest/config";

// The size check bundles every entry point the way a reader's bundler would, and `./words` reaches every piece of the dictionary, so it
// takes several seconds where the others take a fraction of one.
//
// `pnpm test:coverage` measures the code in src/ (not its tests, and not the data tables, which are machine output) and fails when
// a number falls below the floor, which is the level of 2026-11-03 (statements 99.25, branches 92.11, functions 98.74, lines 99.76), rounded down. Raise the floor when the coverage rises; never lower it to pass.
export default defineConfig({
  test: {
    testTimeout: 180_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.*", "src/data/**", "src/**/*.d.ts", "src/version.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { statements: 99, branches: 92, functions: 98, lines: 99 },
    },
  },
});
