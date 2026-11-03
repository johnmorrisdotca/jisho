/**
 * The shapes of the words: the tables as the data files hold them, and the words a lookup gives. Types only; they are exported
 * from `@johnmorrisdotca/jisho/words`, which is where to import them.
 */

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
 * const word: Word = { written: "紙", reading: "かみ", forms: ["紙"], meaning: "paper", senses: [{ marks: [], glosses: ["paper"] }], kinds: "", common: true, rank: 1250, priority: ["news1", "ichi1", "nf03"] };
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
  /** How common it is, lower being commoner: 1 to 24,000 for a word JMdict gives a priority, and 100,000 for one it does not. */
  readonly rank: number;
  /** The priority tags JMdict gives it, as JMdict writes them (`news1`, `ichi1`, `spec2`, `gai1`, `nf05`…); none for a word it does not rank. */
  readonly priority: readonly string[];
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
  /** The priority tags as a row stores them: letters, then the newspaper band's two digits. Read them with `priorityTags`. */
  readonly priority: string;
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
  /** Read a text of Latin letters as romaji and load the kana it could be (`kami` is かみ). Ask `wordsOf` the same way. Off unless given: `AI` and `CD` are written forms too. */
  readonly romaji?: boolean;
};

/**
 * How a lookup in loaded words is asked.
 *
 * @example
 * ```ts
 * import type { LookupOptions } from "@johnmorrisdotca/jisho/words";
 *
 * const options: LookupOptions = { romaji: true };
 * console.log(options.romaji);
 * ```
 */
export type LookupOptions = {
  /** Read a text of Latin letters as romaji, as `loadWords` was asked to. */
  readonly romaji?: boolean;
};

/**
 * How `findByMeaning` and `wordsWithKanji` are asked: the mode and the lists, as for a lookup, and how many words to give.
 *
 * @example
 * ```ts
 * import type { FindOptions } from "@johnmorrisdotca/jisho/words";
 *
 * const options: FindOptions = { limit: 5, mode: "safe" };
 * console.log(options.limit);
 * ```
 */
export type FindOptions = WordsOptions & {
  /** The most words to give, and so the most pieces of the dictionary to fetch: 10 unless given, and no more than 20. */
  readonly limit?: number;
};

/**
 * Where the pieces of the indexes are that find words by meaning and by kanji. Each key's line says which readings to fetch. The
 * indexes of what safe mode keeps and the indexes of what it leaves out are two manifests of this shape.
 *
 * @example
 * ```ts
 * import type { IndexManifest } from "@johnmorrisdotca/jisho/words";
 *
 * const read = (manifest: IndexManifest) => manifest.meanings.starts.length;
 * console.log(typeof read);
 * ```
 */
export type IndexManifest = {
  readonly source: string;
  readonly release: string;
  /** English terms, each with the readings of the words that have it. */
  readonly meanings: PieceSet;
  /** Kanji, each with the readings of the words written with it. */
  readonly kanji: PieceSet;
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
