/**
 * Finding words by what they mean in English and by the kanji in them. Each has an index of its own, in small pieces that are
 * fetched only when one of these is asked, so a plain lookup by reading fetches what it always did. An index says which readings
 * to read; the words are then read as `loadWords` reads them, in the same mode and under the same lists.
 */

import { type Kanji, kanjiIn } from "./index.ts";
import type { FindOptions, PieceSet, Word, Words } from "./words.types.ts";
import { checkLists, modeOf } from "./words-filter.ts";
import { loadWords } from "./words-load.ts";
import { allWords } from "./words-lookup.ts";
import { extraIndexes, indexes } from "./words-manifests.ts";
import { formOfLine, indexed, pieceOf, type WordsPieceKind } from "./words-pieces.ts";
import { listed, wordOf } from "./words-rows.ts";
import { formKey, keyOf, normalizeText, termsInOrder, withoutAsides } from "./words-text.ts";

/** The most words a find gives, and so the most pieces of the dictionary it fetches; it is what the index holds for a term. */
export const FIND_MOST = 20;
const FIND_DEFAULT = 10;

/** How many words a find gives: the limit asked for, between 1 and the most, else the default. */
function limitOf(options: FindOptions): number {
  const asked = options.limit;
  return typeof asked === "number" && Number.isFinite(asked)
    ? Math.min(FIND_MOST, Math.max(1, Math.floor(asked)))
    : FIND_DEFAULT;
}

/** The readings an index holds for a key: those of the whole list when the mode asks for everything and the list differs, else the default's. */
async function readingsFor(kind: "meanings" | "kanji", unfiltered: boolean, key: string): Promise<string[]> {
  const line = async (name: WordsPieceKind, set: PieceSet) =>
    (await indexed(name, set, pieceOf(set.starts, key), formOfLine)).get(key)?.[0];
  const [manifest, extra] = await Promise.all([indexes(), unfiltered ? extraIndexes() : undefined]);
  const [plain, whole] = await Promise.all([
    line(kind, manifest[kind]),
    extra === undefined ? undefined : line(`extra-${kind}`, extra[kind]),
  ]);
  const found = whole ?? plain;
  return found === undefined ? [] : found.slice(found.indexOf("\t") + 1).split("|");
}

const containsRun = (hay: readonly string[], needle: readonly string[]) =>
  needle.length > 0 && hay.some((_, at) => needle.every((term, i) => hay[at + i] === term));

/** How well a word answers a search: its first gloss is exactly it, another gloss is, or a gloss only holds it. The index is built the same way. */
const HEADLINE = 0;
const EXACT = 1;
const HOLDS = 2;
/** A word with an exact gloss that is not its first is ranked as if it were this much less common: 飲む (to drink) before 一気 (chug!, drink!). */
const EXACT_PENALTY = 20_000;

/** The tier of a word for a query, or undefined when no gloss of it holds the query. */
function tierOf(word: Word, query: readonly string[]): number | undefined {
  let tier: number | undefined;
  let place = 0;
  for (const sense of word.senses) {
    for (const gloss of sense.glosses) {
      const terms = termsInOrder(gloss);
      const whole = termsInOrder(withoutAsides(gloss));
      if (whole.length === query.length && whole.every((term, i) => term === query[i]))
        tier = Math.min(tier ?? HOLDS, place === 0 ? HEADLINE : EXACT);
      else if (containsRun(terms, query)) tier = Math.min(tier ?? HOLDS, HOLDS);
      place++;
    }
  }
  return tier;
}

/**
 * The words already loaded whose English meaning holds some words, the whole word at a time (`water` is a gloss with the word
 * water in it, `watermelon` is not), the ones whose first gloss is exactly it first, then those with another gloss that is, then the commonest. It reads what is in `words`
 * and fetches nothing: for a table of common words, or words from `loadWords`. `to`, `the`, `a` and the other words every gloss
 * has are left out of the search, so `walk` finds "to walk".
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - English: one word or several that follow each other in a gloss.
 * @returns The words that match, in that order; none for a text with no word to find.
 * @example
 * ```ts
 * import { loadCommonWords, searchMeanings } from "@johnmorrisdotca/jisho/words";
 *
 * const common = await loadCommonWords();
 * console.log(searchMeanings(common, "paper").slice(0, 3).map((one) => one.written)); // ["紙", ...]
 * ```
 */
export function searchMeanings(words: Words, text: string): Word[] {
  const query = termsInOrder(normalizeText(text));
  if (query.length === 0) return [];
  const found: { word: Word; group: number; score: number; at: number }[] = [];
  for (const [at, word] of allWords(words).entries()) {
    const tier = tierOf(word, query);
    if (tier !== undefined)
      found.push({ word, group: tier === HOLDS ? 1 : 0, score: word.rank + (tier === EXACT ? EXACT_PENALTY : 0), at });
  }
  return found.sort((a, b) => a.group - b.group || a.score - b.score || a.at - b.at).map((one) => one.word);
}

/**
 * Words found by what they mean in English, the best answers first. The index holds, for each English term, the readings of twenty
 * words: up to ten whose gloss is exactly the term (`drink` is the first gloss of 飲む, "to drink"), the commonest first, then the
 * commonest that merely have it (every word JMdict ranks has all of its terms; a word it does not rank, only those of its
 * first gloss), so `limit` words cost the term's piece, about 15 kB gzipped, and at most that many pieces of the dictionary.
 *
 * A text of several words finds the words whose glosses hold them one after the other (the index has every pair of terms that
 * follow each other in the gloss of a word JMdict ranks, and no more). The words are in the mode asked for, and the `block` and `allow` lists are laid over them, as for `loadWords`. Words every gloss has
 * (`to`, `the`, `a`) are left out of the text. A piece that cannot be fetched rejects with a `WordsLoadError`.
 *
 * @param text - English: `water`, `go out`.
 * @param options - The mode, the lists, and the most words to give (10 unless given, and no more than 20).
 * @returns The words, the ones whose gloss is exactly the text first (a word's first gloss before a later one), then the commonest; none when nothing matches.
 * @example
 * ```ts
 * import { findByMeaning } from "@johnmorrisdotca/jisho/words";
 *
 * const found = await findByMeaning("water", { limit: 5 });
 * console.log(found.map((one) => `${one.written} ${one.meaning}`)); // ["水 water; fluid; ...", ...]
 * ```
 */
export async function findByMeaning(text: string, options: FindOptions = {}): Promise<Word[]> {
  const mode = modeOf(options.mode);
  checkLists(options);
  const query = termsInOrder(normalizeText(text));
  const first = query[0];
  if (first === undefined) return [];
  // One term is a key of the index; several are found by the first two, which the index keys as they follow each other, and the
  // rest of the phrase is held against the glosses once the words are read.
  const key = query[1] === undefined ? first : `${first} ${query[1]}`;
  const readings = await readingsFor("meanings", mode === "unfiltered", key);
  if (readings.length === 0) return [];
  const limit = limitOf(options);
  const words = await loadWords(readings.slice(0, limit), {
    mode,
    block: options.block,
    allow: options.allow,
  });
  return searchMeanings(words, text).slice(0, limit);
}

/**
 * Words written with a kanji, the commonest first, each shown by the written form that holds the kanji. The index holds the
 * readings of the commonest sixty words with each kanji, so `limit` words cost the kanji's piece, about 15 kB gzipped, and at
 * most that many pieces of the dictionary. Show each word's kanji with `kanjiOfWord`.
 *
 * The words are in the mode asked for, and the `block` and `allow` lists are laid over them, as for `loadWords`. A piece that
 * cannot be fetched rejects with a `WordsLoadError`.
 *
 * @param kanji - A kanji; the first one in the text is used.
 * @param options - The mode, the lists, and the most words to give (10 unless given, and no more than 20).
 * @returns The words, the commonest first; none for a text with no kanji in it, or a kanji no word is written with.
 * @example
 * ```ts
 * import { wordsWithKanji } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await wordsWithKanji("山", { limit: 5 });
 * console.log(words.map((one) => `${one.written} ${one.meaning}`)); // ["山 mountain; hill; ...", ...]
 * ```
 */
export async function wordsWithKanji(kanji: string, options: FindOptions = {}): Promise<Word[]> {
  const mode = modeOf(options.mode);
  checkLists(options);
  const character = kanjiIn(formKey(normalizeText(kanji)))[0];
  if (character === undefined) return [];
  const readings = await readingsFor("kanji", mode === "unfiltered", character);
  const limit = limitOf(options);
  const asked = readings.slice(0, limit);
  const words = await loadWords(asked, { mode, block: options.block, allow: options.allow });
  const found = asked.flatMap((reading) =>
    (words.entries.get(keyOf(reading)) ?? []).flatMap((row) => {
      const form = row.forms.find((one) => formKey(one).includes(character));
      return form === undefined || row.reading !== reading ? [] : [wordOf(row, form)];
    }),
  );
  return listed(found, words).slice(0, limit);
}

/**
 * The entries of the kanji table for the kanji a word is written with, once each, in the order they appear: so a word can show
 * its kanji with their grade, JLPT level, readings and meanings. A kanji the table does not hold is left out, and a word with no
 * kanji (it is written in kana) has none. A word usually written in kana is looked at by its commonest written form.
 *
 * @param word - A word a lookup returned.
 * @param kanji - The rows of the table, from `readKanji(KANJI)`.
 * @returns The kanji of the word, in order.
 * @example
 * ```ts
 * import { readKanji } from "@johnmorrisdotca/jisho";
 * import { KANJI } from "@johnmorrisdotca/jisho/kanji";
 * import { kanjiOfWord, loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const word = wordsOf(await loadWords("やま"), "やま")[0];
 * console.log(word && kanjiOfWord(word, readKanji(KANJI)).map((one) => `${one.kanji} grade ${one.grade}`)); // ["山 grade 1"]
 * ```
 */
export function kanjiOfWord(word: Word, kanji: readonly Kanji[]): Kanji[] {
  const table = new Map(kanji.map((one) => [one.kanji, one]));
  const text = kanjiIn(word.written).length > 0 ? word.written : (word.forms[0] ?? "");
  return kanjiIn(text).flatMap((one) => table.get(one) ?? []);
}
