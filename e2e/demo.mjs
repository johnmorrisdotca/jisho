// The demo, driven as a person drives it. Each flow ends by checking that the page fits the screen and nothing was complained of.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

async function open(page, address = "?lang=en") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.route("http://moji.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({
      body: readFileSync(file),
      contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream",
    });
  });
  await page.goto(`http://moji.test/${address}`);
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  return errors;
}

async function tap(target) {
  await target.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await target.tap();
  else await target.click();
}

async function sound(page, errors) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over, "the page scrolls sideways").toBeLessThanOrEqual(0);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll(".moji-grid button, .moji-alike button, .fam-seg button, input")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      })
      .map((el) => el.textContent),
  );
  expect(small, "something to press is under 44px").toEqual([]);
  expect(errors, "the page complained").toEqual([]);
}

test("opens on grade 1, with its eighty kanji and its sources named", async ({ page }) => {
  const errors = await open(page);
  await expect(page.getByTestId("grid").locator("button")).toHaveCount(80);
  await expect(page.getByTestId("count")).toHaveText("80 kanji.");
  await expect(page.getByTestId("source-kanjidic")).toContainText("KANJIDIC2");
  await expect(page.getByTestId("source-waller")).toContainText("tanos.co.uk");
  await expect(page.getByTestId("source-yencken")).toContainText("Yencken");
  await sound(page, errors);
});

test("a JLPT level shows its kanji, and tapping one reads it", async ({ page }) => {
  const errors = await open(page);
  await tap(page.getByTestId("levels").getByRole("button", { name: "N5" }));
  await expect(page.getByTestId("grid").locator("button")).toHaveCount(79);
  await tap(page.getByTestId("grid").locator('[data-kanji="日"]'));
  const card = page.getByTestId("card");
  await expect(card).toContainText("日");
  await expect(card).toContainText("day");
  await expect(card).toContainText("N5");
  await expect(page).toHaveURL(/list=N5/);
  await sound(page, errors);
});

test("a look-alike leads to the kanji it looks like, and back", async ({ page }) => {
  const errors = await open(page, "?lang=en&kanji=土");
  const alike = page.locator('[data-testid="alike"]');
  await tap(alike.getByRole("button", { name: "士" }));
  await expect(page.locator(".moji-big")).toHaveText("士");
  await tap(alike.getByRole("button", { name: "土" }));
  await expect(page.locator(".moji-big")).toHaveText("土");
  await sound(page, errors);
});

test("search finds by meaning and by reading, and says so when nothing holds it", async ({ page }) => {
  const errors = await open(page);
  await page.getByTestId("search").fill("mountain");
  await expect(page.getByTestId("grid").locator('[data-kanji="山"]')).toBeVisible();
  await page.getByTestId("search").fill("やま");
  await expect(page.getByTestId("grid").locator('[data-kanji="山"]')).toBeVisible();
  await page.getByTestId("search").fill("no such thing");
  await expect(page.getByTestId("count")).toHaveText("No kanji here holds that.");
  await expect(page.getByTestId("grid").locator("button")).toHaveCount(0);
  await sound(page, errors);
});

test("speaks Japanese when asked, and back", async ({ page }) => {
  const errors = await open(page);
  await tap(page.locator('[data-lang="ja"]'));
  await expect(page.getByTestId("count")).toHaveText("80字です。");
  await tap(page.locator('[data-lang="en"]'));
  await expect(page.getByTestId("count")).toHaveText("80 kanji.");
  await sound(page, errors);
});
