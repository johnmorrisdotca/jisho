// What the rows of the dictionary are sorted into: the default tables, which hold only what safe mode keeps, and the extra
// ones, which hold everything those leave out. Pure functions over the rows `words-parse.mjs` makes, so a test can hold them to
// small dictionaries and `build-words.mjs` only has to cut them into files.
//
// The rule that decides everything here: nothing that safe mode leaves out is in a default table. A word of which every sense is
// marked is not in one at all; a sense, a written form or a reading that is marked is not either. What is left out goes in the
// extra tables, which a host fetches only in unfiltered mode.
import { formKey, packClean, packRow, readingKey, UNRANKED } from "./words-parse.mjs";

/** Readings that are not all kana (a middle dot is kana here, as it is in loanwords): they are looked up like a written form. */
export const KANA_TEXT = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

/** For each written form (and each reading that is not kana alone, which is asked for like one), its readings, the commonest word's first. */
function formIndex(pairs) {
  const readingsOf = new Map();
  const add = (form, reading) => {
    const held = readingsOf.get(form) ?? [];
    if (!held.includes(reading)) held.push(reading);
    readingsOf.set(form, held);
  };
  for (const [reading, forms] of pairs) {
    for (const form of forms) add(formKey(form), reading);
    if (!KANA_TEXT.test(formKey(reading))) add(formKey(reading), reading);
  }
  return readingsOf;
}

/** The lines of each key, in the order the lines come in. */
function byKey(entries) {
  const held = new Map();
  for (const [key, line] of entries) held.set(key, [...(held.get(key) ?? []), line]);
  return held;
}

const same = (a, b) => a.length === b.length && a.every((one, at) => one === b[at]);

/**
 * The tables of a list of rows, commonest first.
 *
 * @returns
 *   `common` and `commonPatch`: the common words safe mode keeps, and what to do to them to have every common word as JMdict has it;
 *   `readings`: the default rows as [key, line] sorted by key (the reading folded to hiragana), and `extraReadings` the lines
 *     for each key whose answer is not the same for everything, in full;
 *   `forms`: the default index as [form, line] sorted by form, and `extraForms` the same for each form whose readings differ;
 *   `counts`.
 */
export function tablesOf(rows) {
  const full = rows.map(packRow);
  const clean = rows.map(packClean);

  // The common words, and the patch that turns them back into everything: "n", "r" (replace what is there) or "i" (insert), the line.
  const common = [];
  const commonPatch = [];
  let n = 0;
  for (const [at, row] of rows.entries()) {
    if (!row.common) continue;
    const line = clean[at];
    if (line !== null) common.push(line);
    if (line !== full[at]) commonPatch.push(`${n}\t${line === null ? "i" : "r"}\t${full[at]}`);
    n++;
  }

  // The rows by reading, folded to hiragana, in the order of the dictionary within one.
  const order = rows
    .map((_row, at) => at)
    .sort((a, b) => {
      const [x, y] = [readingKey(rows[a].reading), readingKey(rows[b].reading)];
      return x < y ? -1 : x > y ? 1 : a - b;
    });
  const readings = order.filter((at) => clean[at] !== null).map((at) => [readingKey(rows[at].reading), clean[at]]);
  const fullByReading = byKey(order.map((at) => [readingKey(rows[at].reading), full[at]]));
  const cleanByReading = byKey(readings);
  const extraReadings = [...fullByReading]
    .filter(([key, lines]) => !same(lines, cleanByReading.get(key) ?? []))
    .flatMap(([key, lines]) => lines.map((line) => [key, line]));

  // The index of written forms.
  const fullIndex = formIndex(rows.map((row) => [row.reading, row.forms]));
  const cleanIndex = formIndex(rows.filter((row) => row.clean !== null).map((row) => [row.reading, row.clean.forms]));
  const lineOf = (form, held) => [form, `${form}\t${held.join("|")}`];
  const forms = [...cleanIndex].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([form, held]) => lineOf(form, held));
  const extraForms = [...fullIndex]
    .filter(([form, held]) => !same(held, cleanIndex.get(form) ?? []))
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([form, held]) => lineOf(form, held));

  return {
    common,
    commonPatch,
    readings,
    extraReadings,
    forms,
    extraForms,
    counts: {
      rows: rows.length,
      cleanRows: readings.length,
      common: common.length,
      commonAll: rows.filter((row) => row.common).length,
    },
  };
}

/** What a patch makes of the default common rows: every common row as JMdict has it. Mirrors the reader in src/words.ts. */
export function patched(common, patch) {
  const insertions = patch.filter((one) => one.split("\t")[1] === "i").length;
  const edits = new Map(
    patch.map((one) => {
      const [at, kind, ...line] = one.split("\t");
      return [Number(at), [kind, line.join("\t")]];
    }),
  );
  const out = [];
  let from = 0;
  for (let at = 0; at < common.length + insertions; at++) {
    const edit = edits.get(at);
    if (edit === undefined) out.push(common[from++]);
    else {
      out.push(edit[1]);
      if (edit[0] === "r") from++;
    }
  }
  return out;
}

/** A term of an English gloss: letters and digits, with an apostrophe inside a word ("don't"), compared in lower case. */
const TERM = /[\p{L}\p{N}]+(?:'\p{L}+)?/gu;
/**
 * Words too common in glosses to find anything by: not indexed, and left out of a query. The same list as `STOP_WORDS` in
 * src/words-text.ts, which a test holds to this one.
 */
export const STOP_WORDS = [
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "one's",
  "oneself",
  "or",
  "someone",
  "someone's",
  "something",
  "somebody",
  "that",
  "the",
  "this",
  "to",
  "with",
];
const STOPPED = new Set(STOP_WORDS);
/** A gloss held to this many of the commonest words for each term of the meaning index, and a kanji to the second. */
export const MEANING_CAP = 20;
/** Of those, at most this many are words with a gloss that is exactly the term; the rest are the commonest that merely hold it. */
export const MEANING_EXACT = 10;
export const KANJI_CAP = 60;

/** The terms of a text in order, as they follow each other: the same rule as `termsInOrder` in src/words-text.ts. */
export function termsInOrder(text) {
  const found =
    text
      .normalize("NFKC")
      .replace(/\u2019/g, "'")
      .toLowerCase()
      .match(TERM) ?? [];
  return found.filter((term) => !STOPPED.has(term));
}

/** The terms of a text, once each: the same rule as `termsOf` in src/words-text.ts. */
export function termsOf(text) {
  return [...new Set(termsInOrder(text))];
}

/** Two terms that follow each other, as the index keys them. */
export const pairKey = (first, second) => `${first} ${second}`;

const HAN = /\p{Script=Han}/u;
/** The kanji in some written forms, once each: the iteration mark is not one. */
export function kanjiOfForms(forms) {
  return [...new Set(forms.flatMap((form) => [...formKey(form)]).filter((one) => HAN.test(one) && one !== "々"))];
}

/** For each key, the readings of the rows that have it, the commonest word's first, at most `cap` of them. `keysOf` says the keys of a row. */
function refsByKey(rows, keysOf, cap) {
  const index = new Map();
  for (const row of rows) {
    for (const key of keysOf(row)) {
      const held = index.get(key);
      if (held === undefined) index.set(key, [row.reading]);
      else if (held.length < cap && !held.includes(row.reading)) held.push(row.reading);
    }
  }
  return index;
}

/** A gloss without its asides: "water (esp. cool or cold)" is "water". The same rule as `withoutAsides` in src/words-text.ts. */
export function withoutAsides(gloss) {
  let text = gloss;
  for (let before = ""; before !== text; ) {
    before = text;
    text = text.replace(/\([^()]*\)/g, " ");
  }
  return text;
}

/** How well a gloss answers a key: 0 the first gloss of the first sense is exactly the key, 1 another gloss is, 2 a gloss only holds it. */
export const HEADLINE = 0;
export const EXACT = 1;
export const HOLDS = 2;
/** A word with an exact gloss that is not its first is ranked as if it were this much less common: 飲む (to drink) before 一気 (chug!, drink!). */
export const EXACT_PENALTY = 20_000;

/**
 * The keys a row is found by in the index by meaning, each with how well the row's glosses answer it (`HEADLINE`, `EXACT` or
 * `HOLDS`; `drink` is the headline of 飲む, whose first gloss is "to drink", and only an exact gloss of 一気, which has "drink!"
 * as its second sense's second gloss). A word JMdict ranks has every term of every gloss it keeps; a word it does not rank, which
 * is most of the dictionary, has the terms of its first gloss alone, so that the index is a few megabytes and not thirty.
 */
export function meaningKeys(row, senses) {
  const ranked = row.rank < UNRANKED;
  const glosses = senses.flatMap((sense) => sense.glosses);
  const keys = new Map();
  const add = (key, tier) => keys.set(key, Math.min(keys.get(key) ?? HOLDS, tier));
  const tierOf = (at) => (at === 0 ? HEADLINE : EXACT);
  for (const [at, gloss] of (ranked ? glosses : glosses.slice(0, 1)).entries()) {
    // A gloss that is one term once its asides are left out and the words every gloss has ("go (board game)", "to go") is exactly
    // that term; the terms of its asides only hold it.
    const whole = termsInOrder(withoutAsides(gloss));
    for (const term of termsOf(gloss)) add(term, whole.length === 1 && whole[0] === term ? tierOf(at) : HOLDS);
  }
  // A word JMdict ranks is also found by two terms that follow each other in a gloss: "go out" is a key, so a phrase finds its words.
  if (ranked)
    for (const [at, gloss] of glosses.entries()) {
      const found = termsInOrder(gloss);
      const whole = termsInOrder(withoutAsides(gloss));
      for (const [next, term] of found.slice(1).entries()) {
        const key = pairKey(found[next], term);
        add(key, whole.length === 2 && pairKey(whole[0], whole[1]) === key ? tierOf(at) : HOLDS);
      }
    }
  return [...keys];
}

/**
 * For each key of the index by meaning, the readings of its words: those whose gloss answers the key exactly first (at most
 * `exactMost` of them, by rank with `EXACT_PENALTY` added where the gloss is not the word's first), then the commonest of the rest, up to `cap`
 * in all. `rows` come commonest first. This is what makes `drink` give 飲む: the commonest twenty words that merely hold the term
 * would not.
 */
function refsByMeaning(rows, cap, exactMost) {
  const index = new Map();
  for (const row of rows) {
    for (const [key, tier] of meaningKeys(row, row.senses)) {
      const held = index.get(key) ?? new Map();
      index.set(key, held);
      const was = held.get(row.reading);
      const score = row.rank + (tier === EXACT ? EXACT_PENALTY : 0);
      // A reading several words share counts by its best word.
      if (tier !== HOLDS && (was === undefined || was.tier === HOLDS || score < was.score))
        held.set(row.reading, { tier, score });
      else if (was === undefined) held.set(row.reading, { tier, score });
    }
  }
  return new Map(
    [...index].map(([key, held]) => {
      const readings = [...held.keys()];
      const first = readings
        .filter((reading) => held.get(reading).tier !== HOLDS)
        .sort((a, b) => held.get(a).score - held.get(b).score)
        .slice(0, exactMost);
      return [key, [...first, ...readings.filter((reading) => !first.includes(reading)).slice(0, cap - first.length)]];
    }),
  );
}

const lineOf = ([key, readings]) => [key, `${key}\t${readings.join("|")}`];
const sortedLines = (index) => [...index].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(lineOf);

/**
 * The indexes that find words by what they mean and by the kanji in them, as [key, line] sorted by key, each line the key and the
 * readings of the words that have it, apart by "|", the commonest word's first. The default ones are made from the rows as safe
 * mode has them, so that nothing in them names what safe mode leaves out. The extra ones hold, for every key whose list is not the
 * same in everything JMdict has, the whole list.
 *
 * @returns `meanings`, `extraMeanings`, `kanji` and `extraKanji`.
 */
export function indexesOf(rows) {
  const clean = rows.filter((row) => row.clean !== null).map((row) => ({ ...row, ...row.clean }));
  const sets = [
    ["meanings", "extraMeanings", (some) => refsByMeaning(some, MEANING_CAP, MEANING_EXACT)],
    ["kanji", "extraKanji", (some) => refsByKey(some, (row) => kanjiOfForms(row.forms), KANJI_CAP)],
  ];
  const out = {};
  for (const [name, extraName, refsOf] of sets) {
    const safe = refsOf(clean);
    const everything = refsOf(rows);
    out[name] = sortedLines(safe);
    out[extraName] = sortedLines(new Map([...everything].filter(([key, held]) => !same(held, safe.get(key) ?? []))));
  }
  return out;
}
