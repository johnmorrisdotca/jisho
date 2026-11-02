/**
 * Words: the Japanese words of JMdict, looked up by reading (かみ) or by written form (紙), each with a short English meaning. The
 * table is cut into small pieces and a lookup fetches only the pieces it needs, so a page asks for one word and downloads a few
 * kilobytes, not the dictionary. Import this entry only where a lookup is made: a server that bundles it carries every piece.
 */

import { MANIFEST } from "./data/words/manifest.data.ts";

/**
 * A table of words as an entry point exports it: where it was made from, the JMdict release, and one string a row. A row is the
 * reading, the written forms joined by "|", the meaning, flags and, where a sense is not for children, the meaning without it,
 * apart by tabs.
 *
 * @example
 * ```ts
 * import type { PackedWords } from "@johnmorrisdotca/moji/words";
 *
 * const table: PackedWords = { source: "JMdict", release: "2026-11-02", rows: ["かみ\t紙\tpaper\tC"] };
 * console.log(table.rows.length);
 * ```
 */
export type PackedWords = {
  /** Where it was made from. */
  readonly source: string;
  /** The date of the JMdict it was made from. */
  readonly release: string;
  /** One string a row. */
  readonly rows: readonly string[];
};

/**
 * One piece of the table: rows by reading, or written forms with their readings, whichever file it came from.
 *
 * @example
 * ```ts
 * import type { WordsPiece } from "@johnmorrisdotca/moji/words";
 *
 * const piece: WordsPiece = { rows: ["かみ\t紙\tpaper\tC"] };
 * console.log(piece.rows.length);
 * ```
 */
export type WordsPiece = {
  /** One string a row. */
  readonly rows: readonly string[];
};

/**
 * The pieces of one kind: the first key of each, in order, and how to fetch each. A key goes in the last piece whose first key is
 * not after it.
 *
 * @example
 * ```ts
 * import type { PieceSet } from "@johnmorrisdotca/moji/words";
 *
 * const set: PieceSet = { starts: [""], load: [async () => ({ rows: [] })] };
 * console.log(set.starts.length);
 * ```
 */
export type PieceSet = {
  readonly starts: readonly string[];
  readonly load: readonly (() => Promise<WordsPiece>)[];
};

/**
 * Where the pieces of the whole dictionary are.
 *
 * @example
 * ```ts
 * import type { WordsManifest } from "@johnmorrisdotca/moji/words";
 *
 * const empty: WordsManifest["readings"] = { starts: [""], load: [async () => ({ rows: [] })] };
 * console.log(empty.starts);
 * ```
 */
export type WordsManifest = {
  readonly source: string;
  readonly release: string;
  /** How many rows the dictionary has in all. */
  readonly rowCount: number;
  /** The rows, cut by reading folded to hiragana. */
  readonly readings: PieceSet;
  /** An index from each written form to its readings. */
  readonly forms: PieceSet;
};

/**
 * One word as a lookup gives it back.
 *
 * @example
 * ```ts
 * import type { Word } from "@johnmorrisdotca/moji/words";
 *
 * const word: Word = { written: "紙", reading: "かみ", forms: ["紙"], meaning: "paper", kinds: "", common: true };
 * console.log(word.meaning);
 * ```
 */
export type Word = {
  /** The way to show it: the form you looked up, else its commonest written form, else the reading when it has no kanji or is usually written in kana. */
  readonly written: string;
  /** How it is read, in the kana JMdict writes it in (katakana for a loanword). */
  readonly reading: string;
  /** Every written form, the commonest first; none for a word with no kanji. */
  readonly forms: readonly string[];
  /** A short English meaning, up to two senses, cut at a whole gloss: "god, deity, divinity; god-tier". */
  readonly meaning: string;
  /** The kinds of word it is, as letters: g godan, i ichidan, a i-adjective, s suru, k kuru. Empty for any other. */
  readonly kinds: string;
  /** Whether JMdict marks it as a common word. */
  readonly common: boolean;
};

/**
 * A row read from a table, with the meaning for children kept beside the meaning. Read it with `wordsOf`.
 *
 * @example
 * ```ts
 * import { readRow } from "@johnmorrisdotca/moji/words";
 *
 * console.log(readRow("かみ\t紙\tpaper\tC").reading);
 * ```
 */
export type WordRow = {
  readonly reading: string;
  readonly forms: readonly string[];
  readonly meaning: string;
  /** The meaning with the senses that are not for children left out; "" when none is left; undefined when it is the same text. */
  readonly kids: string | undefined;
  readonly kinds: string;
  readonly common: boolean;
  readonly usuallyKana: boolean;
};

/**
 * Words that have been loaded, ready for a lookup that waits for nothing. Make one with `loadWords` or `loadCommonWords`.
 *
 * @example
 * ```ts
 * import type { Words } from "@johnmorrisdotca/moji/words";
 *
 * const read = (words: Words) => words.release;
 * console.log(typeof read);
 * ```
 */
export type Words = {
  /** The date of the JMdict release the rows were made from. */
  readonly release: string;
  /** "all" when each text asked for has every word JMdict holds for it; "common" when the table is the common words alone. */
  readonly scope: "all" | "common";
  /** Whether a lookup leaves out the senses that are not for children, unless the call says otherwise. */
  readonly forChildren: boolean;
  /** The rows found for each text, by the key `wordsOf` makes of it. Read it with `wordsOf`. */
  readonly entries: ReadonlyMap<string, readonly WordRow[]>;
};

/**
 * How a lookup treats what is not for children.
 *
 * @example
 * ```ts
 * import type { WordsOptions } from "@johnmorrisdotca/moji/words";
 *
 * const adults: WordsOptions = { forChildren: false };
 * console.log(adults.forChildren);
 * ```
 */
export type WordsOptions = {
  /**
   * Leave out every sense JMdict marks vulgar, X-rated, sensitive or derogatory, and a word with nothing else to say. True unless
   * you say false: a host that shows words to people of any age gets the stricter answer without asking for it.
   */
  readonly forChildren?: boolean;
};

/**
 * How `loadWords` is asked.
 *
 * @example
 * ```ts
 * import type { LoadWordsOptions } from "@johnmorrisdotca/moji/words";
 *
 * const options: LoadWordsOptions = { forChildren: true };
 * console.log(options.forChildren);
 * ```
 */
export type LoadWordsOptions = WordsOptions & {
  /** Words loaded before: what they hold is kept, and pieces they came from are not fetched again. */
  readonly previous?: Words;
};

const KANA = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

/**
 * A text folded to hiragana: the katakana move down, ー and everything else stay. The reading of a loanword is found by either.
 *
 * @param text - Any text.
 * @returns The text with each katakana changed to the hiragana of the same sound.
 * @example
 * ```ts
 * import { foldKana } from "@johnmorrisdotca/moji/words";
 *
 * console.log(foldKana("カミ")); // かみ
 * ```
 */
export function foldKana(text: string): string {
  return text.replace(/[ァ-ヶ]/g, (one) => String.fromCharCode(one.charCodeAt(0) - 0x60));
}

/** Whether a text is kana alone: it is then asked for as a reading, and anything else as a written form. */
function isKana(text: string): boolean {
  return KANA.test(text);
}

/** What `wordsOf` looks a text up by: kana are folded to hiragana, any other text stays as it is. */
function keyOf(text: string): string {
  return isKana(text) ? foldKana(text) : text;
}

/**
 * A row read out of the string it is stored as.
 *
 * @param line - One string of a table's `rows`.
 * @returns The row.
 * @example
 * ```ts
 * import { readRow } from "@johnmorrisdotca/moji/words";
 *
 * console.log(readRow("かみ\t紙\tpaper\tC").forms); // ["紙"]
 * ```
 */
export function readRow(line: string): WordRow {
  const [reading = "", forms = "", meaning = "", flags = "", kids] = line.split("\t");
  return {
    reading,
    forms: forms === "" ? [] : forms.split("|"),
    meaning,
    kids,
    kinds: flags.replace(/[CU]/g, ""),
    common: flags.includes("C"),
    usuallyKana: flags.includes("U"),
  };
}

/** The reading a stored line starts with, without reading the rest of it. */
const readingOfLine = (line: string): string => line.slice(0, line.indexOf("\t"));

/** The way to show a row's word when nobody asked for a particular form. */
function shown(row: WordRow): string {
  return row.usuallyKana || row.forms.length === 0 ? row.reading : (row.forms[0] ?? row.reading);
}

/**
 * The words for a text that has been loaded, the commonest first.
 *
 * A text of kana alone is a reading, and hiragana and katakana find the same words (カミ finds かみ). Any other text is a written
 * form. Nothing here waits: a text that was not loaded is a mistake in the caller, so it throws instead of answering with no
 * words, which would say the dictionary has none.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form that was loaded.
 * @param options - `forChildren` to override what the words were loaded with.
 * @returns The words, none when the dictionary (or, for the common words, the common table) holds none or nothing fit to show.
 * @example
 * ```ts
 * import { loadWords, wordsOf } from "@johnmorrisdotca/moji/words";
 *
 * const words = await loadWords(["かみ"]);
 * console.log(wordsOf(words, "かみ").slice(0, 3).map((one) => `${one.written} ${one.meaning}`));
 * ```
 */
export function wordsOf(words: Words, text: string, options: WordsOptions = {}): Word[] {
  const key = keyOf(text);
  const rows = words.entries.get(key);
  if (rows === undefined) {
    if (words.scope === "common") return [];
    throw new RangeError(`"${text}" was not loaded: ask loadWords for it before wordsOf.`);
  }
  const children = options.forChildren ?? words.forChildren;
  const asked = !isKana(text);
  return rows.flatMap((row) => {
    const meaning = children ? (row.kids ?? row.meaning) : row.meaning;
    if (meaning === "") return [];
    return [
      {
        written: asked ? text : shown(row),
        reading: row.reading,
        forms: row.forms,
        meaning,
        kinds: row.kinds,
        common: row.common,
      },
    ];
  });
}

/**
 * The meaning of the commonest word a text has, or null: a text with no word, or none fit to show, has no meaning, and the answer
 * is never a placeholder.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form that was loaded.
 * @param options - `forChildren` to override what the words were loaded with.
 * @returns The meaning, or null.
 * @example
 * ```ts
 * import { loadWords, meaningOf } from "@johnmorrisdotca/moji/words";
 *
 * console.log(meaningOf(await loadWords(["紙"]), "紙")); // paper
 * ```
 */
export function meaningOf(words: Words, text: string, options: WordsOptions = {}): string | null {
  return wordsOf(words, text, options)[0]?.meaning ?? null;
}

/**
 * Whether a text has been loaded, so that `wordsOf` can answer for it.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form.
 * @returns True when `wordsOf` will answer. A common table answers for every text.
 * @example
 * ```ts
 * import { isLoaded, loadWords } from "@johnmorrisdotca/moji/words";
 *
 * console.log(isLoaded(await loadWords(["かみ"]), "かみ")); // true
 * ```
 */
export function isLoaded(words: Words, text: string): boolean {
  return words.scope === "common" || words.entries.has(keyOf(text));
}

/**
 * Every word that has been loaded, once each, the commonest first for the common table. For a search that reads the meanings too.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param options - `forChildren` to override what the words were loaded with.
 * @returns The words.
 * @example
 * ```ts
 * import { allWords, loadCommonWords } from "@johnmorrisdotca/moji/words";
 *
 * console.log(allWords(await loadCommonWords()).length); // about 26,000
 * ```
 */
export function allWords(words: Words, options: WordsOptions = {}): Word[] {
  const children = options.forChildren ?? words.forChildren;
  const seen = new Set<WordRow>();
  const out: Word[] = [];
  for (const rows of words.entries.values()) {
    for (const row of rows) {
      if (seen.has(row)) continue;
      seen.add(row);
      const meaning = children ? (row.kids ?? row.meaning) : row.meaning;
      if (meaning === "") continue;
      out.push({
        written: shown(row),
        reading: row.reading,
        forms: row.forms,
        meaning,
        kinds: row.kinds,
        common: row.common,
      });
    }
  }
  return out;
}

/**
 * The common words as a table the caller already has, read into words: a lookup by reading or written form with no waiting.
 * Only the common words are in it, so a reading shared with a rare word finds the common ones alone.
 *
 * @param table - `COMMON_WORDS`, from `@johnmorrisdotca/moji/words-common`.
 * @param options - `forChildren`, true unless you say false.
 * @returns The words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { readCommonWords, wordsOf } from "@johnmorrisdotca/moji/words";
 * import { COMMON_WORDS } from "@johnmorrisdotca/moji/words-common";
 *
 * console.log(wordsOf(readCommonWords(COMMON_WORDS), "紙")[0]?.meaning); // paper
 * ```
 */
export function readCommonWords(table: PackedWords, options: WordsOptions = {}): Words {
  const entries = new Map<string, WordRow[]>();
  const add = (key: string, row: WordRow) => {
    const held = entries.get(key);
    if (held === undefined) entries.set(key, [row]);
    else if (!held.includes(row)) held.push(row);
  };
  for (const line of table.rows) {
    const row = readRow(line);
    add(foldKana(row.reading), row);
    for (const form of row.forms) add(form, row);
  }
  return { release: table.release, scope: "common", forChildren: options.forChildren ?? true, entries };
}

/**
 * The common words, fetched in one piece: about 26,000 rows and some 600 kB gzipped, for a page that looks up many words, all of
 * them common. Anything else is `loadWords`.
 *
 * @param options - `forChildren`, true unless you say false.
 * @returns The common words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { loadCommonWords, wordsOf } from "@johnmorrisdotca/moji/words";
 *
 * console.log(wordsOf(await loadCommonWords(), "かみ").map((one) => one.written)); // ["紙", "神", ...]
 * ```
 */
export async function loadCommonWords(options: WordsOptions = {}): Promise<Words> {
  return readCommonWords((await import("./data/words/common.data.ts")).COMMON_WORDS, options);
}

/** The index of the last piece that starts at or before a key. */
function pieceOf(starts: readonly string[], key: string): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if ((starts[middle] ?? "") <= key) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** Pieces already fetched and indexed, by kind and number, so that a second lookup in the same piece fetches nothing. */
const fetched = new Map<string, Promise<ReadonlyMap<string, readonly string[]>>>();

/** A piece, indexed by the key of each of its lines. Failing to fetch it is not remembered. */
function indexed(
  name: string,
  set: PieceSet,
  at: number,
  keyOfLine: (line: string) => string,
): Promise<ReadonlyMap<string, readonly string[]>> {
  const cached = fetched.get(`${name}${at}`);
  if (cached !== undefined) return cached;
  const load = set.load[at];
  if (load === undefined) throw new RangeError(`The ${name} piece ${at} does not exist.`);
  const made = load().then((piece) => {
    const index = new Map<string, string[]>();
    for (const line of piece.rows) {
      const key = keyOfLine(line);
      const held = index.get(key);
      if (held === undefined) index.set(key, [line]);
      else held.push(line);
    }
    return index;
  });
  fetched.set(`${name}${at}`, made);
  made.catch(() => fetched.delete(`${name}${at}`));
  return made;
}

const readingPiece = (at: number) =>
  indexed("readings", MANIFEST.readings, at, (line) => foldKana(readingOfLine(line)));
const formPiece = (at: number) => indexed("forms", MANIFEST.forms, at, (line) => line.slice(0, line.indexOf("\t")));

/**
 * Fetches what JMdict holds for some texts, and nothing else: the pieces of the table those texts are in, a few kilobytes each,
 * so that `wordsOf` can then answer for them with no waiting.
 *
 * A text of kana alone (かみ, カミ) is a reading and costs one piece. Any other text (紙) is a written form: its readings are
 * found first and then their pieces, so it costs one more. Texts already in `previous` cost nothing.
 *
 * @param texts - A reading or a written form, or a list of them.
 * @param options - `forChildren`, true unless you say false, and `previous` words to add to.
 * @returns The words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { loadWords, wordsOf } from "@johnmorrisdotca/moji/words";
 *
 * const words = await loadWords(["かみ", "紙"]);
 * console.log(wordsOf(words, "かみ").map((one) => one.written)); // ["紙", "神", "髪", ...]
 * console.log(wordsOf(words, "紙")[0]?.reading); // かみ
 * ```
 */
export async function loadWords(texts: string | readonly string[], options: LoadWordsOptions = {}): Promise<Words> {
  const { previous } = options;
  if (previous?.scope === "common")
    throw new TypeError("The common words hold every text already: there is nothing to add.");
  const entries = new Map(previous?.entries);
  const wanted = [...new Set(typeof texts === "string" ? [texts] : texts)].filter((text) => !entries.has(keyOf(text)));
  const kana = wanted.filter(isKana);
  const written = wanted.filter((text) => !isKana(text));

  // A written form is asked of the index first, which says which readings to fetch.
  const formAt = [...new Set(written.map((text) => pieceOf(MANIFEST.forms.starts, text)))];
  const indexes = new Map(await Promise.all(formAt.map(async (at) => [at, await formPiece(at)] as const)));
  const readingsOf = new Map(
    written.map((text) => {
      const lines = indexes.get(pieceOf(MANIFEST.forms.starts, text))?.get(text) ?? [];
      return [text, lines.flatMap((line) => line.slice(line.indexOf("\t") + 1).split("|"))] as const;
    }),
  );

  const keys = new Set([...kana.map(foldKana), ...[...readingsOf.values()].flat().map(foldKana)]);
  const pieceAt = [...new Set([...keys].map((key) => pieceOf(MANIFEST.readings.starts, key)))];
  const pieces = new Map(await Promise.all(pieceAt.map(async (at) => [at, await readingPiece(at)] as const)));
  const linesOf = (key: string) => pieces.get(pieceOf(MANIFEST.readings.starts, key))?.get(key) ?? [];

  for (const text of kana) entries.set(foldKana(text), linesOf(foldKana(text)).map(readRow));
  for (const text of written) {
    const found = (readingsOf.get(text) ?? []).flatMap((reading) =>
      linesOf(foldKana(reading))
        .map(readRow)
        .filter((row) => row.reading === reading && (row.forms.includes(text) || row.reading === text)),
    );
    entries.set(text, found);
  }
  return {
    release: MANIFEST.release,
    scope: "all",
    forChildren: options.forChildren ?? previous?.forChildren ?? true,
    entries,
  };
}
