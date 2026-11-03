// The full entry of a word in the demo: its card beside the list, in the address, safe by default, and a cross-reference that looks the word up.
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

const KAMI = "view=words&word=%E3%81%8B%E3%81%BF";

test("a word's full entry opens in its card and is kept in the address", async ({ page }) => {
  const errors = await open(page, `lang=en&help=off&${KAMI}`);
  await expect(page.locator('[data-testid="entry-card"]')).toBeHidden();
  await page.locator('[data-testid="entry-open"]').first().click();
  const card = page.locator('[data-testid="entry-card"]');
  await expect(card.locator('[data-testid="entry-sense"]').first()).toBeVisible();
  await expect(card).toContainText("paper");
  await expect(card.locator(".jisho-pos").first()).toHaveText("noun");
  await expect(page.locator('[data-testid="entry-open"]').first()).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).toContain("entry=%E7%B4%99");
  await card.locator('[data-testid="entry-close"]').click();
  await expect(card).toBeHidden();
  expect(page.url()).not.toContain("entry=");
  expect(errors).toEqual([]);
});

test("the address opens the entry it names, in Japanese too", async ({ page }) => {
  const errors = await open(page, `lang=ja&help=off&${KAMI}&entry=%E7%B4%99`);
  const card = page.locator('[data-testid="entry-card"]');
  await expect(card.locator('[data-testid="entry-sense"]').first()).toBeVisible();
  await expect(card.locator("h3")).toContainText("完全な項目");
  await expect(card.locator(".jisho-pos").first()).toHaveText("名詞");
  expect(errors).toEqual([]);
});

test("safe mode leaves out a sense JMdict marks vulgar, and unfiltered gives it", async ({ page }) => {
  const word = "word=%E3%83%8F%E3%83%BC%E3%83%A2%E3%83%8B%E3%82%AB";
  const errors = await open(page, `lang=en&help=off&view=words&${word}`);
  await page.locator('[data-testid="entry-open"]').first().click();
  const card = page.locator('[data-testid="entry-card"]');
  await expect(card.locator('[data-testid="entry-sense"]').first()).toBeVisible();
  await expect(card).toContainText("harmonica");
  await expect(card).not.toContainText("cunnilingus");
  await page.goto(`http://jisho.test/?lang=en&help=off&view=words&mode=unfiltered&${word}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await page.locator('[data-testid="entry-open"]').first().click();
  await expect(card).toContainText("cunnilingus");
  expect(errors).toEqual([]);
});

test("a cross-reference looks its word up", async ({ page }) => {
  const errors = await open(page, "lang=en&help=off&view=words&word=%E3%81%82%E3%81%A4%E3%81%84");
  const first = page.locator('[data-testid="word-item"]', { hasText: "hot" }).first();
  await first.locator('[data-testid="entry-open"]').click();
  const link = page.locator('[data-testid="entry-card"] .jisho-link').first();
  await expect(link).toBeVisible();
  const text = (await link.textContent()) ?? "";
  await link.click();
  await expect(page.locator('[data-testid="word-count"]')).not.toHaveText(/Looking up/);
  const looked = await page.locator("#word").inputValue();
  expect(text).toContain(looked.slice(0, 1));
  expect(errors).toEqual([]);
});

test("a sense shows its example sentences with furigana, English, level and credit", async ({ page }) => {
  const errors = await open(page, "lang=en&help=off&view=words&word=%E7%8A%AC&entry=%E7%8A%AC");
  const example = page.locator('[data-testid="entry-example"]').first();
  await expect(example).toBeVisible();
  await expect(example.locator("ruby rt").first()).not.toBeEmpty();
  await expect(example).toContainText("dog");
  await expect(example).toContainText("Tatoeba #");
  await expect(example).toContainText("CC BY 2.0 FR");
  await expect(example.locator(".jisho-mark")).toHaveCount(1);
  expect(errors).toEqual([]);
});
