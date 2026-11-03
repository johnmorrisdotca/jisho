// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and footer,
// with the family's stylesheet, Jisho's own, the page's script and the compiled library beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "jisho";
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white'%3E%E8%BE%9E%3C/text%3E%3C/svg%3E";

const uses = [
  `import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";`,
  `wordsOf(await loadWords("かみ"), "かみ")  // 紙, 神, 髪… with a meaning each; a few kilobytes are fetched`,
  `import { gradeOf, kanjiOfLevel, lookAlikes, readKanji } from "@johnmorrisdotca/jisho";`,
  `gradeOf(GRADES, "語")  // 2, with GRADES from "@johnmorrisdotca/jisho/grades"`,
  `kanjiOfLevel(JLPT, "N5")  // the 79 kanji of N5, with JLPT from "@johnmorrisdotca/jisho/jlpt"`,
  `readKanji(KANJI)  // 2,999 rows, with KANJI from "@johnmorrisdotca/jisho/kanji"`,
  `lookAlikes(LOOK_ALIKE, "土")  // 士 and the rest, with LOOK_ALIKE from "@johnmorrisdotca/jisho/look-alike"`,
];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Jisho 辞書 — Japanese word and kanji data for JavaScript",
      description:
        "Look Japanese words up by reading or written form, and read the school grades, JLPT levels, readings, meanings and look-alike pairs of 2,999 kanji, in a typed package with no dependencies.",
      ogTitle: "Jisho Japanese word and kanji data",
      ogDescription:
        "Type a reading or a word and see what it means, or choose a school grade or a JLPT level and read each kanji.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="jisho.css" />
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
        <div class="fam-row" data-help-en="Look words up, or read the kanji lists." data-help-ja="単語を引くか、漢字のリストを見るかを選びます。">
          <span class="fam-label" id="view-label" data-say="viewLabel"></span>
          <div class="fam-seg" id="view" role="group" aria-labelledby="view-label" data-testid="view"></div>
        </div>
        <div class="fam-row" data-kanji-view data-help-en="Choose a list of kanji: a year of Japanese school, the rest of the everyday kanji, those allowed in names, or a level of the Japanese Language Proficiency Test." data-help-ja="漢字のリストを選びます。学校の学年、そのほかの常用漢字、人名に使える漢字、日本語能力試験のレベルから選べます。">
          <span class="fam-label" id="grades-label" data-say="schoolGrades"></span>
          <div class="fam-seg" id="grades" role="group" aria-labelledby="grades-label" data-testid="grades"></div>
        </div>
        <div class="fam-row" data-kanji-view>
          <span class="fam-label" id="levels-label" data-say="jlptLevels"></span>
          <div class="fam-seg" id="levels" role="group" aria-labelledby="levels-label" data-testid="levels"></div>
        </div>
        <div class="fam-row" data-kanji-view data-help-en="Type a kanji, a reading or a meaning, in English or French." data-help-ja="漢字、読み、または英語かフランス語の意味を入力します。">
          <label class="fam-label" for="search" data-say="searchLabel"></label>
          <input class="jisho-input" id="search" data-testid="search" type="search" autocomplete="off" spellcheck="false">
        </div>
        <p class="fam-muted" id="count" data-testid="count" data-kanji-view aria-live="polite"></p>
      </section>
      <section class="jisho-words-view" id="words-view" data-testid="words-view" aria-labelledby="choose-title" hidden>
        <form class="jisho-word-form" id="word-form" role="search">
          <label class="fam-label" for="word" data-say="wordLabel"></label>
          <input class="jisho-input" id="word" name="word" data-testid="word" type="search" lang="ja" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
          <button class="fam-button" type="submit" data-testid="word-go" data-say="wordGo"></button>
        </form>
        <div class="fam-row" data-help-en="Tap a word to look it up." data-help-ja="単語を押すと、その単語を調べます。">
          <span class="fam-label" id="examples-label" data-say="wordExamples"></span>
          <div class="jisho-examples" id="examples" role="group" aria-labelledby="examples-label" data-testid="examples" lang="ja"></div>
        </div>
        <div class="fam-row" data-help-en="For children, nothing JMdict marks vulgar, X-rated, sensitive or derogatory is fetched or shown. Everything fetches one more file and shows it." data-help-ja="「子ども向け」では、JMdictが下品、性的、配慮が必要、侮辱的と記しているものを、取得も表示もしません。「すべて」では、ファイルをもう一つ取得して、それも表示します。">
          <span class="fam-label" id="audience-label" data-say="audienceLabel"></span>
          <div class="fam-seg" id="audience" role="group" aria-labelledby="audience-label" data-testid="audience"></div>
        </div>
        <p class="fam-muted" id="word-count" data-testid="word-count" aria-live="polite"></p>
        <ul class="jisho-words" id="word-list" data-testid="word-list" aria-labelledby="word-count" tabindex="0"></ul>
        <p class="fam-muted" id="word-release" data-testid="word-release"></p>
      </section>
      <section class="jisho-board" id="kanji-view" aria-labelledby="choose-title">
        <div class="jisho-grid" id="grid" data-testid="grid" lang="ja"></div>
        <article class="fam-panel jisho-card" id="card" data-testid="card" aria-live="polite"></article>
      </section>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="sources-title">
        <h2 id="sources-title" data-say="sourcesTitle"></h2>
        <p data-say="sourceKanjidic" data-testid="source-kanjidic"></p>
        <p data-say="sourceWaller" data-testid="source-waller"></p>
        <p data-say="sourceYencken" data-testid="source-yencken"></p>
        <p data-say="sourceJmdict" data-testid="source-jmdict"></p>
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
writeFileSync("site/api.html", apiPage({ id, name: "Jisho", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
