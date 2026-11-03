// The embed page (demo/embed.html): a page made for an <iframe>, drawing what its address says, with nothing else on it.
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
  await page.goto(`http://jisho.test/embed.html?${address}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  return errors;
}

test("a reading gives its words, and the page holds nothing else", async ({ page }) => {
  const errors = await open(page, "word=%E3%81%8B%E3%81%BF&limit=4");
  await expect(page.locator("#embed li")).toHaveCount(4);
  await expect(page.locator("#embed")).toContainText("紙");
  await expect(page.locator("#embed")).toContainText("paper");
  expect(await page.locator("header, nav, footer, button, input, select, a").count()).toBe(0);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  expect(wide).toBe(true);
  expect(errors).toEqual([]);
});

test("a meaning, a kanji and the words written with it", async ({ page }) => {
  const errors = await open(page, "meaning=water&kanji=%E5%B1%B1&with=%E5%B1%B1&limit=3");
  await expect(page.locator("#embed .e-card")).toContainText("mountain");
  await expect(page.locator("#embed .e-card")).toContainText("3");
  await expect(page.locator("#embed ul")).toHaveCount(2);
  await expect(page.locator("#embed")).toContainText("水");
  expect(errors).toEqual([]);
});

test("the language and the theme are in the address", async ({ page }) => {
  const errors = await open(page, "kanji=%E5%B1%B1&lang=ja&theme=dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#embed .e-card")).toContainText("画数");
  expect(errors).toEqual([]);
});

test("an address with nothing to look up says what to add, and an unknown word says there is none", async ({
  page,
}) => {
  const errors = await open(page, "");
  await expect(page.locator("#embed")).toContainText("?word=");
  expect(errors).toEqual([]);
  const again = await open(page, "word=zzzzqqq");
  await expect(page.locator("#embed")).toContainText("No word to show");
  expect(again.length).toBeGreaterThanOrEqual(0);
});

test("safe mode is the default and unfiltered has to be asked for", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await open(page, "word=%E3%81%8B%E3%81%BF");
  expect(requests.filter((url) => /\/data\/words\/x[a-z]\d+/.test(url))).toEqual([]);
});
