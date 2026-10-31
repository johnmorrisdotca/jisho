// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and footer,
// with the family's stylesheet, Moji's own, the page's script and the compiled library beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "moji";
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white'%3E%E5%AD%97%3C/text%3E%3C/svg%3E";

const uses = [
  `import { gradeOf, kanjiOfLevel, lookAlikes, readKanji } from "@johnmorrisdotca/moji";`,
  `gradeOf(GRADES, "語")  // 2, with GRADES from "@johnmorrisdotca/moji/grades"`,
  `kanjiOfLevel(JLPT, "N5")  // the 79 kanji of N5, with JLPT from "@johnmorrisdotca/moji/jlpt"`,
  `readKanji(KANJI)  // 2,999 rows, with KANJI from "@johnmorrisdotca/moji/kanji"`,
  `lookAlikes(LOOK_ALIKE, "土")  // 士 and the rest, with LOOK_ALIKE from "@johnmorrisdotca/moji/look-alike"`,
];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Moji 文字 — Kanji data for JavaScript",
      description:
        "School grades, JLPT levels, readings, meanings and look-alike pairs for 2,999 kanji, in a typed package with no dependencies.",
      ogTitle: "Moji kanji data",
      ogDescription:
        "Choose a school grade or a JLPT level, read each kanji, and see which kanji it can be mistaken for.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="moji.css" />
  </head>
  <body>
    <main>
      ${familyHeader({
        id,
        links: [
          { href: "docs/index.html", say: "pageDocs" },
          { href: "api.html", say: "pageApi" },
        ],
      })}
      <section class="setup" aria-labelledby="choose-title">
        <h2 id="choose-title" data-say="chooseTitle"></h2>
        <div class="fam-row" data-help-en="Choose a list of kanji: a year of Japanese school, the rest of the everyday kanji, those allowed in names, or a level of the Japanese Language Proficiency Test." data-help-ja="漢字のリストを選びます。学校の学年、そのほかの常用漢字、人名に使える漢字、日本語能力試験のレベルから選べます。">
          <span class="fam-label" id="grades-label" data-say="schoolGrades"></span>
          <div class="fam-seg" id="grades" role="group" aria-labelledby="grades-label" data-testid="grades"></div>
        </div>
        <div class="fam-row">
          <span class="fam-label" id="levels-label" data-say="jlptLevels"></span>
          <div class="fam-seg" id="levels" role="group" aria-labelledby="levels-label" data-testid="levels"></div>
        </div>
        <div class="fam-row" data-help-en="Type a kanji, a reading or a meaning, in English or French." data-help-ja="漢字、読み、または英語かフランス語の意味を入力します。">
          <label class="fam-label" for="search" data-say="searchLabel"></label>
          <input class="moji-input" id="search" data-testid="search" type="search" autocomplete="off" spellcheck="false">
        </div>
        <p class="fam-muted" id="count" data-testid="count" aria-live="polite"></p>
      </section>
      <section class="moji-board" aria-labelledby="choose-title">
        <div class="moji-grid" id="grid" data-testid="grid" lang="ja"></div>
        <article class="fam-panel moji-card" id="card" data-testid="card" aria-live="polite"></article>
      </section>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="sources-title">
        <h2 id="sources-title" data-say="sourcesTitle"></h2>
        <p data-say="sourceKanjidic" data-testid="source-kanjidic"></p>
        <p data-say="sourceWaller" data-testid="source-waller"></p>
        <p data-say="sourceYencken" data-testid="source-yencken"></p>
      </section>
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escapeHtml(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Moji", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
