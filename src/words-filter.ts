/**
 * The small pure tools for what a lookup returned: leave out the senses that carry some marks, the words on a list, or every word
 * but the ones on another. They apply nothing on their own, and Jisho keeps no list of words of its own: a consumer chooses what
 * to leave out and passes it.
 */

import type { Sense, Word, WordsMode } from "./words.types.ts";
import { foldKana } from "./words-text.ts";

/** A meaning stops at a whole gloss inside this many characters, except that the first gloss is always whole. */
export const MEANING_MAX = 60;
const SENSES_SHOWN = 2;
const GLOSSES_SHOWN = 3;

/**
 * The mode a caller asked for, checked once at the top of every entry point so that all of them agree: `"safe"` or
 * `"unfiltered"`, and `"safe"` for no mode at all (`undefined`). Anything else (`"Safe"`, `"SAFE"`, `""`, `"bogus"`, `null`, a
 * number) is a mistake, and it throws: a child-safe package never lets a typo or a config value take the filter off.
 */
export function modeOf(mode: unknown): WordsMode {
  if (mode === undefined || mode === "safe") return "safe";
  if (mode === "unfiltered") return "unfiltered";
  throw new TypeError(`Unknown mode ${JSON.stringify(mode) ?? String(mode)}: use "safe" or "unfiltered".`);
}

/**
 * A list a caller passed (`block`, `allow`, a list of marks), checked: absent, or an array of texts. A text where a list belongs
 * (`block: "神"`) is the commonest mistake, and it threw "list.map is not a function" from deep inside a lookup; it is a TypeError
 * that names the option now, before anything is fetched.
 */
export function listOf(name: string, list: unknown): readonly string[] | undefined {
  if (list === undefined) return undefined;
  if (!Array.isArray(list) || list.some((one) => typeof one !== "string"))
    throw new TypeError(
      `${name} must be a list of texts, such as ["神"]; got ${typeof list === "string" ? JSON.stringify(list) : typeof list}.`,
    );
  return list;
}

/** The options of a lookup that are lists, checked: `block` and `allow`. */
export function checkLists(options: { readonly block?: unknown; readonly allow?: unknown }): void {
  listOf("block", options.block);
  listOf("allow", options.allow);
}

/**
 * The marks that safe mode leaves out, which are those JMdict gives a sense that is vulgar (`vulg`), X-rated (`X`), sensitive
 * (`sens`) or derogatory (`derog`). They are Kotoba's bar, kept here as a list a consumer may pass to `withoutMarks`, and nothing
 * else here uses them: safe mode leaves them out in files of its own, so that it fetches less.
 *
 * @example
 * ```ts
 * import { SAFE_MARKS } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(SAFE_MARKS); // ["vulg", "X", "sens", "derog"]
 * ```
 */
export const SAFE_MARKS: readonly string[] = ["vulg", "X", "sens", "derog"];

/**
 * The short English meaning of some senses: up to two senses of up to three glosses, ", " between glosses and "; " between senses,
 * cut at a whole gloss inside 60 characters. A lookup makes the meaning of each word this way from the senses it has, and a tool
 * that leaves senses out makes it again from the senses that are left.
 *
 * @param senses - The senses, in order.
 * @returns The meaning, or an empty text for no senses.
 * @example
 * ```ts
 * import { meaningFrom } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(meaningFrom([{ marks: [], glosses: ["paper"] }, { marks: ["col"], glosses: ["a sheet", "a page"] }])); // paper; a sheet, a page
 * ```
 */
export function meaningFrom(senses: readonly Sense[]): string {
  let text = "";
  outer: for (const sense of senses.filter((one) => one.glosses.length > 0).slice(0, SENSES_SHOWN)) {
    for (const [at, gloss] of sense.glosses.slice(0, GLOSSES_SHOWN).entries()) {
      const next = text === "" ? gloss : `${text}${at === 0 ? "; " : ", "}${gloss}`;
      if (text !== "" && next.length > MEANING_MAX) break outer;
      text = next;
    }
  }
  return text;
}

/**
 * Whether a word has a sense that carries any of some marks. JMdict gives a sense marks such as `vulg`, `col`, `sl`, `arch`, a
 * field such as `food` or `med`, and a dialect such as `ksb`.
 *
 * @param word - A word a lookup returned.
 * @param marks - The marks to look for.
 * @returns True when any sense of the word carries any of the marks.
 * @example
 * ```ts
 * import { hasMarks } from "@johnmorrisdotca/jisho/words";
 *
 * const word = { written: "紙", reading: "かみ", forms: ["紙"], meaning: "paper", senses: [{ marks: ["col"], glosses: ["paper"] }], kinds: "", common: true, rank: 1250, priority: ["news1"] };
 * console.log(hasMarks(word, ["col", "sl"])); // true
 * ```
 */
export function hasMarks(word: Word, marks: readonly string[]): boolean {
  listOf("marks", marks);
  return word.senses.some((sense) => sense.marks.some((mark) => marks.includes(mark)));
}

/**
 * The words with the senses that carry any of some marks left out. A word left with no sense is left out too, and the meaning of a
 * word that keeps some is made again from the senses it keeps.
 *
 * @param words - The words a lookup returned.
 * @param marks - The marks of the senses to leave out.
 * @returns New words, in the same order; none of the words given is changed.
 * @example
 * ```ts
 * import { loadWords, withoutMarks, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("かみ", { mode: "unfiltered" });
 * console.log(withoutMarks(wordsOf(words, "かみ"), ["arch", "obs"]).length);
 * ```
 */
export function withoutMarks(words: readonly Word[], marks: readonly string[]): Word[] {
  listOf("marks", marks);
  return words.flatMap((word) => {
    const senses = word.senses.filter((sense) => !sense.marks.some((mark) => marks.includes(mark)));
    return senses.length === 0 ? [] : [{ ...word, senses, meaning: meaningFrom(senses) }];
  });
}

/** Whether a word is named by a list: by its reading or by one of its written forms, kana in either kind folded to hiragana. */
function named(word: Word, list: ReadonlySet<string>): boolean {
  return list.has(foldKana(word.reading)) || word.forms.some((form) => list.has(foldKana(form)));
}

const folded = (list: readonly string[]) => new Set(list.map(foldKana));

/**
 * The words with those named on a list left out. A list names a word by its reading or by a written form, and a kana in either is
 * the same in hiragana and katakana. A reading that several words share names all of them.
 *
 * @param words - The words a lookup returned.
 * @param list - Readings and written forms to leave out.
 * @returns The words that are not named, in the same order.
 * @example
 * ```ts
 * import { loadWords, withoutWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("かみ");
 * console.log(withoutWords(wordsOf(words, "かみ"), ["神"]).map((one) => one.written).slice(0, 2)); // ["紙", "髪"]
 * ```
 */
export function withoutWords(words: readonly Word[], list: readonly string[]): Word[] {
  listOf("list", list);
  const set = folded(list);
  return words.filter((word) => !named(word, set));
}

/**
 * Only the words named on a list. A list names a word by its reading or by a written form, and a kana in either is the same in
 * hiragana and katakana. An empty list names none, so no word is left.
 *
 * @param words - The words a lookup returned.
 * @param list - Readings and written forms to keep.
 * @returns The words that are named, in the same order.
 * @example
 * ```ts
 * import { loadWords, onlyWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("かみ");
 * console.log(onlyWords(wordsOf(words, "かみ"), ["紙", "髪"]).map((one) => one.written)); // ["紙", "髪"]
 * ```
 */
export function onlyWords(words: readonly Word[], list: readonly string[]): Word[] {
  listOf("list", list);
  const set = folded(list);
  return words.filter((word) => named(word, set));
}
