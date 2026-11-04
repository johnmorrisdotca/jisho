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
        ".jisho-grid button, .jisho-token, .jisho-alike button, .jisho-examples button, .jisho-word-form button, .jisho-word-kanji button, .jisho-card dd button, .fam-seg button, input",
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
  await tap(page.locator('kazoku-language-picker [data-v="ja"]'));
  await expect(page.getByTestId("count")).toHaveText("80字です。");
  await tap(page.locator('kazoku-language-picker [data-v="en"]'));
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
  await expect(page.getByTestId("word-count")).toHaveText("Type a reading in kana or romaji, or a word in kanji.");
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

test("a conjugated word finds its dictionary form and the path: 食べなかった is 食べる, negative, past", async ({
  page,
}) => {
  const errors = await open(page, "?lang=en&view=words");
  await lookUp(page, "食べなかった");
  await expect(first(page)).toContainText("食べる");
  await expect(first(page)).toContainText("eat");
  await expect(first(page).getByTestId("word-path")).toHaveText("from 食べる: negative, past");
  await lookUp(page, "高くなかったです");
  await expect(first(page)).toContainText("高い");
  await expect(first(page).getByTestId("word-path")).toHaveText("from 高い: negative, past, polite");
  await lookUp(page, "紙");
  await expect(page.getByTestId("word-path")).toHaveCount(0);
  await tap(page.locator('kazoku-language-picker [data-v="ja"]'));
  await lookUp(page, "食べなかった");
  await expect(first(page).getByTestId("word-path")).toHaveText("食べるから：否定、過去");
  await tap(page.locator('kazoku-language-picker [data-v="en"]'));
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

test("safe mode, the default, leaves out the senses that are not for it, and Unfiltered puts them back with their marks", async ({
  page,
}) => {
  const errors = await open(page, "?lang=en&view=words&word=外人");
  await expect(page.getByTestId("word-count")).toHaveText("2 words for 外人.");
  await expect(first(page)).toContainText("outsider");
  await expect(first(page)).not.toContainText("Westerner");
  await tap(page.getByTestId("audience").getByRole("button", { name: "Unfiltered" }));
  await expect(first(page)).toContainText("Westerner");
  await expect(first(page).getByTestId("word-marks")).toContainText("sens");
  await expect(page).toHaveURL(/mode=unfiltered/);
  await tap(page.getByTestId("audience").getByRole("button", { name: "Safe" }));
  await expect(first(page)).not.toContainText("Westerner");
  await expect(page).not.toHaveURL(/mode=unfiltered/);
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
  await tap(page.getByTestId("audience").getByRole("button", { name: "Unfiltered" }));
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
    // The picture in "Put it in your page" is a framed page that asks for its own pieces: only the demo's own requests count.
    if (request.frame() !== page.mainFrame()) return;
    const { pathname } = new URL(request.url());
    if (/\/dist\/(?:words|data\/words\/)/.test(pathname)) asked.push(pathname.slice(pathname.lastIndexOf("/") + 1));
  });
  return asked;
}
/** The files that hold what safe mode leaves out: their manifest, their pieces, and the common words' patch. */
const isExtra = (name) =>
  /^(?:extra-manifest|index-extra-manifest|common-extra)\.data\./.test(name) || /^x[rfmk]\d+\.data\./.test(name);
/** The files of the indexes by meaning and by kanji: only a lookup by meaning or by kanji asks for them. */
const isIndex = (name) =>
  /^(?:index-manifest|index-extra-manifest)\.data\./.test(name) || /^x?[mk]\d+\.data\./.test(name);

test("a safe lookup asks for none of the files that hold what safe mode leaves out, and Unfiltered asks for them", async ({
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
  expect(asked.filter(isExtra), "a file of what safe mode leaves out was asked for").toEqual([]);
  expect(asked.filter(isIndex), "a lookup by reading asked for an index").toEqual([]);
  await tap(page.getByTestId("audience").getByRole("button", { name: "Unfiltered" }));
  await expect(first(page)).toContainText("omit");
  const extra = asked.filter(isExtra);
  expect(extra, "Unfiltered asks for the manifest of the extra pieces and a piece of them").toContain(
    "extra-manifest.data.js",
  );
  expect(extra.length, "and for no more than a manifest and a piece for each of the two kinds").toBeLessThanOrEqual(3);
  await sound(page, errors);
});

test("a safe lookup is not given the files when the page opens on a word, either", async ({ page }) => {
  const asked = watch(page);
  const errors = await open(page, "?lang=en&view=words&word=外人");
  await expect(first(page)).toContainText("outsider");
  expect(asked.filter(isExtra)).toEqual([]);
  await sound(page, errors);
});

test("the words speak Japanese when asked, and the way back to the kanji works", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words&word=紙");
  await expect(first(page)).toContainText("paper");
  await tap(page.locator('kazoku-language-picker [data-v="ja"]'));
  await expect(page.getByTestId("word-count")).toContainText("単語は");
  await expect(page.getByTestId("view").getByRole("button", { name: "単語" })).toHaveAttribute("aria-pressed", "true");
  await tap(page.getByTestId("view").getByRole("button", { name: "漢字" }));
  await expect(page.getByTestId("grid").locator("button")).toHaveCount(80);
  await expect(page.getByTestId("words-view")).toBeHidden();
  await expect(page).not.toHaveURL(/view=words/);
  await tap(page.locator('kazoku-language-picker [data-v="en"]'));
  await expect(page.getByTestId("count")).toHaveText("80 kanji.");
  await sound(page, errors);
});

const by = (page, name) => tap(page.getByTestId("by").getByRole("button", { name }));

test("an English meaning finds the commonest words that hold it: water is 水", async ({ page }) => {
  const asked = watch(page);
  const errors = await open(page, "?lang=en&view=words");
  await expect(page.getByTestId("by").getByRole("button", { name: "Reading or word" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await by(page, "English meaning");
  await expect(page.getByTestId("word-count")).toHaveText("Type an English word or two, such as water or go out.");
  await lookUp(page, "water");
  await expect(first(page)).toContainText("水");
  await expect(first(page)).toContainText("water");
  await expect(page.getByTestId("word-count")).toContainText("for water.");
  await expect(page).toHaveURL(/by=meaning/);
  await tap(page.getByTestId("examples").getByRole("button", { name: "go out" }));
  await expect(page.getByTestId("word-count")).toContainText("for go out.");
  await expect(page.getByTestId("word")).toHaveValue("go out");
  expect(asked.filter(isExtra), "safe mode asked for what it leaves out").toEqual([]);
  expect(asked.filter(isIndex).length, "the index was asked for").toBeGreaterThan(1);
  await sound(page, errors);
});

test("an English meaning in Unfiltered finds what safe mode leaves out, and says so when it has nothing", async ({
  page,
}) => {
  const errors = await open(page, "?lang=en&view=words&by=meaning&word=cunnilingus");
  await expect(page.getByTestId("word-count")).toContainText("cunnilingus");
  await expect(page.getByTestId("word-list")).not.toContainText("harmonica");
  await tap(page.getByTestId("audience").getByRole("button", { name: "Unfiltered" }));
  await expect(page.getByTestId("word-list")).toContainText("ハーモニカ");
  await lookUp(page, "zxqvwj");
  await expect(page.getByTestId("word-count")).toHaveText("JMdict has no word for zxqvwj.");
  await sound(page, errors);
});

test("a kanji finds the words written with it, and a word leads to its kanji and back", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words");
  await by(page, "Kanji in it");
  await tap(page.getByTestId("examples").getByRole("button", { name: "山" }));
  await expect(first(page)).toContainText("山");
  await expect(first(page)).toContainText("mountain");
  await expect(page).toHaveURL(/by=kanji/);
  await tap(first(page).getByTestId("word-kanji").getByRole("button", { name: "Open the kanji 山" }));
  await expect(page.getByTestId("words-view")).toBeHidden();
  await expect(page.locator(".jisho-big")).toHaveText("山");
  await expect(page.getByTestId("card")).toContainText("N5");
  await tap(page.getByTestId("card-words"));
  await expect(page.getByTestId("words-view")).toBeVisible();
  await expect(page.getByTestId("word")).toHaveValue("山");
  await expect(first(page)).toContainText("山");
  await lookUp(page, "やま");
  await expect(page.getByTestId("word-count")).toHaveText("There is no kanji in やま to look up.");
  await sound(page, errors);
});

test("Latin letters are read as romaji", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words");
  await lookUp(page, "kami");
  await expect(first(page)).toContainText("紙");
  await lookUp(page, "Tōkyō");
  await expect(first(page)).toContainText("東京");
  await sound(page, errors);
});

test("the ways to find words speak Japanese when asked", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=words&by=meaning");
  await tap(page.locator('kazoku-language-picker [data-v="ja"]'));
  await expect(page.getByTestId("by").getByRole("button", { name: "英語の意味" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("word-count")).toContainText("英語の単語");
  await tap(page.locator('kazoku-language-picker [data-v="en"]'));
  await sound(page, errors);
});

test("the Reader cuts a text into words with furigana, and a tap on a word opens its card", async ({ page }) => {
  const asked = watch(page);
  const errors = await open(page, "?lang=en&view=reader");
  await expect(page.getByTestId("reader-view")).toBeVisible();
  await expect(page.getByTestId("grid")).toBeHidden();
  await expect(page.getByTestId("reader-count")).toHaveText("Paste a sentence or a few, and tap Read.");
  await tap(page.getByTestId("reader-examples").getByRole("button").first());
  await expect(page.getByTestId("reader-count")).toContainText("words, 0 not found.");
  await expect(page.getByTestId("reader-text")).toHaveValue("昨日、友達と学校に行きました。");
  await expect(page.getByTestId("token")).toHaveCount(6);
  await expect(page.getByTestId("reader-out").locator("rt").first()).toHaveText("きのう");
  await tap(page.getByTestId("token").nth(5));
  const card = page.getByTestId("reader-card");
  await expect(card).toContainText("to go");
  await expect(card).toContainText("from 行く: polite, past");
  await expect(card).toContainText("N5");
  await expect(card.locator("rt")).toHaveText(["い"]);
  await expect(page).toHaveURL(/view=reader/);
  expect(asked.filter(isExtra), "safe mode asked for what it leaves out").toEqual([]);
  expect(asked.length, "the pieces a sentence needs").toBeLessThan(60);
  await sound(page, errors);
});

test("the Reader lists what it cannot find, keeps what is not Japanese, and says nothing is wrong with an empty text", async ({
  page,
}) => {
  const errors = await open(page, "?lang=en&view=reader");
  await page.getByTestId("reader-text").fill("私は ぬぬぬぬぬ を 3 回食べた。");
  await tap(page.getByTestId("reader-go"));
  await expect(page.getByTestId("reader-unknown")).toHaveText("Not found: ぬぬぬぬぬ");
  await expect(page.getByTestId("unknown")).toHaveText("ぬぬぬぬぬ");
  await expect(page.getByTestId("reader-out")).toContainText("3");
  await page.getByTestId("reader-text").fill("");
  await tap(page.getByTestId("reader-go"));
  await expect(page.getByTestId("reader-count")).toHaveText("Paste a sentence or a few, and tap Read.");
  await page.getByTestId("reader-text").fill("   ");
  await tap(page.getByTestId("reader-go"));
  await expect(page.getByTestId("reader-count")).toHaveText("Paste a sentence or a few, and tap Read.");
  await sound(page, errors);
});

test("the study list holds each word once, copies as text, and saves as CSV", async ({ page }) => {
  const errors = await open(page, "?lang=en&view=reader");
  try {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  } catch {
    // WebKit has no such permission: the copy then says it could not.
  }
  await page.getByTestId("reader-text").fill("私は食べなかった。私は食べた。");
  await tap(page.getByTestId("reader-go"));
  await expect(page.getByTestId("study-item")).toHaveCount(3);
  await expect(page.getByTestId("study-item").nth(2)).toContainText("食べる");
  await expect(page.getByTestId("study-item").nth(2)).toContainText("×2");
  await tap(page.getByTestId("reader-kanji-only"));
  await expect(page.getByTestId("study-item")).toHaveCount(2);
  await tap(page.getByTestId("reader-copy"));
  await expect(page.getByTestId("reader-copied")).toHaveText(/Copied 2 words\.|Could not copy/);
  const [download] = await Promise.all([page.waitForEvent("download"), tap(page.getByTestId("reader-csv"))]);
  expect(download.suggestedFilename()).toBe("jisho-study-list.csv");
  const body = readFileSync(await download.path(), "utf8");
  expect(body).toContain("written,reading,meaning,level,grade,count,example");
  expect(body).toContain("食べる,たべる,");
  await sound(page, errors);
});

test("the Reader speaks Japanese when asked, and a text in the address is read when the page opens", async ({
  page,
}) => {
  const errors = await open(page, "?lang=en&view=reader&text=%E9%A3%9F%E3%81%B9%E3%81%AA%E3%81%8B%E3%81%A3%E3%81%9F");
  await expect(page.getByTestId("token")).toHaveCount(1);
  await expect(page.getByTestId("reader-card")).toContainText("from 食べる: negative, past");
  await tap(page.locator('kazoku-language-picker [data-v="ja"]'));
  await expect(page.getByTestId("reader-card")).toContainText("食べるから：否定、過去");
  await expect(page.getByTestId("reader-count")).toContainText("1語");
  await expect(page.getByTestId("view").getByRole("button", { name: "リーダー" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await tap(page.locator('kazoku-language-picker [data-v="en"]'));
  await sound(page, errors);
});
