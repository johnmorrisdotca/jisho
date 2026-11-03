/**
 * The text a lookup is asked with, made plain: one spelling for what a person might type or paste in several (full-width and
 * half-width, composed and decomposed, hiragana and katakana, a stray space or an invisible character), and the English terms of a
 * meaning. Nothing here throws, whatever it is given.
 */

/** A text longer than this, once made plain, is not a word JMdict has: it is answered with no words and fetches nothing. */
export const MAX_TEXT = 100;

/**
 * A text that is already plain: kana (with ー), kanji and ASCII letters and digits, each of which NFKC leaves as it is. It is nearly
 * every lookup, so it is answered without the work the rest take.
 */
const PLAIN = /^[\u3041-\u3096\u30A1-\u30FA\u30FC\u3400-\u4DBF\u4E00-\u9FFF々a-zA-Z0-9]+$/;

/** Characters that draw nothing: controls, zero-width and bidirectional marks, variation selectors, tag characters. */
// biome-ignore lint/complexity/useRegexLiterals: as a literal, the formatter rewrites these escapes as the raw invisible characters.
const INVISIBLE = new RegExp(
  String.raw`[\u0000-\u0008\u000E-\u001F\u007F-\u009F\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFFB\u{E0000}-\u{E0FFF}]`,
  "gu",
);
/** A character of Japanese: kana, kanji, the iteration mark, and the half-width kana that normalising has already made full-width. */
const JAPANESE = "[\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF々〆\\u{20000}-\\u{2FA1F}]";
const SPACE_BY_JAPANESE = new RegExp(`\\s(?=${JAPANESE})|(?<=${JAPANESE})\\s`, "gu");
/** A dash between kana, or ending a word of kana, is the long vowel mark, however it was typed (ｰ, -, ‐, –, —, ―, ─, －, −). ウラン-238 is not one. */
const DASH_AFTER_KANA = /(?<=[ぁ-ゖァ-ヺー])[-‐‑‒–—―─━－−](?=[ぁ-ゖァ-ヺー]|$)/g;

/**
 * A text made plain for a lookup: composed and compatibility forms folded together (NFKC, so full-width letters and digits become
 * half-width and half-width kana full-width), whitespace collapsed to single spaces and trimmed, spaces beside Japanese removed,
 * invisible and control characters removed, and a dash between kana, or ending kana, made the long vowel mark ー. Kana are not folded: that is
 * `foldKana`'s. Anything that is not a string, and a text longer than a word can be, gives an empty text.
 *
 * @param text - Anything a person typed or pasted.
 * @returns The plain text; empty when there is nothing to look up.
 * @example
 * ```ts
 * import { normalizeText } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(normalizeText("　ｶﾐ\u200B ")); // カミ
 * console.log(normalizeText("コーヒ-")); // コーヒー
 * ```
 */
export function normalizeText(text: string): string {
  if (typeof text !== "string" || text.length > MAX_TEXT * 4) return "";
  if (PLAIN.test(text)) return text.length > MAX_TEXT ? "" : text;
  // One pass can leave a text another pass would change (a dash that became ー has a space to lose beside it), so it is
  // made plain until it stops changing, which is at most a few passes.
  let plain = text;
  for (let pass = 0; pass < 4; pass++) {
    const next = plainOnce(plain);
    if (next === plain) break;
    plain = next;
  }
  return [...plain].length > MAX_TEXT ? "" : plain;
}

function plainOnce(text: string): string {
  return text
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(SPACE_BY_JAPANESE, "")
    .replace(DASH_AFTER_KANA, "ー");
}

/**
 * A text folded to hiragana: the katakana move down, ー and everything else stay. The reading of a loanword is found by either.
 *
 * @param text - Any text.
 * @returns The text with each katakana changed to the hiragana of the same sound.
 * @example
 * ```ts
 * import { foldKana } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(foldKana("カミ")); // かみ
 * ```
 */
export function foldKana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (one) => String.fromCharCode(one.charCodeAt(0) - 0x60));
}

/**
 * What the tables are keyed by, which scripts/words-parse.mjs makes the same way: a written form as NFKC makes it (so １人 and 1人
 * are one key), and a reading as that folded to hiragana.
 */
export const formKey = (text: string): string => (PLAIN.test(text) ? text : text.normalize("NFKC"));
export const readingKey = (text: string): string => foldKana(formKey(text));

const KANA = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

/** Whether a text is kana alone: it is then asked for as a reading, and anything else as a written form. */
export function isKana(text: string): boolean {
  return KANA.test(text);
}

/** What the words are kept and looked up by: a text made plain, and kana folded to hiragana. Any other text stays as it is. */
export function keyOf(text: string): string {
  const plain = normalizeText(text);
  return isKana(plain) ? foldKana(plain) : plain;
}

/**
 * Words too common in English glosses to find anything by: they are not indexed and are left out of a query. The same list as
 * `STOP_WORDS` in scripts/words-tables.mjs, which a test holds to this one.
 */
export const STOP_WORDS: readonly string[] = [
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
const STOPPED: ReadonlySet<string> = new Set(STOP_WORDS);
const TERM = /[\p{L}\p{N}]+(?:'\p{L}+)?/gu;

/** The terms of an English text, in order: lower case, letters and digits, an apostrophe inside a word kept, stop words left out. */
export function termsInOrder(text: string): string[] {
  const found = String(text).normalize("NFKC").replace(/’/g, "'").toLowerCase().match(TERM) ?? [];
  return found.filter((term) => !STOPPED.has(term));
}

/** The terms of an English text, once each: the same rule as `termsOf` in scripts/words-tables.mjs, which a test holds to it. */
export function termsOf(text: string): string[] {
  return [...new Set(termsInOrder(text))];
}
