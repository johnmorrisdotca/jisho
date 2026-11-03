// The demo page's own script: look a word up by its reading, its English meaning or a kanji in it, or pick a list, read a kanji and follow a look-alike. The kanji tables are the
// package's entry points, each fetched when the page opens; the words are fetched about 25 kB at a time, as they are asked for.
// What is shown is in the address, so a link shares it.
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
import { findByMeaning, kanjiOfWord, loadWords, wordsOf, wordsWithKanji } from "./dist/words.js";

const $ = (id) => document.getElementById(id);

// The page's own words, in the two languages it speaks. Set as text, never as HTML.
const WORDS = {
  en: {
    pageDocs: "Docs",
    pageApi: "API",
    pitch:
      "Look Japanese words up by reading, written form, English meaning or a kanji in them, with a short English meaning each. Or choose a list of the 2,999 kanji, tap one, and follow it to the kanji it can be mistaken for.",
    name: "Jisho (辞書) is Japanese for a dictionary.",
    nameLink: "About the name",
    chooseTitle: "What to look up",
    viewLabel: "Look up",
    viewKanji: "Kanji",
    viewWords: "Words",
    wordLabel: "Word",
    wordGo: "Look up",
    byLabel: "Find by",
    byReading: "Reading or word",
    byMeaning: "English meaning",
    byKanji: "Kanji in it",
    byHelp:
      "Reading or word: kana, romaji or kanji. English meaning: the commonest words whose meaning holds what you type. Kanji in it: the words written with a kanji.",
    wordKanjiOpen: "Open the kanji {kanji}",
    wordNoKanji: "There is no kanji in {text} to look up.",
    cardWords: "Words",
    cardWordsButton: "Words with {kanji}",
    wordExamples: "Try",
    audienceLabel: "Mode",
    audienceSafe: "Safe",
    audienceUnfiltered: "Unfiltered",
    wordCountOne: "1 word for {text}.",
    wordCountMany: "{n} words for {text}.",
    wordNone: "JMdict has no word for {text}.",
    wordNoneSafe: "No word to show for {text}.",
    wordLoading: "Looking up {text}…",
    wordFailed: "Could not look {text} up. Try again.",
    wordCommon: "common",
    wordReadAs: "read",
    wordPrompt: "Type a reading in kana or romaji, or a word in kanji.",
    wordPromptMeaning: "Type an English word or two, such as water or go out.",
    wordPromptKanji: "Type a kanji to see the words written with it.",
    wordRelease: "JMdict release {release}.",
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
    sourceJmdict:
      "Words from JMdict, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (CC BY-SA 4.0).",
    moreTitle: "Using it",
    moreText:
      "Each table is its own entry point, so a page loads only what it reads. Words are fetched in pieces of about 25 kB gzipped, only the ones a lookup needs.",
    foot: "The code is under the MIT licence; the data keeps its sources' licences. Nothing here is stored or sent anywhere.",
  },
  ja: {
    pageDocs: "ドキュメント",
    pageApi: "API（英語）",
    pitch:
      "日本語の単語を読み、表記、英語の意味、含まれる漢字から引け、それぞれに短い英語の意味が付きます。2,999字の漢字のリストを選び、漢字を押して、見間違えやすい漢字をたどることもできます。",
    name: "「Jisho」は「辞書」のローマ字表記です。日本語の単語と漢字を収めています。",
    nameLink: "名前について（英語）",
    chooseTitle: "調べるもの",
    viewLabel: "表示",
    viewKanji: "漢字",
    viewWords: "単語",
    wordLabel: "単語",
    wordGo: "調べる",
    byLabel: "検索方法",
    byReading: "読みか単語",
    byMeaning: "英語の意味",
    byKanji: "含まれる漢字",
    byHelp:
      "読みか単語：かな、ローマ字、漢字で引きます。英語の意味：入力した語を意味に含む、よく使う単語を探します。含まれる漢字：その漢字で書かれる単語を探します。",
    wordKanjiOpen: "漢字「{kanji}」を開く",
    wordNoKanji: "「{text}」には漢字が含まれていません。",
    cardWords: "単語",
    cardWordsButton: "「{kanji}」を含む単語",
    wordExamples: "例",
    audienceLabel: "モード",
    audienceSafe: "セーフ",
    audienceUnfiltered: "フィルターなし",
    wordCountOne: "「{text}」の単語は1語見つかりました。",
    wordCountMany: "「{text}」の単語は{n}語見つかりました。",
    wordNone: "JMdictに「{text}」の単語はありません。",
    wordNoneSafe: "「{text}」について表示できる単語はありません。",
    wordLoading: "「{text}」を調べています…",
    wordFailed: "「{text}」を調べられませんでした。もう一度お試しください。",
    wordCommon: "よく使う",
    wordReadAs: "読み",
    wordPrompt: "読みをかなやローマ字で、または単語を漢字で入力してください。",
    wordPromptMeaning: "英語の単語を一つか二つ入力してください（例：water、go out）。",
    wordPromptKanji: "漢字を入力すると、その漢字を含む単語を表示します。",
    wordRelease: "JMdictの{release}版です。",
    schoolGrades: "学年",
    jlptLevels: "JLPT",
    searchLabel: "検索",
    grade: "{n}年",
    grade8: "中学以降",
    grade9: "人名用",
    grade10: "人名用の異体字",
    countList: "{n}字です。",
    countFound: "{n}字が見つかりました。",
    countNone: "見つかった漢字はありません。",
    cardStrokes: "画数",
    cardSchool: "学年",
    cardJlpt: "JLPT",
    cardNoLevel: "どのリストにもありません",
    cardFrequency: "新聞での頻度",
    cardRank: "よく使う2,500字のうち{n}位",
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
      "学年、読み、意味、画数、順位はKANJIDIC2から。KANJIDIC2はElectronic Dictionary Research and Development Groupの所有物で、同グループのライセンス（CC BY-SA 4.0）のもとで使っています。",
    sourceWaller:
      "JLPTレベルはJonathan WallerのJLPT Resources（tanos.co.uk、CC BY）から。試験そのものは2010年以降、漢字のリストを公開していないので、これは一個人によるリストです。",
    sourceYencken:
      "形の似た漢字の組はLars Yenckenのkanji confusionデータ（CC BY 3.0）から。2010年より前の常用漢字1,945字が対象なので、2010年以降に加わった漢字にはありません。",
    sourceJmdict:
      "単語はJMdictから。JMdictはElectronic Dictionary Research and Development Groupの所有物で、同グループのライセンス（CC BY-SA 4.0）のもとで使っています。",
    moreTitle: "使い方",
    moreText:
      "表はそれぞれ独立したエントリポイントなので、ページは読むものだけを読み込みます。単語は数キロバイトずつに分かれていて、引くときに必要な分だけを取得します。",
    foot: "コードはMITライセンスです。データはそれぞれの出典のライセンスに従います。ここでは何も保存せず、どこにも送りません。",
  },
};

function docsLink(lang) {
  document
    .querySelector('[data-say="pageDocs"]')
    ?.setAttribute("href", lang === "ja" ? "docs/ja/index.html" : "docs/index.html");
}
const language = familyLanguage({
  id: "jisho",
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
  view: query.get("view") === "words" ? "words" : "kanji",
  list: query.get("list") ?? "g1",
  kanji: query.get("kanji"),
  search: "",
  word: query.get("word") ?? "",
  by: ["meaning", "kanji"].includes(query.get("by")) ? query.get("by") : "reading",
  mode: query.get("mode") === "unfiltered" ? "unfiltered" : "safe",
};
const EXAMPLES = {
  reading: ["かみ", "紙", "さくら", "ありがとう", "kami"],
  meaning: ["water", "dog", "go out", "paper", "thank you"],
  kanji: ["山", "日", "水", "語"],
};
const PROMPTS = { reading: "wordPrompt", meaning: "wordPromptMeaning", kanji: "wordPromptKanji" };

const gradeName = (grade) => (grade <= 6 ? t("grade", { n: grade }) : t(`grade${grade}`));
const listed = () =>
  state.list.startsWith("g") ? kanjiOfGrade(GRADES, Number(state.list.slice(1))) : kanjiOfLevel(JLPT, state.list);

function writeAddress() {
  const next = new URLSearchParams(location.search);
  next.set("list", state.list);
  if (state.kanji === null) next.delete("kanji");
  else next.set("kanji", state.kanji);
  if (state.view === "words") next.set("view", "words");
  else next.delete("view");
  if (state.word === "") next.delete("word");
  else next.set("word", state.word);
  if (state.by === "reading") next.delete("by");
  else next.set("by", state.by);
  if (state.mode === "safe") next.delete("mode");
  else next.set("mode", "unfiltered");
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
  big.className = "jisho-big";
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
  const words = document.createElement("button");
  words.type = "button";
  words.dataset.testid = "card-words";
  words.textContent = t("cardWordsButton", { kanji: one.kanji });
  words.addEventListener("click", () => {
    state.view = "words";
    state.by = "kanji";
    draw();
    void lookUp(one.kanji);
  });
  fact(facts, t("cardWords"), words);
  const alike = lookAlikes(LOOK_ALIKE, one.kanji);
  if (alike.length === 0) fact(facts, t("cardAlike"), t("cardNoAlike"));
  else {
    const row = document.createElement("div");
    row.className = "jisho-alike";
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

/** A row of buttons of which one is pressed. */
function choice(holder, items, current, pick) {
  if (holder.childElementCount === 0) {
    holder.append(
      ...items.map(({ id }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.choice = String(id);
        button.addEventListener("click", () => pick(id));
        return button;
      }),
    );
  }
  items.forEach(({ id, label }, at) => {
    const button = holder.children[at];
    button.textContent = label;
    button.setAttribute("aria-pressed", String(id === current));
  });
}

// What has been looked up: the words JMdict holds for the text, in the mode they were loaded in. In safe mode nothing it leaves out
// is fetched; choosing Unfiltered fetches the files that hold the rest, and looks the text up again.
let looked = null;
let pending = null;
let failed = null;
let asking = 0;

/** What a lookup gives, by what it is asked by: the words, and the JMdict release when the lookup read it. */
async function search(text) {
  const { by, mode } = state;
  if (by === "meaning") return { text, by, mode, words: await findByMeaning(text, { mode, limit: 20 }), release: "" };
  if (by === "kanji") return { text, by, mode, words: await wordsWithKanji(text, { mode, limit: 20 }), release: "" };
  const loaded = await loadWords(text, { mode, romaji: true });
  return { text, by, mode, words: wordsOf(loaded, text, { romaji: true }), release: loaded.release };
}

async function lookUp(text) {
  const clean = text.trim();
  state.word = clean;
  $("word").value = clean;
  const ask = ++asking;
  looked = null;
  failed = null;
  pending = clean === "" ? null : clean;
  drawWords();
  writeAddress();
  if (clean === "") return;
  try {
    const found = await search(clean);
    if (ask === asking) looked = found;
  } catch {
    if (ask === asking) failed = clean;
  }
  if (ask !== asking) return;
  pending = null;
  drawWords();
}

function wordItem(word) {
  const item = document.createElement("li");
  item.dataset.testid = "word-item";
  const written = document.createElement("p");
  written.className = "jisho-written";
  written.lang = "ja";
  written.textContent = word.written;
  const reading = document.createElement("p");
  reading.className = "jisho-reading";
  reading.lang = "ja";
  reading.textContent = word.written === word.reading ? "" : word.reading;
  reading.hidden = reading.textContent === "";
  const meaning = document.createElement("p");
  meaning.className = "jisho-meaning";
  meaning.lang = "en";
  meaning.textContent = word.meaning;
  item.append(written, reading, meaning);
  const marks = [...new Set(word.senses.flatMap((sense) => sense.marks))].filter((mark) => mark !== "uk");
  if (marks.length > 0) {
    const tags = document.createElement("p");
    tags.className = "jisho-marks";
    tags.lang = "en";
    tags.dataset.testid = "word-marks";
    tags.textContent = marks.join(" ");
    item.append(tags);
  }
  if (word.common) {
    const tag = document.createElement("p");
    tag.className = "jisho-tag";
    tag.textContent = t("wordCommon");
    item.append(tag);
  }
  const its = kanjiOfWord(word, kanji);
  if (its.length > 0) {
    const row = document.createElement("div");
    row.className = "jisho-word-kanji";
    row.lang = "ja";
    row.dataset.testid = "word-kanji";
    for (const one of its) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = one.kanji;
      button.setAttribute("aria-label", t("wordKanjiOpen", { kanji: one.kanji }));
      button.addEventListener("click", () => {
        state.view = "kanji";
        state.list = `g${one.grade}`;
        state.search = "";
        $("search").value = "";
        state.kanji = one.kanji;
        draw();
      });
      row.append(button);
    }
    item.append(row);
  }
  return item;
}

function drawWords() {
  choice(
    $("view"),
    [
      { id: "kanji", label: t("viewKanji") },
      { id: "words", label: t("viewWords") },
    ],
    state.view,
    (id) => {
      state.view = id;
      draw();
    },
  );
  choice(
    $("by"),
    [
      { id: "reading", label: t("byReading") },
      { id: "meaning", label: t("byMeaning") },
      { id: "kanji", label: t("byKanji") },
    ],
    state.by,
    (id) => {
      state.by = id;
      asking++;
      looked = null;
      failed = null;
      pending = null;
      state.word = "";
      $("word").value = "";
      drawWords();
      writeAddress();
    },
  );
  $("word").lang = state.by === "meaning" ? "en" : "ja";
  $("examples").lang = state.by === "meaning" ? "en" : "ja";
  const examples = $("examples");
  if (examples.dataset.by !== state.by) {
    examples.dataset.by = state.by;
    examples.replaceChildren(
      ...EXAMPLES[state.by].map((text) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.addEventListener("click", () => void lookUp(text));
        return button;
      }),
    );
  }
  choice(
    $("audience"),
    [
      { id: "safe", label: t("audienceSafe") },
      { id: "unfiltered", label: t("audienceUnfiltered") },
    ],
    state.mode,
    (id) => {
      state.mode = id;
      if (state.word === "") {
        drawWords();
        writeAddress();
      } else void lookUp(state.word);
    },
  );
  const list = $("word-list");
  const count = $("word-count");
  if (pending !== null) {
    count.textContent = t("wordLoading", { text: pending });
    list.replaceChildren();
  } else if (failed !== null) {
    count.textContent = t("wordFailed", { text: failed });
    list.replaceChildren();
  } else if (looked === null) {
    count.textContent = t(PROMPTS[state.by]);
    list.replaceChildren();
  } else {
    const { text, words: found, mode, by } = looked;
    count.textContent =
      by === "kanji" && !/\p{Script=Han}/u.test(text)
        ? t("wordNoKanji", { text })
        : found.length === 0
          ? t(mode === "safe" ? "wordNoneSafe" : "wordNone", { text })
          : t(found.length === 1 ? "wordCountOne" : "wordCountMany", { n: found.length, text });
    list.replaceChildren(...found.map(wordItem));
    list.dataset.release = looked.release;
  }
  $("word-release").textContent =
    looked === null || looked.release === "" ? "" : t("wordRelease", { release: looked.release });
}

function draw() {
  const inWords = state.view === "words";
  for (const part of document.querySelectorAll("[data-kanji-view]")) part.hidden = inWords;
  $("kanji-view").hidden = inWords;
  $("words-view").hidden = !inWords;
  drawWords();
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

$("word-form").addEventListener("submit", (event) => {
  event.preventDefault();
  void lookUp($("word").value);
});

$("search").addEventListener("input", (event) => {
  state.search = event.target.value;
  draw();
});

draw();
if (state.view === "words" && state.word !== "") void lookUp(state.word);
document.documentElement.dataset.ready = "true";
