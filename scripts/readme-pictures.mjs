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
    { subject: "school-grade", views: ["desk"], url: address("g2", "語"), ready: READY, target: ".moji-board" },
    { subject: "jlpt-level", views: ["desk"], url: address("N3", "政"), ready: READY, target: ".moji-board" },
    // One kanji in full.
    { subject: "kanji-card", views: ["desk"], url: address("g1", "山"), ready: READY, target: "#card" },
    // 土 and what it can be mistaken for.
    { subject: "look-alike", views: ["desk"], url: address("g1", "土"), ready: READY, target: "#card" },
    // A search by meaning.
    {
      subject: "search",
      views: ["desk"],
      url: address("g1", "山"),
      ready: READY,
      target: ".moji-board",
      async prepare(page) {
        await page.locator("#search").fill("water");
      },
    },
  ],
});
