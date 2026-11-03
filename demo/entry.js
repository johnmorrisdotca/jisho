// The full entry of a word: tap "Full entry" on a word and its card shows every sense, with its part of speech, marks, cross-references, notes and the
// languages a loanword comes from. The entry is fetched on demand, one piece of about 40 kB gzipped, in the mode the word was found in.
import { loadEntry, referenceOf } from "./dist/entries.js";
import { exampleCredit, loadExamples } from "./dist/examples.js";

export const ENTRY_WORDS = {
  en: {
    entryOpen: "Full entry",
    entryTitle: "Full entry of {word}",
    entryLoading: "Loading the entry…",
    entryFailed: "Could not load the entry. Try again.",
    entryClose: "Close",
    entryForms: "Written forms",
    entryReadings: "Readings",
    entryOnly: "Only for: {list}",
    entrySeeAlso: "See also",
    entryAntonym: "Antonym",
    entryNotes: "Note",
    entryFrom: "From {lang}",
    entryFromWasei: "Made in Japan from {lang}",
    entryPart: "(part)",
    entryLit: "literally",
    entryExpl: "explained",
    entryFig: "figuratively",
    entryTm: "trade name",
    entryLookUp: "Look up {word}",
    entryNoForms: "no kanji",
    entrySenseCount: "{n} senses",
    entrySenseOne: "1 sense",
    exampleLevel: "JLPT {level}",
    exampleBeyond: "beyond the JLPT lists",
  },
  ja: {
    entryOpen: "完全な項目",
    entryTitle: "{word}の完全な項目",
    entryLoading: "項目を読み込んでいます…",
    entryFailed: "項目を読み込めませんでした。もう一度お試しください。",
    entryClose: "閉じる",
    entryForms: "表記",
    entryReadings: "読み",
    entryOnly: "限定：{list}",
    entrySeeAlso: "参照",
    entryAntonym: "対義語",
    entryNotes: "注",
    entryFrom: "{lang}から",
    entryFromWasei: "{lang}をもとに日本で作られた語",
    entryPart: "（一部）",
    entryLit: "直訳",
    entryExpl: "説明",
    entryFig: "比喩",
    entryTm: "商標",
    entryLookUp: "{word}を引く",
    entryNoForms: "漢字なし",
    entrySenseCount: "{n}語義",
    entrySenseOne: "1語義",
    exampleLevel: "JLPT {level}",
    exampleBeyond: "JLPTのリストにない漢字あり",
  },
};

/** What the codes of a part of speech mean, for the ones a reader meets most; any other is shown as JMdict writes it. */
const POS = {
  n: ["noun", "名詞"],
  "adj-i": ["i-adjective", "形容詞"],
  "adj-na": ["na-adjective", "形容動詞"],
  "adj-no": ["no-adjective", "の形容詞"],
  adv: ["adverb", "副詞"],
  "adv-to": ["adverb taking と", "と副詞"],
  v1: ["ichidan verb", "一段動詞"],
  v5r: ["godan verb (る)", "五段動詞（る）"],
  v5k: ["godan verb (く)", "五段動詞（く）"],
  v5s: ["godan verb (す)", "五段動詞（す）"],
  v5u: ["godan verb (う)", "五段動詞（う）"],
  v5m: ["godan verb (む)", "五段動詞（む）"],
  v5g: ["godan verb (ぐ)", "五段動詞（ぐ）"],
  v5b: ["godan verb (ぶ)", "五段動詞（ぶ）"],
  v5t: ["godan verb (つ)", "五段動詞（つ）"],
  v5n: ["godan verb (ぬ)", "五段動詞（ぬ）"],
  vs: ["suru verb", "する動詞"],
  "vs-i": ["suru verb (included)", "する動詞（含む）"],
  vk: ["kuru verb", "来る動詞"],
  vt: ["transitive verb", "他動詞"],
  vi: ["intransitive verb", "自動詞"],
  exp: ["expression", "表現"],
  prt: ["particle", "助詞"],
  conj: ["conjunction", "接続詞"],
  pn: ["pronoun", "代名詞"],
  int: ["interjection", "感動詞"],
  ctr: ["counter", "助数詞"],
  pref: ["prefix", "接頭辞"],
  suf: ["suffix", "接尾辞"],
  num: ["numeric", "数詞"],
  aux: ["auxiliary", "助動詞"],
  "n-adv": ["adverbial noun", "副詞的名詞"],
  "n-suf": ["noun, used as a suffix", "接尾辞的名詞"],
  "n-t": ["temporal noun", "時相名詞"],
};
const LANGS = {
  eng: ["English", "英語"],
  ger: ["German", "ドイツ語"],
  fre: ["French", "フランス語"],
  por: ["Portuguese", "ポルトガル語"],
  dut: ["Dutch", "オランダ語"],
  spa: ["Spanish", "スペイン語"],
  ita: ["Italian", "イタリア語"],
  rus: ["Russian", "ロシア語"],
  chi: ["Chinese", "中国語"],
  kor: ["Korean", "韓国語"],
  ain: ["Ainu", "アイヌ語"],
  lat: ["Latin", "ラテン語"],
  gre: ["Greek", "ギリシャ語"],
  san: ["Sanskrit", "サンスクリット語"],
};

const make = (tag, className, text, lang) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (lang) node.lang = lang;
  return node;
};

/**
 * The card of the entry beside the list of words. `show(word)` fetches the entry and draws it, `hide()` closes it, `draw()` draws again in the language the page is in.
 * `onLookUp(text)` runs when a cross-reference is tapped.
 */
export function createEntryCard({ t, language, state, onLookUp, onChange }) {
  const card = document.getElementById("entry-card");
  let shown = null;
  let entry = null;
  let examples = [];
  let failed = false;
  let asking = 0;

  const pos = (code) => (POS[code] === undefined ? code : POS[code][language.lang === "ja" ? 1 : 0]);
  const lang = (code) => (LANGS[code] === undefined ? code : LANGS[code][language.lang === "ja" ? 1 : 0]);

  function reference(text) {
    const { written, reading } = referenceOf(text);
    const button = make("button", "jisho-link", text, "ja");
    button.type = "button";
    button.setAttribute("aria-label", t("entryLookUp", { word: text }));
    button.addEventListener("click", () => onLookUp(reading ?? written));
    return button;
  }

  function exampleList(list) {
    const holder = make("ul", "jisho-examples-list");
    holder.dataset.testid = "entry-examples";
    for (const one of list) {
      const row = make("li", "jisho-example");
      row.dataset.testid = "entry-example";
      const japanese = make("p", "jisho-example-ja", "", "ja");
      for (const part of one.furigana) {
        if (part.reading === undefined) japanese.append(part.text);
        else {
          const ruby = document.createElement("ruby");
          ruby.append(part.text, make("rt", "", part.reading));
          japanese.append(ruby);
        }
      }
      const level = make(
        "span",
        "jisho-mark",
        one.level === null ? t("exampleBeyond") : t("exampleLevel", { level: one.level }),
      );
      row.append(japanese, make("p", "", one.english, "en"), make("p", "jisho-fine", `${exampleCredit(one)} `, "en"));
      row.lastChild.append(level);
      holder.append(row);
    }
    return holder;
  }

  function senseNode(sense) {
    const item = make("li", "jisho-sense");
    item.dataset.testid = "entry-sense";
    const head = make("p", "jisho-sense-head");
    head.append(make("span", "jisho-number", `${sense.number}`));
    for (const code of sense.pos) head.append(make("span", "jisho-pos", pos(code)));
    for (const mark of sense.marks) head.append(make("span", "jisho-mark", mark));
    item.append(head);
    const glosses = make("p", "jisho-glosses", "", "en");
    sense.glosses.forEach((gloss, index) => {
      if (index > 0) glosses.append("; ");
      glosses.append(gloss.text);
      if (gloss.kind !== null)
        glosses.append(make("em", "", ` (${t(`entry${gloss.kind[0].toUpperCase()}${gloss.kind.slice(1)}`)})`));
    });
    item.append(glosses);
    const only = [...sense.onlyForms, ...sense.onlyReadings];
    if (only.length > 0) item.append(make("p", "jisho-fine", t("entryOnly", { list: only.join("、") }), "ja"));
    for (const [list, key] of [
      [sense.seeAlso, "entrySeeAlso"],
      [sense.antonyms, "entryAntonym"],
    ]) {
      if (list.length === 0) continue;
      const row = make("p", "jisho-fine", `${t(key)}: `);
      list.forEach((one, index) => {
        if (index > 0) row.append(" ");
        row.append(reference(one));
      });
      item.append(row);
    }
    const mine = examples.filter((one) => one.sense === sense.number);
    if (mine.length > 0) item.append(exampleList(mine));
    for (const note of sense.notes) item.append(make("p", "jisho-fine", `${t("entryNotes")}: ${note}`, "en"));
    for (const source of sense.sources) {
      const say = t(source.wasei ? "entryFromWasei" : "entryFrom", { lang: lang(source.lang) });
      item.append(
        make(
          "p",
          "jisho-fine",
          `${say}${source.partial ? ` ${t("entryPart")}` : ""}${source.text === "" ? "" : `: ${source.text}`}`,
        ),
      );
    }
    return item;
  }

  function draw() {
    if (shown === null) {
      card.hidden = true;
      card.replaceChildren();
      return;
    }
    card.hidden = false;
    const close = make("button", "fam-button", t("entryClose"));
    close.type = "button";
    close.dataset.testid = "entry-close";
    close.addEventListener("click", hide);
    const title = make("h3", "jisho-entry-title", t("entryTitle", { word: shown.written }));
    if (failed) return card.replaceChildren(title, make("p", "fam-muted", t("entryFailed")), close);
    if (entry === null) return card.replaceChildren(title, make("p", "fam-muted", t("entryLoading")), close);
    const forms = make("p", "jisho-fine", `${t("entryForms")}: `, "ja");
    forms.append(
      entry.forms.length === 0
        ? t("entryNoForms")
        : entry.forms
            .map((form) => (form.marks.length === 0 ? form.text : `${form.text} (${form.marks.join(", ")})`))
            .join("、"),
    );
    const readings = make("p", "jisho-fine", `${t("entryReadings")}: `, "ja");
    readings.append(
      entry.readings
        .map((one) => (one.marks.length === 0 ? one.text : `${one.text} (${one.marks.join(", ")})`))
        .join("、"),
    );
    const count = make(
      "p",
      "fam-muted",
      entry.senses.length === 1 ? t("entrySenseOne") : t("entrySenseCount", { n: entry.senses.length }),
    );
    const senses = make("ol", "jisho-senses");
    senses.dataset.testid = "entry-senses";
    senses.append(...entry.senses.map(senseNode));
    card.replaceChildren(title, forms, readings, count, senses, close);
  }

  async function show(word) {
    shown = word;
    entry = null;
    examples = [];
    failed = false;
    state.entry = word.written;
    onChange();
    draw();
    const ask = ++asking;
    try {
      const [found, shownExamples] = await Promise.all([
        loadEntry(word, { mode: state.mode }),
        loadExamples(word, { mode: state.mode }).catch(() => []),
      ]);
      if (ask === asking) {
        entry = found;
        examples = shownExamples;
      }
      if (found === null) failed = true;
    } catch {
      if (ask === asking) failed = true;
    }
    if (ask !== asking) return;
    draw();
    card.dispatchEvent(new CustomEvent("entry-drawn"));
  }

  /** Closes the card but keeps the entry the address names, for a list that is being fetched. */
  function reset() {
    asking++;
    shown = null;
    entry = null;
    draw();
  }

  function hide() {
    asking++;
    shown = null;
    entry = null;
    state.entry = "";
    onChange();
    draw();
  }

  return {
    show,
    hide,
    reset,
    draw,
    get shown() {
      return shown;
    },
  };
}
