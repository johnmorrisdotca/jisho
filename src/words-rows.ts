/**
 * A row of a table read into the words it gives: the string it is stored as, its priority tags and the rank they make, and the
 * lists a consumer lays over a lookup.
 */

import type { Sense, Word, WordRow, Words } from "./words.types.ts";
import { meaningFrom, onlyWords, withoutWords } from "./words-filter.ts";
import { formKey } from "./words-text.ts";

/** The rank of a word JMdict gives no priority: after every word it does. */
export const UNRANKED = 100_000;

/** The letters a row stores a priority tag as, after "~" in its flags; scripts/words-parse.mjs writes them. */
const TAG_OF_LETTER: Readonly<Record<string, string>> = {
  n: "news1",
  m: "news2",
  i: "ichi1",
  j: "ichi2",
  s: "spec1",
  t: "spec2",
  g: "gai1",
  h: "gai2",
};
const BAND_SIZE = 500;

/**
 * The priority tags a row stores, as JMdict writes them.
 *
 * @param stored - The priority part of a row's flags: tag letters, then the newspaper band's two digits.
 * @returns The tags (`news1`, `ichi1`, `spec2`, `gai1`, `nf05`…); none for a word with no priority.
 * @example
 * ```ts
 * import { priorityTags } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(priorityTags("ni03")); // ["news1", "ichi1", "nf03"]
 * ```
 */
export function priorityTags(stored: string): string[] {
  const letters = [...stored.replace(/\d+$/, "")].flatMap((one) => TAG_OF_LETTER[one] ?? []);
  const band = /\d\d$/.exec(stored)?.[0];
  return band === undefined ? letters : [...letters, `nf${band}`];
}

/** What a stored priority is as a word has it, made once for each: the few hundred combinations there are. */
const MADE = new Map<string, { priority: readonly string[]; rank: number }>();
function priorityOfStored(stored: string): { priority: readonly string[]; rank: number } {
  let made = MADE.get(stored);
  if (made === undefined) {
    const priority = Object.freeze(priorityTags(stored));
    made = { priority, rank: rankOfTags(priority) };
    MADE.set(stored, made);
  }
  return made;
}

/**
 * One number for how common a word is, lower being commoner, made from its priority tags the way JMdict's own bands go: the
 * newspaper band if it has one (`nf01` is 250, and each band adds 500), else 12,000 for the first grade of any list and 24,000
 * for the second, else 100,000 for a word with no priority.
 *
 * @param tags - A word's priority tags, as JMdict writes them.
 * @returns The rank.
 * @example
 * ```ts
 * import { rankOfTags } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(rankOfTags(["news1", "nf03"])); // 1250
 * console.log(rankOfTags([])); // 100000
 * ```
 */
export function rankOfTags(tags: readonly string[]): number {
  const band = tags.map((one) => /^nf(\d\d)$/.exec(one)?.[1]).find((one) => one !== undefined);
  if (band !== undefined) return (Number(band) - 1) * BAND_SIZE + BAND_SIZE / 2;
  if (tags.some((one) => ["news1", "ichi1", "spec1", "gai1"].includes(one))) return 12_000;
  if (tags.some((one) => ["news2", "ichi2", "spec2", "gai2"].includes(one))) return 24_000;
  return UNRANKED;
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
 * console.log(readRow("かみ\t紙\tC~ni03\t¦paper").forms); // ["紙"]
 * ```
 */
export function readRow(line: string): WordRow {
  const [reading = "", forms = "", stored = "", ...senses] = line.split("\t");
  const at = stored.indexOf("~");
  const flags = at === -1 ? stored : stored.slice(0, at);
  return {
    reading,
    forms: forms === "" ? [] : forms.split("|"),
    senses: senses.map(readSense),
    kinds: flags.replace(/[CU]/g, ""),
    common: flags.includes("C"),
    usuallyKana: flags.includes("U"),
    priority: at === -1 ? "" : stored.slice(at + 1),
  };
}

/** The way to show a row's word when it was found by a written form: the form of the row that is that key, else the key. */
export function shownAs(row: WordRow, key: string): string {
  return row.forms.find((form) => formKey(form) === key) ?? key;
}

/** The way to show a row's word when nobody asked for a particular form. */
export function shown(row: WordRow): string {
  return row.usuallyKana || row.forms.length === 0 ? row.reading : (row.forms[0] ?? row.reading);
}

/** A row as the word a lookup gives, shown as `written`. */
export function wordOf(row: WordRow, written: string): Word {
  const { priority, rank } = priorityOfStored(row.priority);
  return {
    written,
    reading: row.reading,
    forms: row.forms,
    meaning: meaningFrom(row.senses),
    senses: row.senses,
    kinds: row.kinds,
    common: row.common,
    rank,
    priority,
  };
}

/** The words of some rows with the consumer's lists laid over them: the block list, then the allow list. Nothing is applied unless it was given. */
export function listed(words: Word[], lists: Pick<Words, "block" | "allow">): Word[] {
  const blocked = lists.block === undefined ? words : withoutWords(words, lists.block);
  return lists.allow === undefined ? blocked : onlyWords(blocked, lists.allow);
}

/**
 * The words with the commonest first, by their rank. A word of equal rank keeps its place.
 *
 * @param words - Words a lookup returned.
 * @returns New words in order of rank; none of the words given is changed.
 * @example
 * ```ts
 * import { commonestFirst, loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("かみ");
 * console.log(commonestFirst(wordsOf(words, "かみ"))[0]?.written); // 紙
 * ```
 */
export function commonestFirst(words: readonly Word[]): Word[] {
  return words
    .map((word, at) => ({ word, at }))
    .sort((a, b) => a.word.rank - b.word.rank || a.at - b.at)
    .map((one) => one.word);
}
