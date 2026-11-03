/** Furigana: which kana read which kanji of a written word, found by matching the kana in the word against its reading. */

import { foldKana } from "./words-text.ts";

/**
 * One piece of a written word: its text, and, for a piece of kanji, the kana that read it. A piece with no `reading` is kana that
 * needs none.
 *
 * @example
 * ```ts
 * import type { FuriganaPart } from "@johnmorrisdotca/jisho/words";
 *
 * const part: FuriganaPart = { text: "食", reading: "た" };
 * console.log(part.reading);
 * ```
 */
export type FuriganaPart = {
  /** The text of the piece, as written. */
  readonly text: string;
  /** The hiragana that read it, when the piece is kanji. */
  readonly reading?: string;
};

const KANJI = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々〆ヶ]|[\u{20000}-\u{2FA1F}]/u;
const escapeText = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The pieces of a written word with the kana that read each kanji: 食べる read たべる is 食 (た) and べる. The kana of the word
 * are matched against the reading, and what lies between them is the reading of the kanji before; when they cannot be matched (大人
 * read おとな, whose reading belongs to the word as a whole), the whole word is one piece with the whole reading. A word with no
 * kanji is one piece with no reading. The reading may be in hiragana or katakana.
 *
 * @param written - A written form.
 * @param reading - Its reading.
 * @returns The pieces, which put together are `written`.
 * @example
 * ```ts
 * import { furiganaOf } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(furiganaOf("食べる", "たべる")); // [{ text: "食", reading: "た" }, { text: "べる" }]
 * ```
 */
export function furiganaOf(written: string, reading: string): FuriganaPart[] {
  const characters = [...written];
  if (!characters.some((one) => KANJI.test(one))) return [{ text: written }];
  const runs: { text: string; kanji: boolean }[] = [];
  for (const one of characters) {
    const kanji = KANJI.test(one);
    const last = runs.at(-1);
    if (last !== undefined && last.kanji === kanji) last.text += one;
    else runs.push({ text: one, kanji });
  }
  const pattern = new RegExp(
    `^${runs.map((run) => (run.kanji ? "(.+?)" : escapeText(foldKana(run.text)))).join("")}$`,
    "u",
  );
  const found = pattern.exec(foldKana(reading));
  if (found === null) return [{ text: written, reading: foldKana(reading) }];
  let group = 1;
  return runs.map((run) => (run.kanji ? { text: run.text, reading: found[group++] ?? "" } : { text: run.text }));
}

/** 来's reading in a form: こ before ない and the passive, causative and volitional endings, く before る and れば, き otherwise. */
function kuruReading(rest: string): string {
  if (/^(?:ない|なかっ|なく|なけれ|ず|られ|させ|よう)/.test(rest)) return "こ";
  return /^(?:る|れ)/.test(rest) ? "く" : "き";
}

/**
 * The pieces of a word as it is written in a text, which may be a conjugated form of the dictionary form it was found by: 食べなかった
 * from 食べる (たべる) is 食 (た) and べなかった. Conjugation changes the end of a word, so the pieces of the dictionary form hold as far
 * as the two spellings agree, and what follows is kana that needs no reading. 来 takes the reading its ending asks for.
 *
 * @param surface - The word as the text writes it.
 * @param base - The dictionary form it comes from, as spelled when it was looked up (the surface itself for a word that is not conjugated).
 * @param reading - The reading of the dictionary form.
 * @returns The pieces, which put together are `surface`.
 * @example
 * ```ts
 * import { furiganaOfSurface } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(furiganaOfSurface("食べなかった", "食べる", "たべる")); // [{ text: "食", reading: "た" }, { text: "べなかった" }]
 * ```
 */
export function furiganaOfSurface(surface: string, base: string, reading: string): FuriganaPart[] {
  if (surface === base) return furiganaOf(base, reading);
  const shared = [...surface].findIndex((one, at) => one !== [...base][at]);
  const stem = (shared === -1 ? [...surface].length : shared) as number;
  const kept: FuriganaPart[] = [];
  let used = 0;
  for (const part of furiganaOf(base, reading)) {
    const size = [...part.text].length;
    if (used + size <= stem) {
      kept.push(
        part.text === "来" && part.reading !== undefined
          ? { text: "来", reading: kuruReading([...surface].slice(1).join("")) }
          : part,
      );
      used += size;
    } else if (part.reading === undefined) {
      const rest = [...part.text].slice(0, stem - used).join("");
      if (rest !== "") kept.push({ text: rest });
      used = stem;
      break;
    } else {
      return [{ text: surface }];
    }
  }
  const tail = [...surface].slice(stem).join("");
  return tail === "" ? kept : [...kept, { text: tail }];
}
