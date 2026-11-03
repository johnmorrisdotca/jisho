/** Looking up what has been loaded: no waiting, and a mistake in the caller is an error, never an empty answer. */

import { kanaFromRomaji } from "./romaji.ts";
import type { LookupOptions, Word, WordRow, Words } from "./words.types.ts";
import { listed, shown, shownAs, wordOf } from "./words-rows.ts";
import { isKana, keyOf } from "./words-text.ts";

/** The keys a text is kept under: itself, or, asked as romaji, each kana it could read as. */
export function keysFor(text: string, romaji: boolean | undefined): string[] {
  const plain = romaji === true ? kanaFromRomaji(text) : [];
  const keys = plain.length > 0 ? [...new Set(plain.map(keyOf))] : [keyOf(text)];
  return keys.filter((key) => key !== "");
}

/**
 * The words for a text that has been loaded, the commonest first.
 *
 * A text of kana alone is a reading, and hiragana and katakana find the same words (カミ finds かみ). Any other text is a written
 * form. The text is made plain first (`normalizeText`): full-width and half-width, stray spaces and invisible characters make no
 * difference. With `romaji: true`, a text of Latin letters is read as romaji, as it must have been loaded. Nothing here waits: a
 * text that was not loaded is a mistake in the caller, so it throws instead of answering with no words, which would say the
 * dictionary has none.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form that was loaded.
 * @param options - `romaji: true` to read Latin letters as romaji.
 * @returns The words, none when the dictionary (or, for the common words, the common table) holds none, or none that the mode and
 *   the lists let through.
 * @example
 * ```ts
 * import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords(["かみ"]);
 * console.log(wordsOf(words, "かみ").slice(0, 3).map((one) => `${one.written} ${one.meaning}`));
 * ```
 */
export function wordsOf(words: Words, text: string, options: LookupOptions = {}): Word[] {
  const found: Word[] = [];
  const seen = new Set<WordRow>();
  for (const key of keysFor(text, options.romaji)) {
    const rows = words.entries.get(key);
    if (rows === undefined) {
      if (words.scope === "common") continue;
      throw new RangeError(`"${text}" was not loaded: ask loadWords for it before wordsOf.`);
    }
    const asked = !isKana(key);
    for (const row of rows) {
      if (seen.has(row)) continue;
      seen.add(row);
      found.push(wordOf(row, asked ? shownAs(row, key) : shown(row)));
    }
  }
  return listed(found, words);
}

/**
 * The meaning of the commonest word a text has, or null: a text with no word, or none that the mode and the lists let through,
 * has no meaning, and the answer is never a placeholder.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form that was loaded.
 * @param options - `romaji: true` to read Latin letters as romaji.
 * @returns The meaning, or null.
 * @example
 * ```ts
 * import { loadWords, meaningOf } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(meaningOf(await loadWords(["紙"]), "紙")); // paper
 * ```
 */
export function meaningOf(words: Words, text: string, options: LookupOptions = {}): string | null {
  return wordsOf(words, text, options)[0]?.meaning ?? null;
}

/**
 * Whether a text has been loaded, so that `wordsOf` can answer for it.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form.
 * @param options - `romaji: true` to read Latin letters as romaji.
 * @returns True when `wordsOf` will answer. A common table answers for every text, and so does a text with nothing in it to look up.
 * @example
 * ```ts
 * import { isLoaded, loadWords } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(isLoaded(await loadWords(["かみ"]), "かみ")); // true
 * ```
 */
export function isLoaded(words: Words, text: string, options: LookupOptions = {}): boolean {
  return words.scope === "common" || keysFor(text, options.romaji).every((key) => words.entries.has(key));
}

/**
 * Every word that has been loaded, once each, the commonest first for the common table. For a search that reads the meanings too.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @returns The words.
 * @example
 * ```ts
 * import { allWords, loadCommonWords } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(allWords(await loadCommonWords()).length); // about 26,000
 * ```
 */
export function allWords(words: Words): Word[] {
  const seen = new Set<WordRow>();
  const out: Word[] = [];
  for (const rows of words.entries.values()) {
    for (const row of rows) {
      if (seen.has(row)) continue;
      seen.add(row);
      out.push(wordOf(row, shown(row)));
    }
  }
  return listed(out, words);
}
