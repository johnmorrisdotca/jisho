// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The list and the kanji are chosen by address, and the page says when it is ready, so each run takes the same pictures.
import { takePictures } from "./readme-pictures-lib.mjs";

const READY = 'html[data-ready="true"]';
const address = (list, kanji, lang = "en") => `/?lang=${lang}&help=off&list=${list}&kanji=${encodeURIComponent(kanji)}`;

await takePictures({
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
});
