/** Words as a sentence writes them: conjugated, and found by the dictionary form they come from. */

import { deinflect } from "./deinflect.ts";
import type { LoadWordsOptions, LookupOptions, Word, Words } from "./words.types.ts";
import { loadWords } from "./words-load.ts";
import { isLoaded, keysFor, wordsOf } from "./words-lookup.ts";

/**
 * A word found for a text, and how the text comes from it.
 *
 * @example
 * ```ts
 * import type { InflectedWord } from "@johnmorrisdotca/jisho/words";
 *
 * const found: InflectedWord = { word: { written: "食べる", reading: "たべる", forms: ["食べる"], meaning: "to eat", senses: [], kinds: "i", common: true, rank: 1, priority: [] }, path: ["negative", "past"] };
 * console.log(found.path.join(", "));
 * ```
 */
export type InflectedWord = {
  /** The dictionary word. */
  readonly word: Word;
  /** What was done to its dictionary form to make the text, innermost first: 食べなかった is `["negative", "past"]`. Empty when the text is the word as the dictionary has it. */
  readonly path: readonly string[];
};

/**
 * The words for a text that is a word as it is written or a conjugated form of one, from words loaded with `inflected: true`: the
 * words the dictionary has for the text itself first (path empty), then each word its ending could come from, and only those of
 * the kind the ending needs, so 食べた finds 食べる (an ichidan verb) and never 食べた's other readings of the ending. A word is
 * given once, by the shortest path. Nothing here waits, and a text loaded without `inflected: true` is a mistake in the caller,
 * so it throws a `RangeError`.
 *
 * @param words - What `loadWords` gave back for the text, with `inflected: true`.
 * @param text - A reading or a written form that was loaded.
 * @param options - `romaji: true` to read Latin letters as romaji, as it must have been loaded.
 * @returns The words with their paths, none when neither the text nor anything it could come from is a word.
 * @example
 * ```ts
 * import { inflectedOf, loadWords } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("食べなかった", { inflected: true });
 * console.log(inflectedOf(words, "食べなかった").map((one) => `${one.word.written} ${one.path.join(", ")}`)); // ["食べる negative, past"]
 * ```
 */
export function inflectedOf(words: Words, text: string, options: LookupOptions = {}): InflectedWord[] {
  const found: InflectedWord[] = [];
  const seen = new Set<string>();
  const add = (word: Word, path: readonly string[]) => {
    const key = `${word.reading}\t${word.written}\t${word.kinds}\t${word.meaning}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ word, path });
  };
  for (const word of wordsOf(words, text, options)) add(word, []);
  for (const key of keysFor(text, options.romaji)) {
    for (const { base, kind, path } of deinflect(key)) {
      if (!isLoaded(words, base)) {
        throw new RangeError(
          `The dictionary forms of "${text}" were not loaded: ask loadWords for it with inflected: true.`,
        );
      }
      for (const word of wordsOf(words, base)) if (word.kinds.includes(kind)) add(word, path);
    }
  }
  return found;
}

/**
 * Looks a text up as it is written or as a conjugated form: 食べなかった finds 食べる, with the path "negative, past". It loads the
 * text and the dictionary forms its ending could come from (a few pieces, about 25 kB gzipped each, where a plain lookup costs
 * one or two), and keeps those that are the kind of word the ending needs. See `inflectedOf` for the details, and
 * `deinflect` for the endings.
 *
 * @param text - A reading or a written form, conjugated or not.
 * @param options - The mode, the lists and `romaji`, as for `loadWords`.
 * @returns The words with their paths, the text's own first.
 * @example
 * ```ts
 * import { findInflected } from "@johnmorrisdotca/jisho/words";
 *
 * const found = await findInflected("食べなかった");
 * console.log(found[0]?.word.written, found[0]?.path.join(", ")); // 食べる negative, past
 * ```
 */
export async function findInflected(
  text: string,
  options: Omit<LoadWordsOptions, "previous" | "inflected"> = {},
): Promise<InflectedWord[]> {
  const words = await loadWords(text, { ...options, inflected: true });
  return inflectedOf(words, text, options.romaji === true ? { romaji: true } : {});
}
