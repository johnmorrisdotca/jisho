// Reads JMdict into the rows of the words tables. Pure functions over the dictionary's text, so a test can hold them to real entries
// and `scripts/build-words.mjs` only has to fetch the file and write what these return. Nothing here reads a file or a network.
//
// One row is one reading of one entry: the reading, the written forms that go with it, a short English meaning, flags, and, where
// a sense is not for children, the meaning with those senses left out. See docs/guides/words.md for the format.

/** JMdict's own "common word" tags, on any written form or reading of an entry. The same five UmaKuma's common table keeps. */
export const COMMON_TAGS = ["news1", "ichi1", "spec1", "spec2", "gai1"];
/** A sense carrying one of these marks is not for children: vulgar, X-rated, sensitive or derogatory. Kotoba's bar, kept in step. */
export const NOT_FOR_CHILDREN = /^(vulg|X|sens|derog)$/;
/**
 * Written forms JMdict files as search-only, irregular or outdated are left out: not spellings anybody means to look up. The same
 * marks on a reading keep it, behind the regular ones, because a game that takes any kana as a guess is owed what it means.
 */
export const SKIPPED_FORM_INFO = new Set(["sK", "iK", "oK", "sk", "ik", "ok"]);
/** A meaning stops at a whole gloss inside this many characters, except that the first gloss is always whole. */
export const MEANING_MAX = 60;
const SENSES = 2;
const GLOSSES = 3;
const BAND_SIZE = 500;
/** The rank of a word JMdict puts in no frequency list at all. */
export const UNRANKED = 100_000;

/** The five kinds of word a conjugation needs to know, as one letter each. */
export const KIND_LETTERS = { g: "godan", i: "ichidan", a: "i-adjective", s: "suru", k: "kuru" };

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
const tags = (body, name) =>
  [...body.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "g"))].map((match) => match[1]);
const code = (text) => text.replace(/^&|;$/g, "");

/** The date of a JMdict file ("2026-11-02"), from its first comment, or null. */
export function releaseOf(xml) {
  return /<!-- JMdict created: (\d{4}-\d{2}-\d{2}) -->/.exec(xml)?.[1] ?? null;
}

/** JMdict's part-of-speech codes as the letters of the kinds a conjugation reads. */
export function kindLetters(codes) {
  const letters = new Set();
  for (const one of codes) {
    if (/^v5/.test(one)) letters.add("g");
    else if (one === "v1" || one === "v1-s") letters.add("i");
    else if (one === "adj-i" || one === "adj-ix") letters.add("a");
    else if (one === "vs" || one === "vs-i" || one === "vs-s") letters.add("s");
    else if (one === "vk") letters.add("k");
  }
  return [...letters].sort().join("");
}

/** One rank from JMdict's priority tags, lower being commoner: the newspaper band if there is one, else the lists' own two grades. */
export function rankOf(priorities) {
  const band = priorities.map((one) => /^nf(\d\d)$/.exec(one)).find(Boolean);
  if (band) return (Number(band[1]) - 1) * BAND_SIZE + BAND_SIZE / 2;
  if (priorities.some((one) => ["news1", "ichi1", "spec1", "gai1"].includes(one))) return 12_000;
  if (priorities.some((one) => ["news2", "ichi2", "spec2", "gai2"].includes(one))) return 24_000;
  return UNRANKED;
}

/**
 * The glosses of a sense, the one to show first first: a literal rendering, an explanation, a figurative sense or a trademark is
 * kept behind the plain ones, and a gloss that opens with a bracketed note is kept behind one that does not.
 */
export function glossesOf(sense) {
  const glosses = [...sense.matchAll(/<gloss(\s[^>]*)?>([\s\S]*?)<\/gloss>/g)].map((match) => ({
    typed: match[1] !== undefined && /g_type="(lit|expl|fig|tm)"/.test(match[1]),
    text: decode(match[2].trim()),
  }));
  const plain = glosses.filter((gloss) => !gloss.typed && gloss.text !== "");
  const kept = (plain.length > 0 ? plain : glosses).map((gloss) => gloss.text).filter((text) => text !== "");
  const first = kept.find((text) => !text.startsWith("(")) ?? kept[0];
  return first === undefined ? [] : [first, ...kept.filter((text) => text !== first)];
}

/** Up to two senses of up to three glosses, ", " between glosses and "; " between senses, cut at a whole gloss inside MEANING_MAX. */
export function meaningOf(senses) {
  let text = "";
  outer: for (const glosses of senses.filter((one) => one.length > 0).slice(0, SENSES)) {
    for (const [at, gloss] of glosses.slice(0, GLOSSES).entries()) {
      const next = text === "" ? gloss : `${text}${at === 0 ? "; " : ", "}${gloss}`;
      if (text !== "" && next.length > MEANING_MAX) break outer;
      text = next;
    }
  }
  return text;
}

/** Every `<entry>` of a JMdict file, as text. */
export function entriesOf(xml) {
  return xml.split("<entry>").slice(1);
}

/**
 * The rows of one entry: one for each reading it has, a reading JMdict calls irregular or outdated last. Each is an object with the reading, the written forms that go with it (best
 * first, none for a word with no kanji), the meaning, the kinds of word, whether JMdict calls it common, whether it is usually
 * written in kana (by its first sense), the rank, and `kids`: the meaning with the senses that are not for children left out, or
 * undefined when that is the same text.
 *
 * @returns The rows, or none for an entry with no reading or no meaning.
 */
export function rowsOfEntry(entry) {
  const forms = tags(entry, "k_ele")
    .map((body) => ({
      text: decode(tags(body, "keb")[0] ?? ""),
      priorities: tags(body, "ke_pri"),
      info: tags(body, "ke_inf").map(code),
    }))
    .filter((form) => form.text !== "" && !form.info.some((one) => SKIPPED_FORM_INFO.has(one)));
  const readings = tags(entry, "r_ele")
    .map((body) => ({
      text: decode(tags(body, "reb")[0] ?? ""),
      priorities: tags(body, "re_pri"),
      info: tags(body, "re_inf").map(code),
      only: tags(body, "re_restr").map(decode),
      noKanji: body.includes("<re_nokanji/>"),
    }))
    .filter((reading) => reading.text !== "")
    .map((reading) => ({ ...reading, irregular: reading.info.some((one) => SKIPPED_FORM_INFO.has(one)) }));
  if (readings.length === 0) return [];

  const senses = tags(entry, "sense").map((body) => ({
    glosses: glossesOf(body),
    unfit: tags(body, "misc").some((one) => NOT_FOR_CHILDREN.test(code(one))),
    pos: tags(body, "pos").map(code),
    usuallyKana: tags(body, "misc").some((one) => code(one) === "uk"),
  }));
  if (senses.length === 0) return [];
  const meaning = meaningOf(senses.map((sense) => sense.glosses));
  if (meaning === "") return [];
  const fit = senses.filter((sense) => !sense.unfit);
  const forChildren = meaningOf(fit.map((sense) => sense.glosses));
  // Where the senses left out were not among the ones the meaning shows, the two are the same text and one is kept.
  const kids = forChildren === meaning ? undefined : forChildren;

  const priorities = [
    ...forms.flatMap((form) => form.priorities),
    ...readings.flatMap((reading) => reading.priorities),
  ];
  const taggedCommon = priorities.some((one) => COMMON_TAGS.includes(one));
  const kinds = kindLetters(senses.flatMap((sense) => sense.pos));
  // The first sense decides how the word is shown: 犬 has a later sense that is usually in kana, and is still 犬.
  const usuallyKana = senses[0]?.usuallyKana ?? false;
  const rank = rankOf(priorities);
  // The forms JMdict tags common come first; the rest keep the dictionary's own order.
  const ordered = [
    ...forms.filter((form) => form.priorities.length > 0),
    ...forms.filter((form) => form.priorities.length === 0),
  ];

  return readings.map((reading) => ({
    reading: reading.text,
    forms: reading.noKanji
      ? []
      : ordered
          .filter((form) => reading.only.length === 0 || reading.only.includes(form.text))
          .map((form) => form.text),
    meaning,
    kids,
    kinds,
    // An irregular reading is never a common one, and comes after the regular ones that share it.
    common: taggedCommon && !reading.irregular,
    usuallyKana,
    rank: reading.irregular ? UNRANKED + 1 : rank,
  }));
}

/** Every row of a JMdict file, the commonest first and in the dictionary's order among equals. */
export function rowsOfDictionary(xml) {
  const rows = entriesOf(xml).flatMap((entry, at) => rowsOfEntry(entry).map((row) => ({ ...row, at })));
  return rows.sort((a, b) => a.rank - b.rank || a.at - b.at);
}

/** A kana folded to hiragana: the katakana block moves down, ー and everything else stays. */
export function foldKana(text) {
  return text.replace(/[ァ-ヶ]/g, (one) => String.fromCharCode(one.charCodeAt(0) - 0x60));
}

const FIELD_BREAK = /[\t\n]/;
const LIST_BREAK = /[\t\n|]/;

/** A row as one line: reading, forms joined by "|", meaning, flags and, when some sense was left out, the meaning for children. */
export function packRow(row) {
  const flags = `${row.kinds}${row.common ? "C" : ""}${row.usuallyKana ? "U" : ""}`;
  for (const part of [row.reading, ...row.forms])
    if (LIST_BREAK.test(part)) throw new Error(`A separator in the row for ${row.reading}: ${part}`);
  for (const part of [row.meaning, row.kids ?? ""])
    if (FIELD_BREAK.test(part)) throw new Error(`A separator in the row for ${row.reading}: ${part}`);
  const fields = [row.reading, row.forms.join("|"), row.meaning, flags];
  if (row.kids !== undefined) fields.push(row.kids);
  return fields.join("\t");
}
