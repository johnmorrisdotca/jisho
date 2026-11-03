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
  await page.route("http://jisho.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({
      body: readFileSync(file),
      contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream",
    });
  });
  await page.goto(`http://jisho.test/${address}`);
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
    [
      ...document.querySelectorAll(
        ".jisho-grid button, .jisho-alike button, .jisho-examples button, .jisho-word-form button, .fam-seg button, input",
      ),
    ]
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
  await expect(page.getByTestId("source-jmdict")).toContainText("JMdict");
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
  await expect(page.locator(".jisho-big")).toHaveText("士");
  await tap(alike.getByRole("button", { name: "土" }));
  await expect(page.locator(".jisho-big")).toHaveText("土");
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

/** Opens the words, types something and presses Enter, as a person does. */
async function lookUp(page, text) {
  const box = page.getByTestId("word");
  await box.fill(text);
  await box.press("Enter");
}

const first = (page) => page.getByTestId("word-item").first();

test("a reading finds its words, the commonest first: かみ is paper, god and hair", async ({ page }) => {
  const errors = await open(page);
  await tap(page.getByTestId("view").getByRole("button", { name: "Words" }));
  await expect(page.getByTestId("words-view")).toBeVisible();
  await expect(page.getByTestId("grid")).toBeHidden();
  await expect(page.getByTestId("word-count")).toHaveText("Type a reading in kana, or a word in kanji.");
  await lookUp(page, "かみ");
  await expect(page.getByTestId("word-count")).toContainText("words for かみ.");
  const items = page.getByTestId("word-item");
  await expect(items.nth(0)).toContainText("紙");
  await expect(items.nth(0)).toContainText("paper");
  await expect(items.nth(0)).toContainText("common");
  await expect(items.nth(1)).toContainText("神");
  await expect(items.nth(1)).toContainText("god");
  await expect(items.nth(2)).toContainText("髪");
  await expect(items.nth(2)).toContainText("hair");
  await expect(page).toHaveURL(/view=words/);
  await expect(page).toHaveURL(/word=%E3%81%8B%E3%81%BF/);
  await expect(page.getByTestId("word-release")).toContainText("JMdict release 20");
  await sound(page, errors);
});

test("a written form finds its reading: 紙 is かみ, and katakana finds what hiragana does", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words");
  await lookUp(page, "紙");
  await expect(first(page)).toContainText("かみ");
  await expect(first(page)).toContainText("paper");
  await lookUp(page, "カミ");
  await expect(page.getByTestId("word-count")).toContainText("カミ");
  await expect(first(page)).toContainText("紙");
  await sound(page, errors);
});

test("an example is a button that looks the word up", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words");
  await tap(page.getByTestId("examples").getByRole("button", { name: "さくら" }));
  await expect(page.getByTestId("word-count")).toContainText("for さくら.");
  await expect(page.getByTestId("word")).toHaveValue("さくら");
  await expect(first(page)).toContainText("cherry");
  await sound(page, errors);
});

test("for children leaves out the senses that are not, and Everything puts them back", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words&word=外人");
  await expect(page.getByTestId("word-count")).toHaveText("2 words for 外人.");
  await expect(first(page)).toContainText("outsider");
  await expect(first(page)).not.toContainText("Westerner");
  await tap(page.getByTestId("audience").getByRole("button", { name: "Everything" }));
  await expect(first(page)).toContainText("Westerner");
  await expect(page).toHaveURL(/children=off/);
  await tap(page.getByTestId("audience").getByRole("button", { name: "Children" }));
  await expect(first(page)).not.toContainText("Westerner");
  await expect(page).not.toHaveURL(/children=off/);
  await sound(page, errors);
});

test("says so, and does not make a word up, when there is nothing to show", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words");
  await lookUp(page, "ぬぬぬぬぬ");
  await expect(page.getByTestId("word-count")).toHaveText("No word to show for ぬぬぬぬぬ.");
  await expect(page.getByTestId("word-item")).toHaveCount(0);
  await lookUp(page, "チンピラ");
  await expect(page.getByTestId("word-count")).toHaveText("No word to show for チンピラ.");
  await expect(page.getByTestId("word-item")).toHaveCount(0);
  await tap(page.getByTestId("audience").getByRole("button", { name: "Everything" }));
  await expect(first(page)).toContainText("hoodlum");
  await expect(page.getByTestId("word-count")).toHaveText("2 words for チンピラ.");
  await lookUp(page, "ぬぬぬぬぬ");
  await expect(page.getByTestId("word-count")).toHaveText("JMdict has no word for ぬぬぬぬぬ.");
  await sound(page, errors);
});

/** The addresses of every piece of the words a page asks for, as they are asked. */
function watch(page) {
  const asked = [];
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (/\/dist\/(?:words|data\/words\/)/.test(pathname)) asked.push(pathname.slice(pathname.lastIndexOf("/") + 1));
  });
  return asked;
}
const isExtra = (name) => /^(?:common-)?extra\.data\./.test(name) || /^common-extra\.data\./.test(name);

test("a lookup for children asks for none of the files that hold what is not, and Everything asks for them", async ({
  page,
}) => {
  const asked = watch(page);
  const errors = await open(page, "?lang=en&view=words");
  for (const text of ["かみ", "外人", "チンピラ", "ほもびでお", "吐かす"]) {
    await lookUp(page, text);
    await expect(page.getByTestId("word-count")).toContainText(text);
    await expect(page.getByTestId("word-count")).not.toContainText("Looking");
  }
  await expect(page.getByTestId("word-item")).toHaveCount(0);
  expect(asked.length, "the pieces of the words were asked for").toBeGreaterThan(3);
  expect(asked.filter(isExtra), "a file of what is not for children was asked for").toEqual([]);
  await tap(page.getByTestId("audience").getByRole("button", { name: "Everything" }));
  await expect(first(page)).toContainText("omit");
  expect(asked.filter(isExtra), "Everything asks for the extra file").toEqual(["extra.data.js"]);
  await sound(page, errors);
});

test("a lookup for children is not given the file when the page opens on a word, either", async ({ page }) => {
  const asked = watch(page);
  const errors = await open(page, "?lang=en&view=words&word=外人");
  await expect(first(page)).toContainText("outsider");
  expect(asked.filter(isExtra)).toEqual([]);
  await sound(page, errors);
});

test("the words speak Japanese when asked, and the way back to the kanji works", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words&word=紙");
  await expect(first(page)).toContainText("paper");
  await tap(page.locator('[data-lang="ja"]'));
  await expect(page.getByTestId("word-count")).toContainText("単語は");
  await expect(page.getByTestId("view").getByRole("button", { name: "単語" })).toHaveAttribute("aria-pressed", "true");
  await tap(page.getByTestId("view").getByRole("button", { name: "漢字" }));
  await expect(page.getByTestId("grid").locator("button")).toHaveCount(80);
  await expect(page.getByTestId("words-view")).toBeHidden();
  await expect(page).not.toHaveURL(/view=words/);
  await tap(page.locator('[data-lang="en"]'));
  await expect(page.getByTestId("count")).toHaveText("80 kanji.");
  await sound(page, errors);
});
