// "Put it in your page" (the family's <kazoku-embed-panel>): what to look up, seven ways a page is made, three widths, a picture that is the embed page, Copy, the embed page, the docs and the credit.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
};

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

test("the code follows what is looked up, for each way a page is made, and the choices are kept in the address", async ({
  page,
}) => {
  const errors = await open(page);
  const panel = page.locator("#embed-panel");
  const code = panel.locator('[part="code"]');
  await expect(code).toContainText("loadWords");
  await expect(code).toContainText('"かみ"');
  await page.locator('[data-testid="embed-what"] [data-value="meaning"]').click();
  await expect(page.locator("#embed-text")).toHaveValue("water");
  await expect(code).toContainText("findByMeaning");
  await page.locator('[data-testid="embed-limit"] [data-value="10"]').click();
  await expect(code).toContainText("limit: 10");
  await page.locator('[data-testid="embed-audience"] [data-value="unfiltered"]').click();
  await expect(code).toContainText('mode: "unfiltered"');
  await page.locator("#embed-text").fill("fire");
  await expect(code).toContainText('"fire"');
  await expect(page).toHaveURL(/lookup=meaning/);
  await expect(page).toHaveURL(/for=fire/);
  await page.locator('[data-testid="embed-what"] [data-value="kanji"]').click();
  await expect(code).toContainText("readKanji(KANJI)");
  await expect(page.locator("[data-embed-words]").first()).toBeHidden();
  for (const [kind, needle] of [
    ["module", 'from "@johnmorrisdotca/jisho"'],
    ["react", "useEffect"],
    ["vue", "watchEffect"],
    ["angular", "standalone: true"],
    ["svelte", "$effect"],
    ["iframe", "embed.html?kanji=%E5%B1%B1"],
  ]) {
    await panel.locator(`button[data-kind="${kind}"]`).click();
    await expect(code, kind).toContainText(needle);
  }
  await expect(page).toHaveURL(/embed=iframe/);
  await panel.locator('button[data-size="480"]').click();
  await expect(code).toContainText('width="480"');
  await expect(code).toContainText('height="560"');
  expect(errors).toEqual([]);
});

test("nothing the page had is lost and the panel is whole: seven tabs, three widths, what to look up, the picture, Copy, the embed page, the docs and the credit", async ({
  page,
}) => {
  await open(page, "?lang=en&lookup=word&for=%E3%81%8B%E3%81%BF");
  const panel = page.locator("#embed-panel");
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.locator('[role="tab"]')).toHaveText([
    "HTML",
    "ES module",
    "React",
    "Vue",
    "Angular",
    "Svelte",
    "iframe",
  ]);
  await expect(panel.locator('[part="size-button"]')).toHaveText(["280", "360", "480"]);
  await expect(panel.locator('[part="size-button"][aria-pressed="true"]')).toHaveText("360");
  await expect(page.locator('[data-testid="embed-what"] button')).toHaveText([
    "A reading or a word",
    "An English meaning",
    "A kanji",
  ]);
  await expect(page.locator('[data-testid="embed-limit"] button')).toHaveText(["3", "5", "10"]);
  await expect(page.locator('[data-testid="embed-audience"] button')).toHaveText(["Safe", "Unfiltered"]);
  await expect(panel.locator('[part="preview"] iframe')).toHaveAttribute(
    "src",
    /^embed\.html\?word=%E3%81%8B%E3%81%BF/,
  );
  await expect(panel.locator('[part="copy"]')).toHaveText("Copy code");
  await expect(panel.locator('[part="open"]')).toHaveAttribute("href", /^embed\.html\?word=%E3%81%8B%E3%81%BF/);
  await expect(panel.locator('[part="docs"]')).toHaveAttribute("href", "docs/index.html");
  await expect(panel.locator('[part="credits"]')).toContainText("JMdict");
  await page.locator('[data-testid="embed-what"] [data-value="kanji"]').click();
  await expect(panel.locator('[part="credits"]')).toContainText("KANJIDIC2");
});

test("the Japanese page says it in Japanese, and the picture is the embed page in the page's language", async ({
  page,
}) => {
  await open(page, "?lang=ja");
  const panel = page.locator("#embed-panel");
  await panel.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-testid="embed-what"] button').first()).toHaveText("読みか単語");
  await expect(panel.locator('[part="docs"]')).toHaveAttribute("href", "docs/ja/index.html");
  await expect(panel.locator('[part="preview"] iframe')).toHaveAttribute("src", /lang=ja/);
  await expect(panel.locator('[part="credits"]')).toContainText("単語はJMdict");
});

test("the picture, which asks for the dictionary's pieces, waits until the panel is on screen", async ({ page }) => {
  const asked = [];
  page.on("request", (request) => {
    if (request.frame() !== page.mainFrame() && /embed\.html/.test(request.url())) asked.push(request.url());
  });
  await open(page, "?lang=en");
  await expect(page.locator('#embed-panel [part="preview"] iframe')).toHaveAttribute("data-src", /embed\.html/);
  expect(asked, "no frame asked before the panel was seen").toEqual([]);
  await page.locator("#embed-panel").scrollIntoViewIfNeeded();
  await expect(page.locator('#embed-panel [part="preview"] iframe')).toHaveAttribute("src", /embed\.html\?word=/);
});
