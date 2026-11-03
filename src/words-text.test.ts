import { describe, expect, it } from "vitest";
import { formKey, keyOf, MAX_TEXT, normalizeText, readingKey, termsOf } from "./words-text.ts";

/** A small seeded generator, so that a failure can be run again. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

/** Pieces of the odd input a text box or a paste can hold. */
const ODD = [
  "かみ",
  "カミ",
  "ｶﾐ",
  "ｶﾞ",
  "紙",
  "神",
  "山",
  "々",
  "ー",
  "ｰ",
  "-",
  "–",
  "—",
  "a",
  "Z",
  "ＡＢＣ",
  "1",
  "１",
  "!",
  "？",
  " ",
  "　",
  "\t",
  "\n",
  "\r\n",
  "\u0000",
  "\u0007",
  "\u200B",
  "‍",
  "\u2060",
  "\uFEFF",
  "\u00AD",
  "\u202E",
  "゙",
  "́",
  "️",
  "\u{E0041}",
  "😀",
  "👨‍👩‍👧",
  "🇨🇦",
  "\uD800",
  "\uDC00",
  "\uD83D",
  "𠮟",
  "ｱ",
  "ﾟ",
  "한",
  "ก",
  "ا",
  "é",
  "é",
  "ǅ",
  "ﬁ",
  "㌔",
  "㍿",
  "﷽",
  "&",
  "<",
  "'",
  '"',
  "\\",
  "|",
  "\t",
];

function oddText(next: () => number, length: number): string {
  let text = "";
  for (let at = 0; at < length; at++) text += ODD[Math.floor(next() * ODD.length)];
  return text;
}

describe("a text is made plain", () => {
  it("folds full-width and half-width, composed and decomposed, and takes out what draws nothing", () => {
    expect(normalizeText("　ｶﾐ\u200B ")).toBe("カミ");
    expect(normalizeText("ｶﾞｲｺｸ")).toBe("ガイコク");
    expect(normalizeText("ＡＢＣ１２３")).toBe("ABC123");
    expect(normalizeText("が")).toBe("が");
    expect(normalizeText("a\u0000b\u0007c")).toBe("abc");
    expect(normalizeText("a\u200Bb\uFEFFc\u2060d\u00ADe")).toBe("abcde");
    expect(normalizeText("\u202Eかみ")).toBe("かみ");
  });

  it("collapses whitespace, and takes a space out from beside Japanese", () => {
    expect(normalizeText("  a \t\n b  ")).toBe("a b");
    expect(normalizeText("か み")).toBe("かみ");
    expect(normalizeText("か　み")).toBe("かみ");
    expect(normalizeText("紙 paper")).toBe("紙paper");
    expect(normalizeText("go  out")).toBe("go out");
  });

  it("makes the long vowel mark of every dash after a kana", () => {
    for (const dash of ["ー", "ｰ", "-", "‐", "–", "—", "―", "─", "－", "−"])
      expect(normalizeText(`コ${dash}ヒ${dash}`), dash).toBe("コーヒー");
    expect(normalizeText("コｰﾋｰ")).toBe("コーヒー");
    expect(normalizeText("e-mail")).toBe("e-mail");
    expect(normalizeText("ウラン-238")).toBe("ウラン-238");
    expect(normalizeText("ウラン-")).toBe("ウランー");
  });

  it("gives nothing for what is not text, and for far too much of it", () => {
    for (const odd of [undefined, null, 5, {}, [], Symbol("x")])
      expect(normalizeText(odd as unknown as string)).toBe("");
    expect(normalizeText("a".repeat(MAX_TEXT + 1))).toBe("");
    expect(normalizeText("a".repeat(MAX_TEXT))).toBe("a".repeat(MAX_TEXT));
    expect(normalizeText("紙".repeat(1_000_000))).toBe("");
  });

  it("keeps a word's keys: the same text, kana folded to hiragana", () => {
    expect(keyOf("ｶﾐ ")).toBe("かみ");
    expect(keyOf("カミ")).toBe("かみ");
    expect(keyOf("１人")).toBe("1人");
    expect(readingKey("ﾀﾋ")).toBe("たひ");
    expect(formKey("ＣＤ")).toBe("CD");
  });

  it("never throws, and is the same when it is made plain again, whatever it is given", () => {
    const next = random(20261103);
    for (let at = 0; at < 4000; at++) {
      const text = oddText(next, Math.floor(next() * 30));
      const once = normalizeText(text);
      expect(normalizeText(once), JSON.stringify(text)).toBe(once);
      expect(once).toBe(once.trim());
      expect(
        [...once].every((one) => {
          const code = one.codePointAt(0) ?? 0;
          return !(code <= 8 || (code >= 0x200b && code <= 0x200f) || code === 0x2060 || code === 0xfeff);
        }),
        JSON.stringify(text),
      ).toBe(true);
      expect(typeof keyOf(text)).toBe("string");
      expect(Array.isArray(termsOf(text))).toBe(true);
    }
  });

  it("copes with a very long text without taking long", () => {
    const started = performance.now();
    for (const text of [
      "紙".repeat(5_000_000),
      "a ".repeat(2_000_000),
      "\u200B".repeat(3_000_000),
      "\uD83D".repeat(1_000_000),
    ])
      expect(normalizeText(text)).toBe("");
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe("the terms of an English text", () => {
  it("are lower case words, once each, without the words every gloss has", () => {
    expect(termsOf("To go out; the Go-Out of someone's house")).toEqual(["go", "out", "house"]);
    expect(termsOf("don't")).toEqual(["don't"]);
    expect(termsOf("café ÷ 3.5")).toEqual(["café", "3", "5"]);
    expect(termsOf("☃ ☃")).toEqual([]);
  });
});
