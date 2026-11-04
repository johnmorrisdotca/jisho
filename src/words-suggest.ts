/**
 * Typo-tolerant lookup: the common words whose reading is one slip away from what was typed. A lookup is exact, so a typo finds nothing;
 * this is what to ask when it finds nothing. It reads the table of the common words, which it fetches once, so it covers the 26,000 words
 * a person is most likely to mean, and nothing else.
 */

import { kanaFromRomaji } from "./romaji.ts";
import type { Word, WordsMode, WordsOptions } from "./words.types.ts";
import { loadCommonWords } from "./words-common.ts";
import { checkLists, modeOf } from "./words-filter.ts";
import { wordsOf } from "./words-lookup.ts";
import { foldKana, normalizeText } from "./words-text.ts";

/** The most suggestions asked for. */
export const SUGGEST_MOST = 20;
const SUGGEST_DEFAULT = 5;
const LONGEST = 40;
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const KANA = `あいうえおかきくけこがぎぐげごさしすせそざじずぜぞたちつてとだぢづでどなにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよらりるれろわをんぁぃぅぇぉっゃゅょー`;

/**
 * A word `suggestWords` found, and how many slips from what was typed it is.
 *
 * @example
 * ```ts
 * import type { Suggestion } from "@johnmorrisdotca/jisho/words";
 *
 * const one: Suggestion = { word: { written: "紙", reading: "かみ", forms: ["紙"], meaning: "paper", senses: [], kinds: "", common: true, rank: 1250, priority: [] }, distance: 1 };
 * console.log(one.distance);
 * ```
 */
export type Suggestion = {
  /** The word. */
  readonly word: Word;
  /** 0 for a word that is exactly what was typed, 1 for a word one slip away: a letter or kana too many, too few, wrong, or two next to each other the wrong way round. */
  readonly distance: 0 | 1;
};

/** Every text one slip from `text`, over an alphabet: a letter left out, put in, changed, or two neighbours swapped. */
function slips(text: string, alphabet: readonly string[]): Set<string> {
  const chars = [...text];
  const out = new Set<string>();
  for (let at = 0; at <= chars.length; at++) {
    const [head, tail] = [chars.slice(0, at), chars.slice(at)];
    if (tail.length > 0) out.add([...head, ...tail.slice(1)].join(""));
    if (tail.length > 1) out.add([...head, tail[1] as string, tail[0] as string, ...tail.slice(2)].join(""));
    for (const letter of alphabet) {
      out.add([...head, letter, ...tail].join(""));
      if (tail.length > 0) out.add([...head, letter, ...tail.slice(1)].join(""));
    }
  }
  out.delete(text);
  out.delete("");
  return out;
}

const isLatin = (text: string) => /^[a-zA-Z'ōūāīēôûâîê -]+$/.test(text);
const isKana = (text: string) => /^[ぁ-ゖゝ-ゟァ-ヺー]+$/.test(text);

/** The readings, in kana, a text could be meant as: itself first, then one slip from it. Romaji slips are slips of letters; kana slips are of kana. */
function readingsFor(text: string): { reading: string; distance: 0 | 1 }[] {
  const found = new Map<string, 0 | 1>();
  const add = (reading: string | undefined, distance: 0 | 1) => {
    if (reading !== undefined && reading !== "" && !found.has(reading)) found.set(reading, distance);
  };
  if (isKana(text)) {
    const own = foldKana(text);
    add(own, 0);
    for (const one of slips(own, [...KANA])) add(one, 1);
  } else if (isLatin(text)) {
    const own = text.toLowerCase();
    for (const kana of kanaFromRomaji(own).slice(0, 4)) add(kana, 0);
    for (const slip of slips(own, [...LETTERS])) for (const kana of kanaFromRomaji(slip).slice(0, 2)) add(kana, 1);
  }
  return [...found].map(([reading, distance]) => ({ reading, distance }));
}

const held = new Map<WordsMode, ReturnType<typeof loadCommonWords>>();

/**
 * The common words nearest to a text that may have a typo in it, the exact ones first and then those one slip away, the commonest first.
 * `kamii` suggests かみ, `tabemsu` suggests 食べます and `にほんこ` suggests 日本語; a text of kanji suggests nothing, because a kanji is not
 * a slip away from another. It covers the 26,000 common words, from one table of about 800 kB gzipped that it fetches once (a second
 * in unfiltered mode), and it is for a lookup that found nothing, not for every lookup.
 *
 * @param text - Romaji or kana, with a slip in it or not.
 * @param options - `mode` (safe unless you say `"unfiltered"`), `limit` (5 unless given, 20 at most), and the consumer's `block` and `allow` lists.
 * @returns The suggestions; none for a text that is not romaji or kana, that is empty, or longer than 40 characters.
 * @example
 * ```ts
 * import { suggestWords } from "@johnmorrisdotca/jisho/words";
 *
 * const found = await suggestWords("tabemsu");
 * console.log(found.map((one) => one.word.written)); // ["食べます", ...]
 * ```
 */
export async function suggestWords(
  text: string,
  options: WordsOptions & { readonly limit?: number } = {},
): Promise<Suggestion[]> {
  const mode = modeOf(options.mode);
  checkLists(options);
  const clean = normalizeText(text);
  if (clean === "" || [...clean].length > LONGEST) return [];
  const candidates = readingsFor(clean);
  if (candidates.length === 0) return [];
  const asked = options.limit;
  const limit =
    typeof asked === "number" && Number.isFinite(asked)
      ? Math.min(SUGGEST_MOST, Math.max(1, Math.floor(asked)))
      : SUGGEST_DEFAULT;
  const useCache = options.block === undefined && options.allow === undefined;
  let loading = useCache ? held.get(mode) : undefined;
  if (loading === undefined) {
    loading = loadCommonWords({ mode, block: options.block, allow: options.allow });
    if (useCache) {
      held.set(mode, loading);
      loading.catch(() => held.delete(mode));
    }
  }
  const words = await loading;
  const found = new Map<string, Suggestion>();
  for (const { reading, distance } of candidates) {
    for (const word of wordsOf(words, reading)) {
      const key = `${word.written}\t${word.reading}`;
      const known = found.get(key);
      if (known === undefined || known.distance > distance) found.set(key, { word, distance });
    }
  }
  return [...found.values()].sort((a, b) => a.distance - b.distance || a.word.rank - b.word.rank).slice(0, limit);
}
