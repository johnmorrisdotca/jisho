import { defineConfig } from "vitest/config";

// The size check bundles every entry point the way a reader's bundler would, and `./words` reaches every piece of the
// dictionary, so it takes several seconds where the others take a fraction of one.
export default defineConfig({ test: { testTimeout: 60_000 } });
