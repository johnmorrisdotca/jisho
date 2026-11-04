// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's shared header and footer,
// with the family's stylesheet, Jisho's own, the page's script and the compiled library beside it.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { build } from "esbuild";

import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
import { publishThumbnails, thumbnailHead } from "./family-thumbnail.mjs";

const id = "jisho";
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white'%3E%E8%BE%9E%3C/text%3E%3C/svg%3E";

const uses = [
  `import { findByMeaning, findInflected, loadWords, readText, wordsOf, wordsWithKanji } from "@johnmorrisdotca/jisho/words";`,
  `wordsOf(await loadWords("かみ"), "かみ")  // 紙, 神, 髪… with a meaning each; about 25 kB is fetched`,
  `(await findInflected("食べなかった"))[0]  // 食べる, with the path negative, past`,
  `await readText("私は食べなかった")  // the words of a text, with furigana, meaning and levels; studyList(result) takes them away`,
  `await findByMeaning("water")  // 水 and the commonest words whose meaning holds water`,
  `await wordsWithKanji("山")  // 山, 火山, 登山… the commonest words written with 山`,
  `import { gradeOf, kanjiOfLevel, lookAlikes, readKanji } from "@johnmorrisdotca/jisho";`,
  `gradeOf(GRADES, "語")  // 2, with GRADES from "@johnmorrisdotca/jisho/grades"`,
  `kanjiOfLevel(JLPT, "N5")  // the 79 kanji of N5, with JLPT from "@johnmorrisdotca/jisho/jlpt"`,
  `readKanji(KANJI)  // 2,999 rows, with KANJI from "@johnmorrisdotca/jisho/kanji"`,
  `lookAlikes(LOOK_ALIKE, "土")  // 士 and the rest, with LOOK_ALIKE from "@johnmorrisdotca/jisho/look-alike"`,
];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** What the family's card shows, for a reader who cannot see it (the README's top picture says the same). */
const ALT = "Jisho: the word cards for かみ, which is 紙 paper, 神 god and 髪 hair.";

// The page is demo/index.html; each <!-- family:key --> in it is replaced by the text below.
const pageParts = {
  head: familyHead({
    id,
    title: "Jisho 辞書 — Japanese word and kanji data for JavaScript",
    description:
      "Look Japanese words up by reading, written form, English meaning or a kanji in them, and read the school grades, JLPT levels, readings, meanings and look-alike pairs of 2,999 kanji, in a typed package with no dependencies.",
    ogTitle: "Jisho Japanese word and kanji data",
    ogDescription:
      "Type a reading or a word and see what it means, or choose a school grade or a JLPT level and read each kanji.",
  }),
  thumbnail: thumbnailHead(JSON.parse(readFileSync("package.json", "utf8")), { alt: ALT }),
  icon: ICON,
  header: familyHeader({
    id,
    links: [
      { href: "docs/index.html", say: "pageDocs" },
      { href: "api.html", say: "pageApi" },
    ],
  }),
  unreviewed: familyUnreviewed({ id }),
  uses: uses.map((line) => `<li><code>${escapeHtml(line)}</code></li>`).join("\n          "),
  footer: familyFooter({ id }),
  script: `<script>${FAMILY_SCRIPT}</script>\n    <script type="module" src="kazoku-parts.js"></script>`,
};
const page = readFileSync("demo/index.html", "utf8").replace(
  /<!-- family:([A-Za-z]+) -->/g,
  (_match, key) => pageParts[key],
);
rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
// The family's card, dark card and icon, at <site>/thumbnail.png, thumbnail-dark.png and icon.png.
publishThumbnails(".", "site");
// The family header's language picker and theme switch, as one small module for every page of the site (the demo, the embed page, the API reference and the docs).
await build({
  stdin: {
    contents:
      'import "@johnmorrisdotca/kazoku-ui/language-picker/define";\nimport "@johnmorrisdotca/kazoku-ui/theme-switch/define";\n',
    resolveDir: process.cwd(),
  },
  outfile: "site/kazoku-parts.js",
  bundle: true,
  format: "esm",
  minify: true,
  logLevel: "silent",
});
// The panel for "Put it in your page" (the family's embed panel and the code it writes), bundled into one module beside the demo's script.
await build({
  entryPoints: ["demo/panel.js"],
  outfile: "site/panel.js",
  allowOverwrite: true,
  bundle: true,
  format: "esm",
  minify: true,
  external: ["./dist/*"],
  logLevel: "silent",
});
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Jisho", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
