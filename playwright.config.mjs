// The demo's own tests: a real browser, real taps. `pnpm test:demo` builds the demo and runs them.
import { defineConfig, devices } from "@playwright/test";

// Chromium draws in software, never on the machine's graphics card (a GPU kernel panic on 2026-11-02). WebKit has no such switch.
const SOFTWARE_GL_ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const software = { launchOptions: { args: SOFTWARE_GL_ARGS } };

const phone = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

export default defineConfig({
  testDir: "e2e",
  testMatch: ["*.demo.mjs", "demo.mjs"],
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  reporter: "list",
  use: { reducedMotion: "reduce", locale: "en-US" },
  projects: [
    { name: "chromium-phone", use: { ...devices["Desktop Chrome"], ...phone, ...software } },
    { name: "chromium-desk", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 }, ...software } },
    // WebKit on a desktop viewport with touch: `isMobile` is Chromium's to honour.
    { name: "webkit-phone", use: { ...devices["Desktop Safari"], viewport: phone.viewport, hasTouch: true } },
  ],
});
