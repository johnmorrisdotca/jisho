// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The list and the kanji are chosen by address, and the page says when it is ready, so each run takes the same pictures.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = 'html[data-ready="true"]';
const address = (list, kanji, lang = "en") => `/?lang=${lang}&help=off&list=${list}&kanji=${encodeURIComponent(kanji)}`;

// `node scripts/readme-pictures.mjs words-conjugated` takes only the subjects named; the other pictures are left as they are.
const only = process.argv.length > 2 ? process.argv.slice(2) : undefined;

await takePictures({
  only,
  shots: [
    { subject: "hero", views: ["desk", "phone"], url: address("N5", "日"), height: 780, ready: READY },
    // Each list is a grid: a school year, and a level of the JLPT.
    { subject: "school-grade", views: ["desk"], url: address("g2", "語"), ready: READY, target: ".jisho-board" },
    // N3 holds 367 kanji and the grid scrolls: the window ends after ten whole rows, so no row is cut through.
    {
      subject: "jlpt-level",
      views: ["desk"],
      url: address("N3", "政"),
      ready: READY,
      target: ".jisho-board",
      async prepare(page) {
        await page.locator(".jisho-grid").evaluate((grid) => {
          const buttons = [...grid.querySelectorAll("button")];
          const first = buttons[0].getBoundingClientRect().top;
          const second = buttons
            .find((button) => button.getBoundingClientRect().top > first + 1)
            .getBoundingClientRect().top;
          grid.style.maxHeight = `${(second - first) * 10}px`;
        });
      },
    },
    // One kanji in full.
    { subject: "kanji-card", views: ["desk"], url: address("g1", "山"), ready: READY, target: "#card" },
    // 土 and what it can be mistaken for.
    { subject: "look-alike", views: ["desk"], url: address("g1", "土"), ready: READY, target: "#card" },
    // A word by its reading: かみ is paper, god and hair.
    {
      subject: "words",
      views: ["desk"],
      url: "/?lang=en&help=off&view=words&word=%E3%81%8B%E3%81%BF",
      ready: '[data-testid="word-item"]',
      target: "#words-view",
    },
    // A conjugated word found by its dictionary form: 食べなかった is 食べる, negative, past.
    {
      subject: "words-conjugated",
      views: ["desk"],
      url: "/?lang=en&help=off&view=words&word=%E9%A3%9F%E3%81%B9%E3%81%AA%E3%81%8B%E3%81%A3%E3%81%9F",
      ready: '[data-testid="word-item"]',
      target: "#words-view",
    },
    // The words found by their English meaning: water is 水.
    {
      subject: "words-meaning",
      views: ["desk"],
      url: "/?lang=en&help=off&view=words&by=meaning&word=water",
      ready: '[data-testid="word-item"]',
      target: "#words-view",
    },
    // The words written with a kanji, each leading to its kanji.
    {
      subject: "words-kanji",
      views: ["desk"],
      url: "/?lang=en&help=off&view=words&by=kanji&word=%E5%B1%B1",
      ready: '[data-testid="word-item"]',
      target: "#words-view",
    },
    // A search by meaning.
    {
      subject: "search",
      views: ["desk"],
      url: address("g1", "山"),
      ready: READY,
      target: ".jisho-board",
      async prepare(page) {
        await page.locator("#search").fill("water");
      },
    },
  ],
  // The family's thumbnail, dark thumbnail and icon (scripts/family-thumbnail.mjs): the first three words the demo finds
  // for かみ (paper, god and hair), as its word cards; the icon is the kanji card's 山 alone.
  thumbnail: {
    url: "/?lang=en&help=off&view=words&word=%E3%81%8B%E3%81%BF",
    ready: READY,
    target: "#word-list",
    label: "Jisho 辞書",
    async prepare(page, { icon }) {
      if (icon) return;
      await page.locator('[data-testid="word-item"]').first().waitFor();
      await page.locator("#word-list").evaluate((list) => {
        for (const item of [...list.children].slice(3)) item.remove();
        list.style.setProperty("display", "flex", "important");
        list.style.setProperty("width", "max-content", "important");
        for (const item of list.children) item.style.setProperty("width", "236px", "important");
      });
    },
    icon: {
      url: address("g1", "山"),
      target: "#card .jisho-big",
      // The glyph drawn large in the page, so the icon is not a small one blown up.
      prepare: (page) =>
        page.locator("#card .jisho-big").evaluate((big) => big.style.setProperty("font-size", "360px", "important")),
    },
  },
});
