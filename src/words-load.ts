/** Fetching what JMdict holds for some texts: the pieces of the dictionary they are in, and nothing else. */

import { MANIFEST } from "./data/words/manifest.data.ts";
import { deinflect } from "./deinflect.ts";
import { kanaFromRomaji } from "./romaji.ts";
import type { LoadWordsOptions, WordRow, Words } from "./words.types.ts";
import { checkLists, modeOf } from "./words-filter.ts";
import { extras } from "./words-manifests.ts";
import { formOfLine, pieceOf, piecesFor, readingOfRow } from "./words-pieces.ts";
import { readRow } from "./words-rows.ts";
import { formKey, isKana, keyOf, normalizeText, readingKey } from "./words-text.ts";

type Pieces = Map<number, ReadonlyMap<string, readonly string[]>>;
const NONE: Pieces = new Map();

/**
 * The keys to load for some texts, each once: a text made plain and kana folded, or, for romaji, each kana it could read as. A
 * list that is not a list, a text that is not text and a text with nothing in it are nothing to load, never an error. For
 * `inflected`, the dictionary forms each text could be conjugated from are keys too.
 */
function keysToLoad(texts: unknown, romaji: boolean | undefined, inflected: boolean | undefined): string[] {
  const list: readonly unknown[] = typeof texts === "string" ? [texts] : Array.isArray(texts) ? texts : [];
  const keys = list.flatMap((text) => {
    const plain = normalizeText(typeof text === "string" ? text : "");
    const kana = romaji === true ? kanaFromRomaji(plain) : [];
    const asked = (kana.length > 0 ? kana : [plain]).map(keyOf);
    return inflected === true ? asked.flatMap((key) => [key, ...deinflect(key).map((one) => keyOf(one.base))]) : asked;
  });
  return [...new Set(keys)].filter((key) => key !== "");
}

/**
 * Fetches what JMdict holds for some texts, and nothing else: the pieces of the table those texts are in, about 25 kB gzipped each,
 * so that `wordsOf` can then answer for them with no waiting.
 *
 * A text of kana alone (かみ, カミ) is a reading and costs one piece. Any other text (紙) is a written form: its readings are
 * found first and then their pieces, so it costs one more. Texts already in `previous` cost nothing. A text is made plain first
 * (`normalizeText`), and one that is odd, empty or far too long is nothing to load and never an error. With `romaji: true`, a text
 * of Latin letters is read as romaji (`kami` loads かみ). With `inflected: true` the dictionary forms a text could be conjugated
 * from are loaded as well (食べなかった loads 食べる), so that `inflectedOf` can answer: it costs a few pieces more.
 *
 * Lookups at the same moment for the same pieces share one fetch. A piece that fails is asked for once more, and then this
 * rejects with a `WordsLoadError` that names it; nothing is remembered of a failure, so asking again tries again.
 *
 * In safe mode, the default, nothing is fetched that holds what safe mode leaves out, and none of it is in what comes back. With
 * `mode: "unfiltered"` the pieces of what was left out are fetched as well, one more for each, and the words are everything JMdict
 * has. The consumer's `block` and `allow` lists are laid over either.
 *
 * @param texts - A reading or a written form, or a list of them.
 * @param options - The mode, the lists, `romaji`, `inflected`, and `previous` words, in the same mode, to add to.
 * @returns The words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords(["かみ", "紙"]);
 * console.log(wordsOf(words, "かみ").map((one) => one.written)); // ["紙", "神", "髪", ...]
 * console.log(wordsOf(words, "紙")[0]?.reading); // かみ
 * ```
 */
export async function loadWords(texts: string | readonly string[], options: LoadWordsOptions = {}): Promise<Words> {
  const { previous } = options;
  const mode = options.mode === undefined ? modeOf(previous?.mode) : modeOf(options.mode);
  checkLists(options);
  if (previous?.scope === "common")
    throw new TypeError("The common words hold every text already: there is nothing to add.");
  if (previous !== undefined && previous.mode !== mode)
    throw new TypeError("Words in different modes cannot be added together: load the texts again.");
  const entries = new Map(previous?.entries);
  const wanted = keysToLoad(texts, options.romaji, options.inflected).filter((key) => !entries.has(key));
  const kana = wanted.filter(isKana);
  const written = wanted.filter((key) => !isKana(key));
  const extra = mode === "safe" || wanted.length === 0 ? undefined : await extras();

  // A written form is asked of the index first, which says which readings to fetch.
  const [indexes, extraIndexes] = await Promise.all([
    written.length === 0 ? NONE : piecesFor("forms", MANIFEST.forms, written, formOfLine),
    extra === undefined || written.length === 0 ? NONE : piecesFor("extra-forms", extra.forms, written, formOfLine),
  ]);
  const readingsOf = new Map(
    written.map((text) => {
      const lines =
        extraIndexes.get(pieceOf(extra?.forms.starts ?? [""], text))?.get(text) ??
        indexes.get(pieceOf(MANIFEST.forms.starts, text))?.get(text) ??
        [];
      return [text, lines.flatMap((line) => line.slice(line.indexOf("\t") + 1).split("|"))] as const;
    }),
  );

  const keys = [...new Set([...kana, ...[...readingsOf.values()].flat().map(readingKey)])];
  const [pieces, extraPieces] = await Promise.all([
    keys.length === 0 ? NONE : piecesFor("readings", MANIFEST.readings, keys, readingOfRow),
    extra === undefined || keys.length === 0 ? NONE : piecesFor("extra-readings", extra.readings, keys, readingOfRow),
  ]);
  // What is left out of a reading's answer is whole in the extra pieces, which are then the answer.
  const linesOf = (key: string) =>
    extraPieces.get(pieceOf(extra?.readings.starts ?? [""], key))?.get(key) ??
    pieces.get(pieceOf(MANIFEST.readings.starts, key))?.get(key) ??
    [];

  for (const text of kana) entries.set(text, Object.freeze(linesOf(text).map(readRow)));
  for (const text of written) {
    const found: WordRow[] = (readingsOf.get(text) ?? []).flatMap((reading) =>
      linesOf(readingKey(reading))
        .map(readRow)
        .filter(
          (row) =>
            row.reading === reading &&
            (row.forms.some((form) => formKey(form) === text) || formKey(row.reading) === text),
        ),
    );
    entries.set(text, Object.freeze(found));
  }
  return {
    release: MANIFEST.release,
    scope: "all",
    mode,
    block: options.block ?? previous?.block,
    allow: options.allow ?? previous?.allow,
    entries,
  };
}
