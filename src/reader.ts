/** Reading a text: Japanese split into words by the longest match on the dictionary, each with its reading, meaning and levels. */

import { type FuriganaPart, furiganaOfSurface } from "./furigana.ts";
import { gradeOf, JLPT_LEVELS, type JlptLevel, levelOf, type SchoolGrade } from "./index.ts";
import type { Word, WordsOptions } from "./words.types.ts";
import { type InflectedWord, inflectedOf } from "./words-inflected.ts";
import { loadWords } from "./words-load.ts";
import { foldKana, INVISIBLE } from "./words-text.ts";

/**
 * What the kanji tables say of one kanji in a text.
 *
 * @example
 * ```ts
 * import type { KanjiFact } from "@johnmorrisdotca/jisho/words";
 *
 * const fact: KanjiFact = { kanji: "食", grade: 2, level: "N5" };
 * console.log(fact.grade);
 * ```
 */
export type KanjiFact = {
  readonly kanji: string;
  /** Its school grade, or null for a kanji that has no row in the table (rarer than the 2,999 with a grade). */
  readonly grade: SchoolGrade | null;
  /** Its JLPT level on Waller's lists, or null. */
  readonly level: JlptLevel | null;
};

/**
 * One piece of a text that `readText` cut out: a word of the dictionary, a stretch of Japanese no word was found for, or something
 * that is not Japanese (spaces, punctuation, Latin letters, digits), which is kept so that the pieces put together are the text.
 *
 * @example
 * ```ts
 * import type { ReadToken } from "@johnmorrisdotca/jisho/words";
 *
 * const kind = (token: ReadToken) => token.kind;
 * console.log(typeof kind);
 * ```
 */
export type ReadToken = {
  /** The piece as the text writes it. */
  readonly text: string;
  /** `word` was found in the dictionary, `unknown` is Japanese that nothing was found for, `other` is not Japanese. */
  readonly kind: "word" | "unknown" | "other";
  /** The dictionary word, for a `word`; otherwise null. */
  readonly word: Word | null;
  /** The dictionary form as it was looked up, spelled as the text spells it: `食べる` for 食べなかった; the text itself when it is not conjugated. */
  readonly form: string;
  /** What was done to the dictionary form to make the text, innermost first (`["negative", "past"]`); empty when it was not conjugated. */
  readonly path: readonly string[];
  /** The text in pieces with the kana that read each kanji: the furigana, which put together is `text`. Kana alone for a word with no kanji. */
  readonly furigana: readonly FuriganaPart[];
  /** The whole text read in hiragana, for a `word`; empty otherwise. */
  readonly reading: string;
  /** The word's short English meaning, for a `word`; empty otherwise. */
  readonly meaning: string;
  /** The hardest JLPT level among its kanji. Jisho has levels for kanji and none for words, so a word of no kanji, or none on a list, has null. */
  readonly level: JlptLevel | null;
  /** The kanji in it, each with its school grade and JLPT level. */
  readonly kanji: readonly KanjiFact[];
  /** Other words the same text could be, the next commonest first, for a text that is more than one word (日本 is にほん and にっぽん). */
  readonly alternatives: readonly InflectedWord[];
};

/**
 * What `readText` gives.
 *
 * @example
 * ```ts
 * import type { ReadResult } from "@johnmorrisdotca/jisho/words";
 *
 * const count = (result: ReadResult) => result.tokens.length;
 * console.log(typeof count);
 * ```
 */
export type ReadResult = {
  /** The text that was read: made plain (NFKC, invisible characters removed) and cut at `MAX_READ_LENGTH` characters. */
  readonly text: string;
  /** The pieces, in order, which put together are `text`. */
  readonly tokens: readonly ReadToken[];
  /** The stretches of Japanese that no word was found for, once each, in the order they came. */
  readonly unknown: readonly string[];
  /** The JMdict release the words are from. */
  readonly release: string;
  /** Whether the text was longer than `MAX_READ_LENGTH` and was cut. */
  readonly truncated: boolean;
};

/**
 * The most characters `readText` reads; the rest is left out and `truncated` says so.
 *
 * @example
 * ```ts
 * import { MAX_READ_LENGTH } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(MAX_READ_LENGTH);
 * ```
 */
export const MAX_READ_LENGTH = 5000;

/** The longest stretch tried as one word, in characters: 食べさせられたくなかった is 12. */
const MAX_SPAN = 16;
/** How many of the longest matches at a place are weighed against what follows them. */
const LOOKAHEAD = 3;
/** A character of Japanese: kana, the long vowel mark, kanji and the iteration marks. */
const KANA = String.raw`\u3041-\u3096\u309D\u309E\u30A1-\u30FA\u30FC-\u30FE`;
const KANJI = String.raw`\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々〆`;
const ASTRAL = String.raw`\u{20000}-\u{2FA1F}`;
const HAN = new RegExp(`[${KANJI}${ASTRAL}]`, "u");
const JAPANESE = new RegExp(`[${KANA}${KANJI}ヶ${ASTRAL}]`, "u");
const RUNS = new RegExp(`[${KANA}${KANJI}ヶ${ASTRAL}]+|[^${KANA}${KANJI}ヶ${ASTRAL}]+`, "gu");

type Found = readonly InflectedWord[];

/** Text of kana alone: it is a word usually written in kana (a particle, ここ) far more often than a kanji word typed in kana. */
const KANA_ONLY = /^[\u3041-\u3096\u30A1-\u30FA\u30FC]+$/;

/**
 * The commonest of the words a text could be; of equal rank, the one that needs the fewest steps. A text of kana alone is first
 * taken for a word that is usually written in kana: は is the particle before 葉 (leaf) and 歯 (tooth).
 */
function ranked(found: Found, span: string): InflectedWord[] {
  const kana = KANA_ONLY.test(span);
  const spelled = (one: InflectedWord) => (kana && one.word.written === one.word.reading ? 0 : 1);
  return [...found].sort(
    (a, b) => spelled(a) - spelled(b) || a.word.rank - b.word.rank || a.path.length - b.path.length,
  );
}

/**
 * Whether a match is one to believe. The dictionary holds many rare words of a kana or two, and taking the longest match through them
 * cuts ordinary text into rare words; so a match counts when its word is common, or its text has a kanji, or it is long, and a
 * single katakana is none of them: it is the middle of a name.
 */
function plausible(word: Word, span: string): boolean {
  if (/^[\u30A1-\u30FA]$/.test(span)) return false;
  return word.common || HAN.test(span) || [...span].length >= 4;
}

const hardest = (levels: readonly (JlptLevel | null)[]): JlptLevel | null =>
  levels.reduce<JlptLevel | null>(
    (top, level) =>
      level !== null && (top === null || JLPT_LEVELS.indexOf(level) > JLPT_LEVELS.indexOf(top)) ? level : top,
    null,
  );

/** Neighbouring pieces with no reading are one piece. */
function merged(parts: readonly FuriganaPart[]): FuriganaPart[] {
  const out: FuriganaPart[] = [];
  for (const part of parts) {
    const last = out.at(-1);
    if (last !== undefined && last.reading === undefined && part.reading === undefined)
      out[out.length - 1] = { text: last.text + part.text };
    else out.push(part);
  }
  return out;
}

/**
 * Reads a text: it is cut into words by taking, from each place, the longest stretch that the dictionary has a word for, either as
 * it stands or as a conjugated form (食べなかった is 食べる). Each word comes with its furigana, its meaning, the hardest JLPT level
 * among its kanji, and each kanji's grade and level; a stretch of Japanese that no word fits is `unknown` and is listed; spaces,
 * punctuation, Latin letters and digits are kept as `other`. Nothing but Jisho's own pieces is fetched, about 25 kB gzipped each, as
 * the stretches need them (a few for each word), and a piece is kept for the next one, so a text costs the pieces of its words once.
 *
 * It picks the longest stretch, not the best reading of a sentence: there is no model of grammar, so a rare word that happens to
 * be longer can win, and a name is `unknown` or cut into small words. Among equal stretches the commonest word is taken, and the
 * others are in `alternatives`. In safe mode a word the mode leaves out is not found, so its text is `unknown`.
 *
 * @param text - Japanese text, up to `MAX_READ_LENGTH` characters.
 * @param options - The mode, the `block` and `allow` lists, as for `loadWords`.
 * @returns The pieces, the unknown stretches and the JMdict release.
 * @example
 * ```ts
 * import { readText } from "@johnmorrisdotca/jisho/words";
 *
 * const result = await readText("私は寿司を食べなかった。");
 * console.log(result.tokens.map((token) => token.text)); // ["私", "は", "寿司", "を", "食べなかった", "。"]
 * ```
 */
export async function readText(text: string, options: WordsOptions = {}): Promise<ReadResult> {
  const plain = (typeof text === "string" ? text : "").normalize("NFKC").replace(INVISIBLE, "");
  const characters = [...plain];
  const truncated = characters.length > MAX_READ_LENGTH;
  const source = truncated ? characters.slice(0, MAX_READ_LENGTH).join("") : plain;
  const [{ GRADES }, { JLPT }] = await Promise.all([import("./data/grades.data.ts"), import("./data/jlpt.data.ts")]);
  const facts = (span: string): KanjiFact[] =>
    [...new Set([...span].filter((one) => HAN.test(one) && one !== "々"))].map((kanji) => ({
      kanji,
      grade: gradeOf(GRADES, kanji),
      level: levelOf(JLPT, kanji),
    }));
  const cache = new Map<string, Found>();
  let release = "";
  const look = async (spans: readonly string[]) => {
    const wanted = spans.filter((span) => !cache.has(span));
    if (wanted.length === 0) return;
    const words = await loadWords(wanted, { ...options, inflected: true });
    release = words.release;
    for (const span of wanted) cache.set(span, inflectedOf(words, span));
  };
  const tokens: ReadToken[] = [];
  const other = (piece: string): ReadToken => ({
    text: piece,
    kind: "other",
    word: null,
    form: piece,
    path: [],
    furigana: [{ text: piece }],
    reading: "",
    meaning: "",
    level: null,
    kanji: [],
    alternatives: [],
  });
  const unknown = (piece: string): ReadToken => {
    const kanji = facts(piece);
    return { ...other(piece), kind: "unknown", kanji, level: hardest(kanji.map((one) => one.level)) };
  };
  for (const run of source.match(RUNS) ?? []) {
    if (!JAPANESE.test(run)) {
      tokens.push(other(run));
      continue;
    }
    const chars = [...run];
    /** The stretches that start at a place and are words to believe, the longest first. */
    const candidates = async (at: number) => {
      const longest = Math.min(MAX_SPAN, chars.length - at);
      const spans = Array.from({ length: longest }, (_, drop) => chars.slice(at, at + longest - drop).join(""));
      await look(spans);
      return spans.flatMap((span) => {
        const found = ranked(cache.get(span) ?? [], span);
        const top = found[0];
        if (top === undefined || !plausible(top.word, span)) return [];
        // 今日は is the greeting, and also 今日 and the particle は: a word of kanji that ends in は and begins with a word is the pair.
        const stem = [...span].slice(0, -1).join("");
        const whole = top.path.length === 0 && span.endsWith("は") && HAN.test(span);
        if (whole && ranked(cache.get(stem) ?? [], stem).some((one) => plausible(one.word, stem))) return [];
        return [{ span, found, size: [...span].length }];
      });
    };
    let at = 0;
    while (at < chars.length) {
      const here = await candidates(at);
      // Of the few longest stretches, the one that leaves the longest word after it: はいい天気 is は and いい天気, not はい and い天気.
      let pick = here[0];
      let reach = 0;
      for (const one of here.length > 1 ? here.slice(0, LOOKAHEAD) : []) {
        const next = at + one.size < chars.length ? ((await candidates(at + one.size))[0]?.size ?? 0) : 0;
        if (one.size + next > reach) {
          pick = one;
          reach = one.size + next;
        }
      }
      if (pick === undefined) {
        const last = tokens.at(-1);
        const one = chars[at] ?? "";
        if (last?.kind === "unknown") tokens[tokens.length - 1] = unknown(last.text + one);
        else tokens.push(unknown(one));
        at += 1;
        continue;
      }
      const top = pick.found[0] as InflectedWord;
      const reading = top.word.reading === "いい" && top.path.length > 0 ? "よい" : top.word.reading;
      const furigana = merged(furiganaOfSurface(pick.span, top.form, reading));
      const kanji = facts(pick.span);
      tokens.push({
        text: pick.span,
        kind: "word",
        word: top.word,
        form: top.form,
        path: top.path,
        furigana,
        reading: furigana.map((part) => part.reading ?? foldKana(part.text)).join(""),
        meaning: top.word.meaning,
        level: hardest(kanji.map((one) => one.level)),
        kanji,
        alternatives: pick.found.slice(1, 6),
      });
      at += [...pick.span].length;
    }
  }
  return {
    text: source,
    tokens,
    unknown: [...new Set(tokens.filter((token) => token.kind === "unknown").map((token) => token.text))],
    release,
    truncated,
  };
}
