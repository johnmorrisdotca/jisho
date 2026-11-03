/** A study list from a text that was read: each word once, in the order it came, ready to copy or save. */

import type { JlptLevel, SchoolGrade } from "./index.ts";
import type { ReadResult } from "./reader.ts";

/**
 * One word of a study list.
 *
 * @example
 * ```ts
 * import type { StudyRow } from "@johnmorrisdotca/jisho/words";
 *
 * const row: StudyRow = { written: "食べる", reading: "たべる", meaning: "to eat", level: "N5", grade: 2, count: 1, example: "食べなかった" };
 * console.log(row.written);
 * ```
 */
export type StudyRow = {
  /** The dictionary form, as JMdict's commonest spelling shows it. */
  readonly written: string;
  /** How the dictionary form is read, in kana. */
  readonly reading: string;
  /** Its short English meaning. */
  readonly meaning: string;
  /** The hardest JLPT level among its kanji, or null. */
  readonly level: JlptLevel | null;
  /** The highest school grade among its kanji (1 to 6, then 8 for secondary school, 9 and 10 for names), or null. */
  readonly grade: SchoolGrade | null;
  /** How many times the text has it, in any form. */
  readonly count: number;
  /** The first place the text has it, as written: 食べなかった for 食べる. */
  readonly example: string;
};

/**
 * The words of a text that was read, once each in the order they came, each with how often it came and the form it first came in. Unknown
 * stretches and things that are not Japanese are not words and are left out.
 *
 * @param result - What `readText` gave back.
 * @param options - `kanjiOnly: true` leaves out the words with no kanji (particles and the like), which a learner rarely needs listed.
 * @returns The rows.
 * @example
 * ```ts
 * import { readText, studyList } from "@johnmorrisdotca/jisho/words";
 *
 * const rows = studyList(await readText("食べた。食べない。"));
 * console.log(rows.map((row) => `${row.written} ${row.count}`)); // ["食べる 2"]
 * ```
 */
export function studyList(result: ReadResult, options: { readonly kanjiOnly?: boolean } = {}): StudyRow[] {
  const rows = new Map<string, StudyRow>();
  for (const token of result.tokens) {
    if (token.kind !== "word" || token.word === null) continue;
    if (options.kanjiOnly === true && token.kanji.length === 0) continue;
    const key = `${token.word.written}\t${token.word.reading}`;
    const had = rows.get(key);
    if (had !== undefined) {
      rows.set(key, { ...had, count: had.count + 1 });
      continue;
    }
    const grades = token.kanji.flatMap((one) => (one.grade === null ? [] : [one.grade]));
    rows.set(key, {
      written: token.word.written,
      reading: token.word.reading,
      meaning: token.meaning,
      level: token.level,
      grade: grades.length === 0 ? null : (Math.max(...grades) as SchoolGrade),
      count: 1,
      example: token.text,
    });
  }
  return [...rows.values()];
}

const COLUMNS = ["written", "reading", "meaning", "level", "grade", "count", "example"] as const;

/**
 * A study list as text: `csv` has a header line and quotes what needs it, for a spreadsheet; `tsv` has no header and tabs, to paste
 * into a spreadsheet or to import into a flashcard program. Lines end with a line feed; an empty level or grade is an empty field.
 *
 * @param rows - From `studyList`.
 * @param format - `"csv"` or `"tsv"`.
 * @returns The text, ending in a line feed, or empty for no rows.
 * @example
 * ```ts
 * import { studyListText } from "@johnmorrisdotca/jisho/words";
 *
 * const row = { written: "水", reading: "みず", meaning: "water", level: "N5", grade: 1, count: 1, example: "水" } as const;
 * console.log(studyListText([row], "csv")); // written,reading,meaning,level,grade,count,example ...
 * ```
 */
export function studyListText(rows: readonly StudyRow[], format: "csv" | "tsv"): string {
  if (rows.length === 0) return "";
  const field = (value: string | number | null): string => {
    const text = value === null ? "" : String(value);
    if (format === "tsv") return text.replace(/[\t\r\n]+/g, " ");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = rows.map((row) => COLUMNS.map((name) => field(row[name])).join(format === "csv" ? "," : "\t"));
  return `${[...(format === "csv" ? [COLUMNS.join(",")] : []), ...lines].join("\n")}\n`;
}
