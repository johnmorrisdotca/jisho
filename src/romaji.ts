/**
 * Romaji into hiragana, so that a lookup can be asked in Latin letters. Modified Hepburn first (shi, chi, tsu, fu, ji, sha, cha,
 * ja, a doubled consonant for っ, n' for ん, macrons for long vowels) and Kunrei too (si, ti, tu, hu, zi, sya, tya, zya), with the
 * few sounds loanwords need (fa, va, thi, tsa, je). It is a table of its own and depends on nothing.
 *
 * A macron, or a circumflex, is a long vowel and a reading can write it more than one way (Tōkyō is とうきょう, a bar is こーひー in a
 * loanword), so `kanaFromRomaji` gives every way and `romajiToKana` the first.
 */

import { normalizeText } from "./words-text.ts";

const ROWS: Readonly<Record<string, string>> = {
  "": "あいうえお",
  k: "かきくけこ",
  g: "がぎぐげご",
  s: "さしすせそ",
  z: "ざじずぜぞ",
  t: "たちつてと",
  d: "だぢづでど",
  n: "なにぬねの",
  h: "はひふへほ",
  b: "ばびぶべぼ",
  p: "ぱぴぷぺぽ",
  m: "まみむめも",
  r: "らりるれろ",
};
const VOWELS = "aiueo";
const SMALL = { a: "ゃ", u: "ゅ", o: "ょ", e: "ぇ" } as const;
/** The contracted sounds: the letters before a, u, o (and e for the foreign ones), and the kana they start. */
const CONTRACTED: readonly (readonly [string, string, boolean])[] = [
  ["ky", "き", false],
  ["gy", "ぎ", false],
  ["ny", "に", false],
  ["hy", "ひ", false],
  ["by", "び", false],
  ["py", "ぴ", false],
  ["my", "み", false],
  ["ry", "り", false],
  ["sy", "し", false],
  ["ty", "ち", false],
  ["zy", "じ", false],
  ["dy", "ぢ", false],
  ["jy", "じ", false],
  ["cy", "ち", false],
  ["sh", "し", true],
  ["ch", "ち", true],
  ["j", "じ", true],
];

const TABLE: ReadonlyMap<string, string> = (() => {
  const table = new Map<string, string>();
  for (const [consonant, kana] of Object.entries(ROWS)) {
    for (const [at, v] of [...VOWELS].entries()) table.set(consonant + v, kana[at] ?? "");
  }
  for (const [start, kana, foreign] of CONTRACTED) {
    for (const v of foreign ? "aueo" : "auo") table.set(start + v, kana + SMALL[v as keyof typeof SMALL]);
  }
  const more: Record<string, string> = {
    ya: "や",
    yu: "ゆ",
    yo: "よ",
    ye: "いぇ",
    wa: "わ",
    wo: "を",
    wi: "うぃ",
    we: "うぇ",
    wu: "う",
    shi: "し",
    chi: "ち",
    tsu: "つ",
    fu: "ふ",
    ji: "じ",
    fa: "ふぁ",
    fi: "ふぃ",
    fe: "ふぇ",
    fo: "ふぉ",
    va: "ゔぁ",
    vi: "ゔぃ",
    vu: "ゔ",
    ve: "ゔぇ",
    vo: "ゔぉ",
    tsa: "つぁ",
    tsi: "つぃ",
    tse: "つぇ",
    tso: "つぉ",
    thi: "てぃ",
    thu: "てゅ",
    dhi: "でぃ",
    dhu: "でゅ",
    dzu: "づ",
  };
  for (const [key, kana] of Object.entries(more)) table.set(key, kana);
  return table;
})();

/** What a long vowel mark can be in a reading, the usual first: ō is おう in とうきょう, おお in おおきい, and ー in a loanword. */
const LENGTHENED: Readonly<Record<string, readonly string[]>> = {
  A: ["あ", "ー"],
  I: ["い", "ー"],
  U: ["う", "ー"],
  E: ["え", "ー"],
  O: ["う", "お", "ー"],
};
const MACRONS: Readonly<Record<string, string>> = {
  ā: "aA",
  â: "aA",
  ī: "iI",
  î: "iI",
  ū: "uU",
  û: "uU",
  ē: "eE",
  ê: "eE",
  ō: "oO",
  ô: "oO",
};
const DOUBLES = "kgsztdhbpfjvr";
const isVowel = (letter: string) => letter !== "" && VOWELS.includes(letter);
/** The most ways a long vowel can make a text read; more than this are not looked up. */
const MOST_CANDIDATES = 8;

/** The pieces of a romaji text, each the ways it can read, the usual first; null when something in it is not a sound. */
function sounds(romaji: string): string[][] | null {
  const letters = romaji.replace(/[āâīîūûēêōô]/g, (one) => MACRONS[one] ?? one);
  const out: string[][] = [];
  let at = 0;
  while (at < letters.length) {
    const here = letters[at] ?? "";
    const next = letters[at + 1] ?? "";
    if (here === "-") out.push(["ー"]);
    else if (here === "'") {
      /* A separator, kept only to tell n' from na: it reads as nothing. */
    } else if (LENGTHENED[here] !== undefined) out.push([...(LENGTHENED[here] ?? [])]);
    else {
      // A doubled consonant is a small っ before the sound, and tch is too.
      if (DOUBLES.includes(here) && (next === here || (here === "t" && next === "c" && letters[at + 2] === "h"))) {
        out.push(["っ"]);
        at += 1;
        continue;
      }
      const length = [3, 2, 1].find((size) => TABLE.has(letters.slice(at, at + size)));
      if (length !== undefined) {
        out.push([TABLE.get(letters.slice(at, at + length)) ?? ""]);
        at += length;
        continue;
      }
      if (here === "n" && !isVowel(next)) {
        // n is ん before a consonant, at the end, and as n' or nn: konnichi is こんにち (the second n starts に), kannai is かんない.
        const after = letters[at + 2] ?? "";
        out.push(["ん"]);
        at += next === "'" || (next === "n" && !isVowel(after) && after !== "y") ? 2 : 1;
        continue;
      }
      if (here === "m" && "bpm".includes(next) && next !== "") out.push(["ん"]);
      else return null;
    }
    at += 1;
  }
  return out.length === 0 ? null : out;
}

/** The text a romaji is read from: plain, lower case, with no spaces, and only letters a romaji may hold. */
function romajiText(text: string): string | null {
  const plain = normalizeText(text).toLowerCase().replace(/ /g, "").replace(/[’ʼ]/g, "'");
  return /^[a-zāâīîūûēêōô'-]+$/.test(plain) ? plain : null;
}

/**
 * Every hiragana text a romaji can read as, the usual first: one, unless it writes a long vowel with a macron or a circumflex,
 * which a reading writes more than one way. At most eight. A text that is not romaji, or has a sound romaji has no kana for,
 * gives none.
 *
 * @param text - Romaji: `kami`, `shinbun`, `Tōkyō`, `kōhī`, `kon'nichi`.
 * @returns The readings, the usual first; none when it is not romaji.
 * @example
 * ```ts
 * import { kanaFromRomaji } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(kanaFromRomaji("kōhī")); // ["こうひい", "こうひー", "こーひい", "こーひー", ...]
 * console.log(kanaFromRomaji("Hello!")); // []
 * ```
 */
export function kanaFromRomaji(text: string): string[] {
  const romaji = romajiText(text);
  const parts = romaji === null ? null : sounds(romaji);
  if (parts === null) return [];
  let found: string[] = [""];
  for (const options of parts) {
    if (options.length === 1) found = found.map((one) => one + (options[0] ?? ""));
    else found = found.flatMap((one) => options.map((option) => one + option)).slice(0, 64);
  }
  // The usual reading first, then the one that writes every long vowel with the bar, then the rest in order.
  const barred = parts.map((options) => (options.includes("ー") ? "ー" : options[0])).join("");
  return [...new Set([found[0] ?? "", barred, ...found])].slice(0, MOST_CANDIDATES);
}

/**
 * A romaji as the hiragana it usually reads as: `kami` is かみ, `shinbun` is しんぶん, `Tōkyō` is とうきょう. Modified Hepburn and
 * Kunrei both.
 *
 * @param text - Romaji.
 * @returns The hiragana, or null when the text is not romaji, or has a sound romaji has no kana for.
 * @example
 * ```ts
 * import { romajiToKana } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(romajiToKana("gakkō")); // がっこう
 * console.log(romajiToKana("kon'nichi")); // こんにち
 * ```
 */
export function romajiToKana(text: string): string | null {
  return kanaFromRomaji(text)[0] ?? null;
}
