/**
 * Moji: Japanese kanji as data. The school grades, the JLPT levels, the readings and meanings and the pairs that look alike are
 * each an entry point of their own, so a page loads only what it reads; this entry holds the types and the plain functions that
 * read them, and no data.
 */

export { VERSION } from "./version.ts";

/**
 * A school grade as KANJIDIC2 numbers it: 1 to 6 are elementary school, 8 is the rest of the jōyō kanji, taught in secondary school,
 * 9 is the kanji allowed in names (jinmeiyō), 10 is a jinmeiyō variant of a jōyō kanji. There is no 7.
 *
 * @example
 * ```ts
 * import type { SchoolGrade } from "@johnmorrisdotca/moji";
 *
 * const grade: SchoolGrade = 8;
 * console.log(grade);
 * ```
 */
export type SchoolGrade = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10;

/**
 * Every school grade, in order.
 *
 * @example
 * ```ts
 * import { SCHOOL_GRADES } from "@johnmorrisdotca/moji";
 *
 * console.log(SCHOOL_GRADES.length);
 * ```
 */
export const SCHOOL_GRADES: readonly SchoolGrade[] = [1, 2, 3, 4, 5, 6, 8, 9, 10];

/**
 * The grades taught in Japanese elementary school: 1,026 kanji, the kyōiku kanji.
 *
 * @example
 * ```ts
 * import { ELEMENTARY_GRADES } from "@johnmorrisdotca/moji";
 *
 * console.log(ELEMENTARY_GRADES);
 * ```
 */
export const ELEMENTARY_GRADES: readonly SchoolGrade[] = [1, 2, 3, 4, 5, 6];

/**
 * The grades that make up the jōyō kanji, the 2,136 for everyday use.
 *
 * @example
 * ```ts
 * import { JOYO_GRADES } from "@johnmorrisdotca/moji";
 *
 * console.log(JOYO_GRADES);
 * ```
 */
export const JOYO_GRADES: readonly SchoolGrade[] = [1, 2, 3, 4, 5, 6, 8];

/**
 * A JLPT level, N5 the easiest.
 *
 * @example
 * ```ts
 * import type { JlptLevel } from "@johnmorrisdotca/moji";
 *
 * const level: JlptLevel = "N5";
 * console.log(level);
 * ```
 */
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/**
 * Every JLPT level, the easiest first.
 *
 * @example
 * ```ts
 * import { JLPT_LEVELS } from "@johnmorrisdotca/moji";
 *
 * console.log(JLPT_LEVELS);
 * ```
 */
export const JLPT_LEVELS: readonly JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/**
 * The shape of `GRADES`, from `@johnmorrisdotca/moji/grades`.
 *
 * @example
 * ```ts
 * import type { GradeTable } from "@johnmorrisdotca/moji";
 *
 * const table: GradeTable = { source: "KANJIDIC2", release: "2026-10-31", grades: { "1": "一右" } };
 * console.log(table.source);
 * ```
 */
export type GradeTable = {
  /** Where it was made from. */
  readonly source: string;
  /** The date of the KANJIDIC2 it was made from. */
  readonly release: string;
  /** Each grade's kanji, written together. */
  readonly grades: Readonly<Partial<Record<string, string>>>;
};

/**
 * The shape of `JLPT`, from `@johnmorrisdotca/moji/jlpt`.
 *
 * @example
 * ```ts
 * import type { JlptTable } from "@johnmorrisdotca/moji";
 *
 * const table: JlptTable = { source: "a list", levels: { N5: "日一" } };
 * console.log(table.source);
 * ```
 */
export type JlptTable = {
  /** Whose lists they are. */
  readonly source: string;
  /** Each level's kanji, written together, in the order of the list. */
  readonly levels: Readonly<Partial<Record<JlptLevel, string>>>;
};

/**
 * The kanji of one grade.
 *
 * @param table - `GRADES`, from `@johnmorrisdotca/moji/grades`.
 * @param grade - The grade.
 * @returns The grade's kanji, one to an item; none for a grade the table does not hold.
 * @example
 * ```ts
 * import { kanjiOfGrade } from "@johnmorrisdotca/moji";
 * import { GRADES } from "@johnmorrisdotca/moji/grades";
 *
 * console.log(kanjiOfGrade(GRADES, 1).length); // 80
 * ```
 */
export function kanjiOfGrade(table: GradeTable, grade: SchoolGrade): string[] {
  return [...(table.grades[String(grade)] ?? "")];
}

/**
 * Which grade a kanji is taught in.
 *
 * @param table - `GRADES`, from `@johnmorrisdotca/moji/grades`.
 * @param kanji - One kanji.
 * @returns The grade, or null when KANJIDIC2 gives the kanji none: that says it is outside the jōyō and jinmeiyō kanji.
 * @example
 * ```ts
 * import { gradeOf } from "@johnmorrisdotca/moji";
 * import { GRADES } from "@johnmorrisdotca/moji/grades";
 *
 * console.log(gradeOf(GRADES, "日"), gradeOf(GRADES, "鬱"), gradeOf(GRADES, "龘")); // 1 8 null
 * ```
 */
export function gradeOf(table: GradeTable, kanji: string): SchoolGrade | null {
  return SCHOOL_GRADES.find((grade) => (table.grades[String(grade)] ?? "").includes(kanji)) ?? null;
}

/**
 * The kanji of one JLPT level, not counting the levels below it.
 *
 * @param table - `JLPT`, from `@johnmorrisdotca/moji/jlpt`.
 * @param level - The level.
 * @returns The level's kanji, in the order of the list; none for a level the table does not hold.
 * @example
 * ```ts
 * import { kanjiOfLevel } from "@johnmorrisdotca/moji";
 * import { JLPT } from "@johnmorrisdotca/moji/jlpt";
 *
 * console.log(kanjiOfLevel(JLPT, "N5").length); // 79
 * ```
 */
export function kanjiOfLevel(table: JlptTable, level: JlptLevel): string[] {
  return [...(table.levels[level] ?? "")];
}

/**
 * Which JLPT level's list holds a kanji.
 *
 * @param table - `JLPT`, from `@johnmorrisdotca/moji/jlpt`.
 * @param kanji - One kanji.
 * @returns The level, or null when no list holds the kanji: that says nothing about how hard it is.
 * @example
 * ```ts
 * import { levelOf } from "@johnmorrisdotca/moji";
 * import { JLPT } from "@johnmorrisdotca/moji/jlpt";
 *
 * console.log(levelOf(JLPT, "日"), levelOf(JLPT, "鬱")); // N5 null
 * ```
 */
export function levelOf(table: JlptTable, kanji: string): JlptLevel | null {
  return JLPT_LEVELS.find((level) => (table.levels[level] ?? "").includes(kanji)) ?? null;
}

/**
 * One kanji in full.
 *
 * @example
 * ```ts
 * import type { Kanji } from "@johnmorrisdotca/moji";
 *
 * const one: Kanji = { kanji: "日", strokes: 4, grade: 1, level: "N5", frequency: 1, on: ["ニチ"], kun: ["ひ"], meanings: ["day"], meaningsFr: ["jour"] };
 * console.log(one.meanings);
 * ```
 */
export type Kanji = {
  /** The character. */
  readonly kanji: string;
  /** How many strokes it is written in. */
  readonly strokes: number;
  /** The school grade it is taught in. */
  readonly grade: SchoolGrade;
  /** The JLPT level whose list holds it, or null when none does. */
  readonly level: JlptLevel | null;
  /** Its rank among the 2,500 commonest in newspapers, 1 the commonest, or null when it is not ranked. */
  readonly frequency: number | null;
  /** Its on readings, in katakana. */
  readonly on: readonly string[];
  /** Its kun readings, in hiragana: a dot marks where the kanji's part ends and the okurigana begins, and a dash a prefix or suffix. */
  readonly kun: readonly string[];
  /** Its meanings in English. */
  readonly meanings: readonly string[];
  /** Its meanings in French; KANJIDIC2 has none for some. */
  readonly meaningsFr: readonly string[];
};

/**
 * The shape of `KANJI`, from `@johnmorrisdotca/moji/kanji`.
 *
 * @example
 * ```ts
 * import type { PackedKanji } from "@johnmorrisdotca/moji";
 *
 * const packed: PackedKanji = { source: "KANJIDIC2", release: "2026-10-31", rows: [["日", 4, 1, "N5", 1, ["ニチ"], ["ひ"], ["day"], ["jour"]]] };
 * console.log(packed.rows.length);
 * ```
 */
export type PackedKanji = {
  /** Where it was made from. */
  readonly source: string;
  /** The date of the KANJIDIC2 it was made from. */
  readonly release: string;
  /** Kanji, strokes, grade, level or "", frequency or 0, on readings, kun readings, English meanings, French meanings. */
  readonly rows: readonly (readonly [
    string,
    number,
    number,
    string,
    number,
    readonly string[],
    readonly string[],
    readonly string[],
    readonly string[],
  ])[];
};

/**
 * Reads the stored table into plain rows.
 *
 * @param packed - `KANJI`, from `@johnmorrisdotca/moji/kanji`.
 * @returns Every kanji, in the order of KANJIDIC2.
 * @example
 * ```ts
 * import { readKanji } from "@johnmorrisdotca/moji";
 * import { KANJI } from "@johnmorrisdotca/moji/kanji";
 *
 * console.log(readKanji(KANJI).length);
 * ```
 */
export function readKanji(packed: PackedKanji): Kanji[] {
  return packed.rows.map(([kanji, strokes, grade, level, frequency, on, kun, meanings, meaningsFr]) => ({
    kanji,
    strokes,
    grade: grade as SchoolGrade,
    level: level === "" ? null : (level as JlptLevel),
    frequency: frequency === 0 ? null : frequency,
    on,
    kun,
    meanings,
    meaningsFr,
  }));
}

/**
 * The kanji in a piece of text, once each, in the order they first appear.
 *
 * @param text - Any text.
 * @returns The kanji in it; kana, Latin letters and punctuation are left out.
 * @example
 * ```ts
 * import { kanjiIn } from "@johnmorrisdotca/moji";
 *
 * console.log(kanjiIn("日本語を日本で")); // ["日", "本", "語"]
 * ```
 */
export function kanjiIn(text: string): string[] {
  return [...new Set([...text].filter((character) => /\p{Script=Han}/u.test(character) && character !== "々"))];
}

/**
 * The kanji that hold a piece of text: the character itself, a reading or a meaning, in English or French, ignoring case.
 *
 * @param kanji - The rows, from `readKanji`.
 * @param text - What was typed; blank text matches nothing.
 * @returns The rows that match: those that are the word typed first, then those that hold it, the commonest first in each.
 * @example
 * ```ts
 * import { readKanji, searchKanji } from "@johnmorrisdotca/moji";
 * import { KANJI } from "@johnmorrisdotca/moji/kanji";
 *
 * console.log(searchKanji(readKanji(KANJI), "mountain")[0]?.kanji); // 山
 * ```
 */
export function searchKanji(kanji: readonly Kanji[], text: string): Kanji[] {
  const needle = text.trim().toLowerCase();
  if (needle === "") return [];
  const words = (one: Kanji) => [...one.meanings, ...one.meaningsFr].map((word) => word.toLowerCase());
  const commonestFirst = (a: Kanji, b: Kanji) => (a.frequency ?? Infinity) - (b.frequency ?? Infinity);
  const exact = kanji.filter((one) => one.kanji === needle || words(one).includes(needle)).sort(commonestFirst);
  const held = kanji.filter(
    (one) =>
      !exact.includes(one) &&
      (one.on.includes(needle) ||
        one.kun.some((kun) => kun.replace(/[.-]/g, "").includes(needle)) ||
        words(one).some((word) => word.includes(needle))),
  );
  return [...exact, ...held.sort(commonestFirst)];
}

/**
 * The shape of `LOOK_ALIKE`, from `@johnmorrisdotca/moji/look-alike`.
 *
 * @example
 * ```ts
 * import type { PackedLookAlikes } from "@johnmorrisdotca/moji";
 *
 * const packed: PackedLookAlikes = { source: "a study", pairs: [["士土", 100, 67]] };
 * console.log(packed.pairs.length);
 * ```
 */
export type PackedLookAlikes = {
  /** Whose scores they are. */
  readonly source: string;
  /** The two kanji written together, then the score by strokes and the score by parts, each out of 100, 0 where not scored. */
  readonly pairs: readonly (readonly [string, number, number])[];
};

/**
 * A kanji that looks like another, and how much.
 *
 * @example
 * ```ts
 * import type { LookAlike } from "@johnmorrisdotca/moji";
 *
 * const one: LookAlike = { kanji: "士", score: 100, strokes: 100, parts: 67 };
 * console.log(one.kanji);
 * ```
 */
export type LookAlike = {
  /** The kanji it looks like. */
  readonly kanji: string;
  /** The higher of the two scores, out of 100. */
  readonly score: number;
  /** Out of 100, by how few stroke edits separate them; 0 where this measure did not rank the pair. */
  readonly strokes: number;
  /** Out of 100, by the parts they share; 0 where this measure did not rank the pair. */
  readonly parts: number;
};

/**
 * How far `lookAlikes` goes.
 *
 * @example
 * ```ts
 * import type { LookAlikeOptions } from "@johnmorrisdotca/moji";
 *
 * const options: LookAlikeOptions = { atLeast: 80, max: 3 };
 * console.log(options);
 * ```
 */
export type LookAlikeOptions = {
  /** The lowest score to take, out of 100. The default is 70: below it, most kanji have a list rather than a warning. */
  readonly atLeast?: number;
  /** The most to give back. The default is 6. */
  readonly max?: number;
};

/**
 * The kanji most like one kanji, the closest first.
 *
 * @param table - `LOOK_ALIKE`, from `@johnmorrisdotca/moji/look-alike`.
 * @param kanji - One kanji.
 * @param options - How low to go and how many to give back.
 * @returns The kanji that look like it; none when none reaches the score. None does not say a kanji has no look-alike: the two
 * measures cover only the 1,945 jōyō kanji of before 2010.
 * @example
 * ```ts
 * import { lookAlikes } from "@johnmorrisdotca/moji";
 * import { LOOK_ALIKE } from "@johnmorrisdotca/moji/look-alike";
 *
 * console.log(lookAlikes(LOOK_ALIKE, "土").map((one) => one.kanji));
 * ```
 */
export function lookAlikes(table: PackedLookAlikes, kanji: string, options: LookAlikeOptions = {}): LookAlike[] {
  const { atLeast = 70, max = 6 } = options;
  const found: LookAlike[] = [];
  for (const [pair, strokes, parts] of table.pairs) {
    const [first, second] = [...pair] as [string, string];
    if (first !== kanji && second !== kanji) continue;
    const score = Math.max(strokes, parts);
    if (score >= atLeast) found.push({ kanji: first === kanji ? second : first, score, strokes, parts });
  }
  return found.sort((a, b) => b.score - a.score || a.kanji.localeCompare(b.kanji, "ja")).slice(0, max);
}
