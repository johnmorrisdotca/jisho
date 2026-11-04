// Stroke order on the card, a kanji found by drawing it, and "did you mean" for a lookup that found nothing.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };

async function open(page, address) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.route("http://jisho.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({
      body: readFileSync(file),
      contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream",
    });
  });
  await page.goto(`http://jisho.test/?${address}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  return errors;
}

/** Draws strokes on the pad with the pointer: each a list of [x, y] as fractions of the pad. */
async function draw(page, strokes) {
  await page.locator('[data-testid="draw-canvas"]').scrollIntoViewIfNeeded();
  const box = await page.locator('[data-testid="draw-canvas"]').boundingBox();
  for (const stroke of strokes) {
    const [first, ...rest] = stroke.map(([x, y]) => [box.x + box.width * x, box.y + box.height * y]);
    await page.mouse.move(first[0], first[1]);
    await page.mouse.down();
    for (const [x, y] of rest) await page.mouse.move(x, y, { steps: 6 });
    await page.mouse.up();
  }
}

test("the card of a kanji writes its strokes out, in the language of the page", async ({ page }) => {
  const errors = await open(page, "lang=en&help=off&list=g1&kanji=%E6%97%A5");
  const picture = page.locator('[data-testid="strokes-picture"]');
  await expect(picture.locator("path")).toHaveCount(4);
  await expect(picture.locator("svg")).toHaveAttribute("aria-label", "The strokes of 日, in order");
  await expect(picture.locator("text")).toHaveCount(0);
  await page.locator('[data-testid="strokes-numbers"]').click();
  await expect(picture.locator("text")).toHaveCount(4);
  await expect(page.locator('[data-testid="strokes-numbers"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-testid="strokes-replay"]').click();
  await expect(picture.locator("path")).toHaveCount(4);
  await page.locator('kazoku-language-picker [data-v="ja"]').click();
  await expect(page.locator('[data-testid="strokes"] h3')).toHaveText("筆順");
  expect(errors).toEqual([]);
});

test("a kanji drawn on the pad is found, and tapping it opens its card", async ({ page }) => {
  const errors = await open(page, "lang=en&help=off&list=g1");
  await expect(page.locator('[data-testid="draw-pad"]')).toBeHidden();
  await page.locator('[data-testid="draw-toggle"]').click();
  await expect(page.locator('[data-testid="draw-pad"]')).toBeVisible();
  await draw(page, [
    [
      [0.1, 0.5],
      [0.9, 0.5],
    ],
    [
      [0.5, 0.1],
      [0.5, 0.9],
    ],
  ]);
  const results = page.locator('[data-testid="draw-result"]');
  await expect(results.first()).toBeVisible({ timeout: 30_000 });
  await expect(results.first()).toHaveText("十");
  await results.first().click();
  await expect(page.locator('[data-testid="card"]')).toContainText("十");
  await page.locator('[data-testid="draw-undo"]').click();
  await expect(results.first()).toHaveText("一");
  await page.locator('[data-testid="draw-clear"]').click();
  await expect(results).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("a lookup that finds nothing suggests the words one slip away", async ({ page }) => {
  const errors = await open(page, "lang=en&help=off&view=words&word=arigatuo");
  const row = page.locator('[data-testid="suggest-row"]');
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid="word-count"]')).toContainText("No word to show");
  const thanks = page.locator('[data-testid="suggestion"]', { hasText: "ありがとう" });
  await expect(thanks).toBeVisible();
  await thanks.click();
  await expect(page.locator('[data-testid="word-item"]').first()).toContainText("ありがとう");
  await expect(row).toBeHidden();
  expect(errors).toEqual([]);
});
