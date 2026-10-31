// The demo page's own script: pick a list, read a kanji, follow a look-alike. The tables are the package's entry points, each
// fetched when the page opens; the functions are its main entry. The list and the kanji are in the address, so a link shares them.
import { GRADES } from "./dist/data/grades.data.js";
import { JLPT } from "./dist/data/jlpt.data.js";
import { KANJI } from "./dist/data/kanji.data.js";
import { LOOK_ALIKE } from "./dist/data/look-alike.data.js";
import {
  JLPT_LEVELS,
  kanjiOfGrade,
  kanjiOfLevel,
  lookAlikes,
  readKanji,
  SCHOOL_GRADES,
  searchKanji,
} from "./dist/index.js";

const $ = (id) => document.getElementById(id);

// The page's own words, in the two languages it speaks. Set as text, never as HTML.
const WORDS = {
  en: {
    pageDocs: "Docs",
    pageApi: "API",
    pitch:
      "School grades, JLPT levels, readings, meanings and look-alike pairs for 2,999 kanji. Choose a list, tap a kanji, and follow it to the kanji it can be mistaken for.",
    name: "Moji (文字) is Japanese for a written character.",
    nameLink: "About the name",
    chooseTitle: "Choose a list",
    schoolGrades: "School",
    jlptLevels: "JLPT",
    searchLabel: "Search",
    grade: "Grade {n}",
    grade8: "Secondary",
    grade9: "Names",
    grade10: "Name variants",
    countList: "{n} kanji.",
    countFound: "{n} kanji hold that.",
    countNone: "No kanji here holds that.",
    cardStrokes: "Strokes",
    cardSchool: "School",
    cardJlpt: "JLPT",
    cardNoLevel: "On no list",
    cardFrequency: "Newspapers",
    cardRank: "No. {n} of the 2,500 commonest",
    cardNoRank: "Not ranked",
    cardOn: "On",
    cardKun: "Kun",
    cardMeanings: "Means",
    cardFrench: "En français",
    cardNone: "None given",
    cardAlike: "Looks like",
    cardNoAlike: "None scored",
    sourcesTitle: "Where this comes from",
    sourceKanjidic:
      "Grades, readings, meanings, strokes and ranks from KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (CC BY-SA 4.0).",
    sourceWaller:
      "JLPT levels from Jonathan Waller's JLPT Resources, tanos.co.uk (CC BY). The test itself has published no list of kanji since 2010, so these are one person's.",
    sourceYencken:
      "Look-alike pairs from Lars Yencken's kanji confusion datasets (CC BY 3.0). They cover the 1,945 everyday kanji of before 2010, so a newer kanji has none.",
    moreTitle: "Using it",
    moreText: "Each table is its own entry point, so a page loads only what it reads.",
    foot: "The code is under the MIT licence; the data keeps its sources' licences. Nothing here is stored or sent anywhere.",
  },
  ja: {
    pageDocs: "ドキュメント",
    pageApi: "API（英語）",
    pitch:
      "2,999字の漢字の学年、JLPTレベル、読み、意味、形の似た漢字の組を収めています。リストを選んで漢字を押すと、見間違えやすい漢字をたどれます。",
    name: "「文字」は、書かれた一字一字のことです。",
    nameLink: "名前について（英語）",
    chooseTitle: "リストを選ぶ",
    schoolGrades: "学年",
    jlptLevels: "JLPT",
    searchLabel: "検索",
    grade: "{n}年",
    grade8: "中学以降",
    grade9: "人名用",
    grade10: "人名用の異体字",
    countList: "{n}字です。",
    countFound: "{n}字が当てはまります。",
    countNone: "当てはまる漢字はありません。",
    cardStrokes: "画数",
    cardSchool: "学年",
    cardJlpt: "JLPT",
    cardNoLevel: "どのリストにもありません",
    cardFrequency: "新聞での頻度",
    cardRank: "よく使う2,500字のうち{n}番目",
    cardNoRank: "順位なし",
    cardOn: "音読み",
    cardKun: "訓読み",
    cardMeanings: "意味（英語）",
    cardFrench: "意味（フランス語）",
    cardNone: "記載なし",
    cardAlike: "似た漢字",
    cardNoAlike: "データなし",
    sourcesTitle: "データの出どころ",
    sourceKanjidic:
      "学年、読み、意味、画数、順位はKANJIDIC2から。Electronic Dictionary Research and Development Groupの所有で、同グループのライセンス（CC BY-SA 4.0）のもとで使っています。",
    sourceWaller:
      "JLPTレベルはJonathan WallerさんのJLPT Resources（tanos.co.uk、CC BY）から。試験そのものは2010年以降、漢字のリストを公開していないので、これは一個人によるリストです。",
    sourceYencken:
      "形の似た漢字の組はLars Yenckenさんのkanji confusionデータ（CC BY 3.0）から。2010年より前の常用漢字1,945字が対象なので、それより新しい漢字にはありません。",
    moreTitle: "使い方",
    moreText: "表はそれぞれ独立したエントリポイントなので、ページは読むものだけを読み込みます。",
    foot: "コードはMITライセンスです。データはそれぞれの出典のライセンスに従います。ここでは何も保存せず、どこにも送りません。",
  },
};

function docsLink(lang) {
  document
    .querySelector('[data-say="pageDocs"]')
    ?.setAttribute("href", lang === "ja" ? "docs/ja/index.html" : "docs/index.html");
}
const language = familyLanguage({
  id: "moji",
  words: WORDS,
  onChange: (lang) => {
    docsLink(lang);
    draw();
  },
});
docsLink(language.lang);
const t = (key, values = {}) => language.word(key).replace(/\{(\w+)\}/g, (_match, name) => String(values[name] ?? ""));

const kanji = readKanji(KANJI);
const byKanji = new Map(kanji.map((one) => [one.kanji, one]));

const query = new URLSearchParams(location.search);
const state = {
  list: query.get("list") ?? "g1",
  kanji: query.get("kanji"),
  search: "",
};

const gradeName = (grade) => (grade <= 6 ? t("grade", { n: grade }) : t(`grade${grade}`));
const listed = () =>
  state.list.startsWith("g") ? kanjiOfGrade(GRADES, Number(state.list.slice(1))) : kanjiOfLevel(JLPT, state.list);

function writeAddress() {
  const next = new URLSearchParams(location.search);
  next.set("list", state.list);
  if (state.kanji === null) next.delete("kanji");
  else next.set("kanji", state.kanji);
  history.replaceState(history.state, "", `${location.pathname}?${next}${location.hash}`);
}

function segment(holder, items) {
  if (holder.childElementCount === 0) {
    holder.append(
      ...items.map(({ id }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.list = id;
        button.addEventListener("click", () => {
          state.list = id;
          state.search = "";
          $("search").value = "";
          state.kanji = null;
          draw();
        });
        return button;
      }),
    );
  }
  items.forEach(({ id, label }, at) => {
    const button = holder.children[at];
    button.textContent = label;
    button.setAttribute("aria-pressed", String(state.search === "" && state.list === id));
  });
}

function fact(list, term, value) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  if (typeof value === "string") dd.textContent = value;
  else dd.append(value);
  list.append(dt, dd);
}

function drawCard() {
  const card = $("card");
  const one = state.kanji === null ? undefined : byKanji.get(state.kanji);
  if (one === undefined) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  const big = document.createElement("p");
  big.className = "moji-big";
  big.lang = "ja";
  big.textContent = one.kanji;
  const facts = document.createElement("dl");
  const join = (items) => (items.length === 0 ? t("cardNone") : items.join("、"));
  fact(facts, t("cardStrokes"), String(one.strokes));
  fact(facts, t("cardSchool"), gradeName(one.grade));
  fact(facts, t("cardJlpt"), one.level ?? t("cardNoLevel"));
  fact(facts, t("cardFrequency"), one.frequency === null ? t("cardNoRank") : t("cardRank", { n: one.frequency }));
  fact(facts, t("cardOn"), join(one.on));
  fact(facts, t("cardKun"), join(one.kun));
  fact(facts, t("cardMeanings"), one.meanings.length === 0 ? t("cardNone") : one.meanings.join(", "));
  if (one.meaningsFr.length > 0) fact(facts, t("cardFrench"), one.meaningsFr.join(", "));
  const alike = lookAlikes(LOOK_ALIKE, one.kanji);
  if (alike.length === 0) fact(facts, t("cardAlike"), t("cardNoAlike"));
  else {
    const row = document.createElement("div");
    row.className = "moji-alike";
    row.lang = "ja";
    row.dataset.testid = "alike";
    for (const other of alike) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = other.kanji;
      button.addEventListener("click", () => {
        state.kanji = other.kanji;
        draw();
      });
      row.append(button);
    }
    fact(facts, t("cardAlike"), row);
  }
  card.replaceChildren(big, facts);
}

function draw() {
  segment(
    $("grades"),
    SCHOOL_GRADES.map((grade) => ({ id: `g${grade}`, label: gradeName(grade) })),
  );
  segment(
    $("levels"),
    JLPT_LEVELS.map((level) => ({ id: level, label: level })),
  );
  const found = state.search === "" ? null : searchKanji(kanji, state.search);
  const shown = found === null ? listed() : found.map((one) => one.kanji);
  $("count").textContent =
    found === null
      ? t("countList", { n: shown.length })
      : shown.length === 0
        ? t("countNone")
        : t("countFound", { n: shown.length });
  const grid = $("grid");
  if (grid.dataset.shown !== shown.join("")) {
    grid.dataset.shown = shown.join("");
    grid.replaceChildren(
      ...shown.map((character) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = character;
        button.dataset.kanji = character;
        button.addEventListener("click", () => {
          state.kanji = character;
          draw();
        });
        return button;
      }),
    );
  }
  for (const button of grid.children) button.setAttribute("aria-pressed", String(button.dataset.kanji === state.kanji));
  drawCard();
  writeAddress();
}

$("search").addEventListener("input", (event) => {
  state.search = event.target.value;
  draw();
});

draw();
document.documentElement.dataset.ready = "true";
