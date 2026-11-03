/**
 * Words: the Japanese words of JMdict, looked up by reading (かみ) or by written form (紙), by what they mean in English or by a
 * kanji in them, each with a short English meaning, its senses with the marks JMdict gives them, and how common it is. The table
 * is cut into small pieces and a lookup fetches only the pieces it needs, so a page asks for one word and downloads a few
 * kilobytes, not the dictionary. Import this entry only where a lookup is made: a server that bundles it carries every piece.
 *
 * The parts are in `words-load.ts` (fetching), `words-lookup.ts` (reading what was fetched), `words-search.ts` (by meaning and by
 * kanji), `words-common.ts` (the common words as one table), `words-pieces.ts` (the pieces and the error), `words-rows.ts` and
 * `words-text.ts` (what a row and a text are), `words-filter.ts` (the tools for what a lookup returned) and `romaji.ts`.
 */

export { kanaFromRomaji, romajiToKana } from "./romaji.ts";
export type {
  FindOptions,
  IndexManifest,
  LoadWordsOptions,
  LookupOptions,
  PackedPatch,
  PackedWords,
  PieceSet,
  Sense,
  Word,
  WordRow,
  Words,
  WordsManifest,
  WordsMode,
  WordsOptions,
  WordsPiece,
} from "./words.types.ts";
export { loadCommonWords, readCommonWords } from "./words-common.ts";
export { hasMarks, meaningFrom, onlyWords, SAFE_MARKS, withoutMarks, withoutWords } from "./words-filter.ts";
export { loadWords } from "./words-load.ts";
export { allWords, isLoaded, meaningOf, wordsOf } from "./words-lookup.ts";
export { WordsLoadError, type WordsPieceKind } from "./words-pieces.ts";
export { commonestFirst, priorityTags, rankOfTags, readRow } from "./words-rows.ts";
export { findByMeaning, kanjiOfWord, searchMeanings, wordsWithKanji } from "./words-search.ts";
export { foldKana, normalizeText } from "./words-text.ts";
