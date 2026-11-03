// The embed page: a page made to sit in an <iframe>. What it draws is in its address, and nothing else is on it.
//   embed.html?word=かみ                 the words read かみ, written like that, or conjugated from a word
//   embed.html?meaning=water             the commonest words whose English meaning holds water
//   embed.html?kanji=山                  the card of one kanji; &with=山 lists the words written with it
//   &mode=unfiltered  &limit=5  &lang=ja  &theme=dark
import { KANJI } from "./dist/data/kanji.data.js";
import { readKanji } from "./dist/index.js";
import { findByMeaning, inflectedOf, loadWords, wordsWithKanji } from "./dist/words.js";

const query = new URLSearchParams(location.search);
const lang = query.get("lang") === "ja" ? "ja" : "en";
const theme = query.get("theme");
if (theme === "dark" || theme === "light") document.documentElement.dataset.theme = theme;
document.documentElement.lang = lang;
const mode = query.get("mode") === "unfiltered" ? "unfiltered" : "safe";
const limit = Math.min(Math.max(Number.parseInt(query.get("limit") ?? "", 10) || 5, 1), 20);

const SAY = {
  en: {
    none: "No word to show.",
    nothing: "Nothing to look up: add ?word=かみ, ?meaning=water or ?kanji=山 to the address.",
    failed: "Could not look that up.",
    common: "common",
    strokes: "Strokes",
    school: "School grade",
    jlpt: "JLPT",
    on: "On",
    kun: "Kun",
    meanings: "Meanings",
    credit: "Words from JMdict, kanji from KANJIDIC2 (EDRDG, CC BY-SA 4.0).",
  },
  ja: {
    none: "表示できる単語がありません。",
    nothing: "調べる語がありません。アドレスに ?word=かみ、?meaning=water、?kanji=山 を付けてください。",
    failed: "調べられませんでした。",
    common: "よく使う",
    strokes: "画数",
    school: "学年",
    jlpt: "JLPT",
    on: "音読み",
    kun: "訓読み",
    meanings: "意味",
    credit: "単語はJMdict、漢字はKANJIDIC2（EDRDG、CC BY-SA 4.0）。",
  },
};
const say = SAY[lang];
const root = document.getElementById("embed");

const element = (tag, className, text, language) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (language) node.lang = language;
  return node;
};

const wordList = (words) => {
  if (words.length === 0) return element("p", "e-note", say.none);
  const list = document.createElement("ul");
  for (const word of words.slice(0, limit)) {
    const item = document.createElement("li");
    item.append(element("p", "e-written", word.written, "ja"));
    item.append(element("p", "e-reading", word.written === word.reading ? "" : word.reading, "ja"));
    item.append(element("p", "e-meaning", word.meaning, "en"));
    if (word.common) item.append(element("p", "e-tag", say.common));
    list.append(item);
  }
  return list;
};

const kanjiCard = (one) => {
  const card = element("article", "e-card");
  card.append(element("p", "e-big", one.kanji, "ja"));
  const facts = document.createElement("dl");
  const add = (term, value, language) => {
    facts.append(element("dt", "", term), element("dd", "", value, language));
  };
  add(say.strokes, String(one.strokes));
  add(say.school, String(one.grade));
  add(say.jlpt, one.level ?? "–");
  if (one.on.length > 0) add(say.on, one.on.join("、"), "ja");
  if (one.kun.length > 0) add(say.kun, one.kun.join("、"), "ja");
  if (one.meanings.length > 0) add(say.meanings, one.meanings.join(", "), "en");
  card.append(facts);
  return card;
};

async function draw() {
  const word = query.get("word")?.trim() ?? "";
  const meaning = query.get("meaning")?.trim() ?? "";
  const kanji = query.get("kanji")?.trim() ?? "";
  const withKanji = query.get("with")?.trim() ?? "";
  const parts = [];
  if (kanji !== "") {
    const one = readKanji(KANJI).find((row) => row.kanji === kanji);
    if (one !== undefined) parts.push(kanjiCard(one));
  }
  if (word !== "") {
    const loaded = await loadWords(word, { mode, romaji: true, inflected: true });
    parts.push(wordList(inflectedOf(loaded, word, { romaji: true }).map((one) => one.word)));
  }
  if (meaning !== "") parts.push(wordList(await findByMeaning(meaning, { mode, limit })));
  if (withKanji !== "") parts.push(wordList(await wordsWithKanji(withKanji, { mode, limit })));
  if (parts.length === 0) parts.push(element("p", "e-note", say.nothing));
  parts.push(element("p", "e-credit", say.credit));
  root.replaceChildren(...parts);
}

draw().then(
  () => document.documentElement.setAttribute("data-ready", "true"),
  () => {
    root.replaceChildren(element("p", "e-note", say.failed));
    document.documentElement.setAttribute("data-ready", "true");
  },
);
