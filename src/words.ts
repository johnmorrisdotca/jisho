/**
 * Words: the Japanese words of JMdict, looked up by reading (かみ) or by written form (紙), each with a short English meaning and its
 * senses, each sense with the marks JMdict gives it. The table is cut into small pieces and a lookup fetches only the pieces it
 * needs, so a page asks for one word and downloads a few kilobytes, not the dictionary. Import this entry only where a lookup is
 * made: a server that bundles it carries every piece.
 */

import { MANIFEST } from "./data/words/manifest.data.ts";
import { foldKana, meaningFrom, onlyWords, withoutWords } from "./words-filter.ts";

export { foldKana, hasMarks, meaningFrom, onlyWords, SAFE_MARKS, withoutMarks, withoutWords } from "./words-filter.ts";

/**
 * A table of words as an entry point exports it: where it was made from, the JMdict release, and one string a row. A row is the
 * reading, the written forms joined by "|", flags, then one field for each sense, apart by tabs. A sense is its marks joined by
 * commas, then its glosses, apart by "¦".
 *
 * @example
 * ```ts
 * import type { PackedWords } from "@johnmorrisdotca/jisho/words";
 *
 * const table: PackedWords = { source: "JMdict", release: "2026-11-02", rows: ["かみ\t紙\tC\t¦paper"] };
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
 * What to do to the common words that safe mode keeps to have every common word as JMdict has it: each edit is a position, then "r"
 * to replace the row there or "i" to insert one before it, then the row, apart by tabs.
 *
 * @example
 * ```ts
 * import type { PackedPatch } from "@johnmorrisdotca/jisho/words";
 *
 * const patch: PackedPatch = { source: "JMdict", release: "2026-11-02", edits: ["0\ti\tあ\tC\t¦ah"] };
 * console.log(patch.edits.length);
 * ```
 */
export type PackedPatch = {
  readonly source: string;
  readonly release: string;
  readonly edits: readonly string[];
};

/**
 * One piece of the table: rows by reading, or written forms with their readings, whichever file it came from.
 *
 * @example
 * ```ts
 * import type { WordsPiece } from "@johnmorrisdotca/jisho/words";
 *
 * const piece: WordsPiece = { rows: ["かみ\t紙\tC\t¦paper"] };
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
 * import type { PieceSet } from "@johnmorrisdotca/jisho/words";
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
 * Where the pieces of the dictionary are.
 *
 * @example
 * ```ts
 * import type { WordsManifest } from "@johnmorrisdotca/jisho/words";
 *
 * const empty: WordsManifest["readings"] = { starts: [""], load: [async () => ({ rows: [] })] };
 * console.log(empty.starts);
 * ```
 */
export type WordsManifest = {
  readonly source: string;
  readonly release: string;
  /** How many rows the pieces hold. */
  readonly rowCount: number;
  /** The rows, cut by reading folded to hiragana. */
  readonly readings: PieceSet;
  /** An index from each written form to its readings. */
  readonly forms: PieceSet;
};

/**
 * One sense of a word: the marks JMdict gives it, and its glosses, the plain one first. A mark is a JMdict code: a kind of usage
 * such as `vulg`, `X`, `sens`, `derog`, `col`, `sl`, `arch`, `obs`, `uk`, a field such as `food` or `med`, or a dialect such as `ksb`.
 *
 * @example
 * ```ts
 * import type { Sense } from "@johnmorrisdotca/jisho/words";
 *
 * const sense: Sense = { marks: ["col"], glosses: ["paper"] };
 * console.log(sense.marks);
 * ```
 */
export type Sense = {
  /** The marks JMdict gives the sense. */
  readonly marks: readonly string[];
  /** Up to three glosses, the plain one first. */
  readonly glosses: readonly string[];
};

/**
 * One word as a lookup gives it.
 *
 * @example
 * ```ts
 * import type { Word } from "@johnmorrisdotca/jisho/words";
 *
 * const word: Word = { written: "紙", reading: "かみ", forms: ["紙"], meaning: "paper", senses: [{ marks: [], glosses: ["paper"] }], kinds: "", common: true };
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
  /** Its first four senses, each with its marks and glosses. The meaning is made from these. */
  readonly senses: readonly Sense[];
  /** The kinds of word it is, as letters: g godan, i ichidan, a i-adjective, s suru, k kuru. Empty for any other. */
  readonly kinds: string;
  /** Whether JMdict marks it as a common word. */
  readonly common: boolean;
};

/**
 * A row read from a table. Read it with `wordsOf`.
 *
 * @example
 * ```ts
 * import { readRow } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(readRow("かみ\t紙\tC\t¦paper").reading);
 * ```
 */
export type WordRow = {
  readonly reading: string;
  readonly forms: readonly string[];
  readonly senses: readonly Sense[];
  readonly kinds: string;
  readonly common: boolean;
  readonly usuallyKana: boolean;
};

/**
 * Which words a lookup gives: `"safe"` (the default) leaves out every sense JMdict marks vulgar, X-rated, sensitive or derogatory,
 * and the written forms, readings and words that only such senses give; `"unfiltered"` is everything JMdict has.
 *
 * @example
 * ```ts
 * import type { WordsMode } from "@johnmorrisdotca/jisho/words";
 *
 * const mode: WordsMode = "unfiltered";
 * console.log(mode);
 * ```
 */
export type WordsMode = "safe" | "unfiltered";

/**
 * How words are looked up: the mode, and the consumer's own lists. Jisho keeps no list of words of its own.
 *
 * @example
 * ```ts
 * import type { WordsOptions } from "@johnmorrisdotca/jisho/words";
 *
 * const options: WordsOptions = { mode: "safe", block: ["神"] };
 * console.log(options.mode);
 * ```
 */
export type WordsOptions = {
  /**
   * `"safe"` unless you say `"unfiltered"`. Safe fetches only files that hold none of what it leaves out, and so fetches less;
   * unfiltered fetches one file more for each piece, and gives everything.
   */
  readonly mode?: WordsMode;
  /** Readings and written forms to leave out, on top of the mode. A reading that several words share names all of them. Applied only when given. */
  readonly block?: readonly string[];
  /** Readings and written forms to keep and nothing else, on top of the mode and the block list. Applied only when given; an empty list keeps none. */
  readonly allow?: readonly string[];
};

/**
 * How `loadWords` is asked.
 *
 * @example
 * ```ts
 * import type { LoadWordsOptions } from "@johnmorrisdotca/jisho/words";
 *
 * const options: LoadWordsOptions = { mode: "safe" };
 * console.log(options.mode);
 * ```
 */
export type LoadWordsOptions = WordsOptions & {
  /** Words loaded before, in the same mode: what they hold is kept, and pieces they came from are not fetched again. */
  readonly previous?: Words;
};

/**
 * Words that have been loaded, ready for a lookup that waits for nothing. Make one with `loadWords` or `loadCommonWords`.
 *
 * @example
 * ```ts
 * import type { Words } from "@johnmorrisdotca/jisho/words";
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
  /** The mode they were loaded in. */
  readonly mode: WordsMode;
  /** The block list they were loaded with, if any. */
  readonly block: readonly string[] | undefined;
  /** The allow list they were loaded with, if any. */
  readonly allow: readonly string[] | undefined;
  /** The rows found for each text, by the key `wordsOf` makes of it. Read it with `wordsOf`. */
  readonly entries: ReadonlyMap<string, readonly WordRow[]>;
};

const KANA = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

/** Whether a text is kana alone: it is then asked for as a reading, and anything else as a written form. */
function isKana(text: string): boolean {
  return KANA.test(text);
}

/** What `wordsOf` looks a text up by: kana are folded to hiragana, any other text stays as it is. */
function keyOf(text: string): string {
  return isKana(text) ? foldKana(text) : text;
}

/** A sense out of the field it is stored as: its marks, then its glosses. */
function readSense(field: string): Sense {
  const [marks = "", ...glosses] = field.split("¦");
  return { marks: marks === "" ? [] : marks.split(","), glosses };
}

/**
 * A row read out of the string it is stored as.
 *
 * @param line - One string of a table's `rows`.
 * @returns The row.
 * @example
 * ```ts
 * import { readRow } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(readRow("かみ\t紙\tC\t¦paper").forms); // ["紙"]
 * ```
 */
export function readRow(line: string): WordRow {
  const [reading = "", forms = "", flags = "", ...senses] = line.split("\t");
  return {
    reading,
    forms: forms === "" ? [] : forms.split("|"),
    senses: senses.map(readSense),
    kinds: flags.replace(/[CU]/g, ""),
    common: flags.includes("C"),
    usuallyKana: flags.includes("U"),
  };
}

/** The way to show a row's word when nobody asked for a particular form. */
function shown(row: WordRow): string {
  return row.usuallyKana || row.forms.length === 0 ? row.reading : (row.forms[0] ?? row.reading);
}

/** A row as the word a lookup gives, shown as `written`. */
function wordOf(row: WordRow, written: string): Word {
  return {
    written,
    reading: row.reading,
    forms: row.forms,
    meaning: meaningFrom(row.senses),
    senses: row.senses,
    kinds: row.kinds,
    common: row.common,
  };
}

/** The words of some rows with the consumer's lists laid over them: the block list, then the allow list. Nothing is applied unless it was given. */
function listed(words: Word[], words_: Words): Word[] {
  const blocked = words_.block === undefined ? words : withoutWords(words, words_.block);
  return words_.allow === undefined ? blocked : onlyWords(blocked, words_.allow);
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
export function wordsOf(words: Words, text: string): Word[] {
  const key = keyOf(text);
  const rows = words.entries.get(key);
  if (rows === undefined) {
    if (words.scope === "common") return [];
    throw new RangeError(`"${text}" was not loaded: ask loadWords for it before wordsOf.`);
  }
  const asked = !isKana(text);
  return listed(
    rows.map((row) => wordOf(row, asked ? text : shown(row))),
    words,
  );
}

/**
 * The meaning of the commonest word a text has, or null: a text with no word, or none that the mode and the lists let through,
 * has no meaning, and the answer is never a placeholder.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form that was loaded.
 * @returns The meaning, or null.
 * @example
 * ```ts
 * import { loadWords, meaningOf } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(meaningOf(await loadWords(["紙"]), "紙")); // paper
 * ```
 */
export function meaningOf(words: Words, text: string): string | null {
  return wordsOf(words, text)[0]?.meaning ?? null;
}

/**
 * Whether a text has been loaded, so that `wordsOf` can answer for it.
 *
 * @param words - What `loadWords` or `loadCommonWords` gave back.
 * @param text - A reading or a written form.
 * @returns True when `wordsOf` will answer. A common table answers for every text.
 * @example
 * ```ts
 * import { isLoaded, loadWords } from "@johnmorrisdotca/jisho/words";
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

/** The rows of the common words once a patch has been laid over them: every row as JMdict has it. */
function patchedRows(rows: readonly string[], patch: PackedPatch): string[] {
  const edits = new Map(
    patch.edits.map((edit) => {
      const [at = "", kind = "", ...line] = edit.split("\t");
      return [Number(at), { kind, line: line.join("\t") }] as const;
    }),
  );
  const inserted = [...edits.values()].filter((edit) => edit.kind === "i").length;
  const out: string[] = [];
  let from = 0;
  for (let at = 0; at < rows.length + inserted; at++) {
    const edit = edits.get(at);
    if (edit === undefined) out.push(rows[from++] ?? "");
    else {
      out.push(edit.line);
      if (edit.kind === "r") from++;
    }
  }
  return out;
}

/**
 * The common words as a table the caller already has, read into words: a lookup by reading or written form with no waiting.
 * Only the common words are in it, so a reading shared with a rare word finds the common ones alone.
 *
 * The table holds only what safe mode keeps. To have everything, pass `mode: "unfiltered"` and `extra`, the table that says what
 * to add and change (`COMMON_EXTRA`, from `@johnmorrisdotca/jisho/words-common-extra`); without it that is a mistake and throws.
 *
 * @param table - `COMMON_WORDS`, from `@johnmorrisdotca/jisho/words-common`.
 * @param options - The mode (safe unless you say otherwise), the consumer's lists, and for unfiltered the `extra` table.
 * @returns The words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { readCommonWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 * import { COMMON_WORDS } from "@johnmorrisdotca/jisho/words-common";
 *
 * console.log(wordsOf(readCommonWords(COMMON_WORDS), "紙")[0]?.meaning); // paper
 * ```
 */
export function readCommonWords(
  table: PackedWords,
  options: WordsOptions & { readonly extra?: PackedPatch } = {},
): Words {
  const mode = options.mode ?? "safe";
  if (mode === "unfiltered" && options.extra === undefined)
    throw new TypeError("Unfiltered needs the table of what to add: pass extra, COMMON_EXTRA from words-common-extra.");
  const lines = mode === "safe" || options.extra === undefined ? table.rows : patchedRows(table.rows, options.extra);
  const entries = new Map<string, WordRow[]>();
  const add = (key: string, row: WordRow) => {
    const held = entries.get(key);
    if (held === undefined) entries.set(key, [row]);
    else if (!held.includes(row)) held.push(row);
  };
  for (const line of lines) {
    const row = readRow(line);
    add(foldKana(row.reading), row);
    for (const form of row.forms) add(form, row);
  }
  return { release: table.release, scope: "common", mode, block: options.block, allow: options.allow, entries };
}

/**
 * The common words, fetched in one piece: about 26,000 rows and some 800 kB gzipped, for a page that looks up many words, all of
 * them common. In safe mode that is one file. Unfiltered it is that and one more, of what to add and change. Anything that is not
 * common is `loadWords`.
 *
 * @param options - The mode (safe unless you say otherwise) and the consumer's lists.
 * @returns The common words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { loadCommonWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(wordsOf(await loadCommonWords(), "かみ").map((one) => one.written)); // ["紙", "神", ...]
 * ```
 */
export async function loadCommonWords(options: WordsOptions = {}): Promise<Words> {
  const mode = options.mode ?? "safe";
  const [table, extra] = await Promise.all([
    import("./data/words/common.data.ts").then((one) => one.COMMON_WORDS),
    mode === "safe" ? undefined : import("./data/words/common-extra.data.ts").then((one) => one.COMMON_EXTRA),
  ]);
  return readCommonWords(table, { ...options, mode, extra });
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

/** A table of lines indexed by the key of each. */
function indexLines(lines: readonly string[], keyOfLine: (line: string) => string): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const line of lines) {
    const key = keyOfLine(line);
    const held = index.get(key);
    if (held === undefined) index.set(key, [line]);
    else held.push(line);
  }
  return index;
}

const readingOfRow = (line: string) => foldKana(line.slice(0, line.indexOf("\t")));
const formOfLine = (line: string) => line.slice(0, line.indexOf("\t"));

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
  const made = load().then((piece) => indexLines(piece.rows, keyOfLine));
  fetched.set(`${name}${at}`, made);
  made.catch(() => fetched.delete(`${name}${at}`));
  return made;
}

/** The pieces of what safe mode leaves out: their manifest is fetched only when a lookup asks for everything. */
let extraManifest: Promise<WordsManifest> | undefined;

function extras(): Promise<WordsManifest> {
  if (extraManifest === undefined) {
    const made = import("./data/words/extra-manifest.data.ts").then((one) => one.EXTRA_MANIFEST);
    extraManifest = made;
    made.catch(() => {
      extraManifest = undefined;
    });
  }
  return extraManifest;
}

/** The pieces of a set that hold some keys, fetched together, by the number of each. */
async function piecesFor(
  name: string,
  set: PieceSet,
  keys: Iterable<string>,
  keyOfLine: (line: string) => string,
): Promise<Map<number, ReadonlyMap<string, readonly string[]>>> {
  const at = [...new Set([...keys].map((key) => pieceOf(set.starts, key)))];
  return new Map(await Promise.all(at.map(async (one) => [one, await indexed(name, set, one, keyOfLine)] as const)));
}

/**
 * Fetches what JMdict holds for some texts, and nothing else: the pieces of the table those texts are in, a few kilobytes each,
 * so that `wordsOf` can then answer for them with no waiting.
 *
 * A text of kana alone (かみ, カミ) is a reading and costs one piece. Any other text (紙) is a written form: its readings are
 * found first and then their pieces, so it costs one more. Texts already in `previous` cost nothing.
 *
 * In safe mode, the default, nothing is fetched that holds what safe mode leaves out, and none of it is in what comes back. With
 * `mode: "unfiltered"` the pieces of what was left out are fetched as well, one more for each, and the words are everything JMdict
 * has. The consumer's `block` and `allow` lists are laid over either.
 *
 * @param texts - A reading or a written form, or a list of them.
 * @param options - The mode, the lists, and `previous` words, in the same mode, to add to.
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
  const mode = options.mode ?? previous?.mode ?? "safe";
  if (previous?.scope === "common")
    throw new TypeError("The common words hold every text already: there is nothing to add.");
  if (previous !== undefined && previous.mode !== mode)
    throw new TypeError("Words in different modes cannot be added together: load the texts again.");
  const entries = new Map(previous?.entries);
  const wanted = [...new Set(typeof texts === "string" ? [texts] : texts)].filter((text) => !entries.has(keyOf(text)));
  const kana = wanted.filter(isKana);
  const written = wanted.filter((text) => !isKana(text));
  const extra = mode === "safe" ? undefined : await extras();

  // A written form is asked of the index first, which says which readings to fetch.
  const [indexes, extraIndexes] = await Promise.all([
    piecesFor("forms", MANIFEST.forms, written, formOfLine),
    extra === undefined
      ? new Map<number, ReadonlyMap<string, readonly string[]>>()
      : piecesFor("xforms", extra.forms, written, formOfLine),
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

  const keys = [...new Set([...kana.map(foldKana), ...[...readingsOf.values()].flat().map(foldKana)])];
  const [pieces, extraPieces] = await Promise.all([
    piecesFor("readings", MANIFEST.readings, keys, readingOfRow),
    extra === undefined
      ? new Map<number, ReadonlyMap<string, readonly string[]>>()
      : piecesFor("xreadings", extra.readings, keys, readingOfRow),
  ]);
  // What is left out of a reading's answer is whole in the extra pieces, which are then the answer.
  const linesOf = (key: string) =>
    extraPieces.get(pieceOf(extra?.readings.starts ?? [""], key))?.get(key) ??
    pieces.get(pieceOf(MANIFEST.readings.starts, key))?.get(key) ??
    [];

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
    mode,
    block: options.block ?? previous?.block,
    allow: options.allow ?? previous?.allow,
    entries,
  };
}
