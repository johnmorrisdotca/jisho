import { describe, expect, it } from "vitest";
import { MANIFEST } from "./data/words/manifest.data.ts";
import { isLoaded, loadCommonWords, loadWords, meaningOf, wordsOf } from "./words.ts";
import { keyOf, normalizeText } from "./words-text.ts";

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
const ODD = [
  "かみ",
  "カミ",
  "ｶﾐ",
  "紙",
  "山",
  "ー",
  "-",
  "a",
  "Ka",
  "ＡＢ",
  "１",
  "!",
  " ",
  "　",
  "\t",
  "\u0000",
  "\u200B",
  "\uFEFF",
  "゙",
  "😀",
  "👨‍👩‍👧",
  "\uD800",
  "\uDC00",
  "𠮟",
  "é",
  "é",
  "ﬁ",
  "㌔",
  "'",
  "\\",
  "|",
  "kōhī",
  "shi",
  "n",
];

describe("a lookup in Latin letters", () => {
  it("reads romaji when it is asked to, in both the load and the lookup", async () => {
    const words = await loadWords(["kami", "Tōkyō", "kōhī"], { romaji: true });
    expect(wordsOf(words, "kami", { romaji: true })[0]?.written).toBe("紙");
    expect(wordsOf(words, "Tōkyō", { romaji: true })[0]?.written).toBe("東京");
    expect(wordsOf(words, "kōhī", { romaji: true }).map((one) => one.reading)).toContain("コーヒー");
    expect(isLoaded(words, "kami", { romaji: true })).toBe(true);
    expect(isLoaded(words, "kami")).toBe(false);
    expect(() => wordsOf(words, "kami")).toThrow(RangeError);
    expect(meaningOf(words, "KAMI", { romaji: true })).toBe("paper");
  });

  it("does not read Latin letters as romaji unless asked: AI and CD are written forms too", async () => {
    const words = await loadWords(["CD", "AI"]);
    expect(wordsOf(words, "CD").length).toBeGreaterThan(0);
    expect(wordsOf(words, "CD")[0]?.written).toBe("ＣＤ");
    expect(wordsOf(words, "AI").length).toBeGreaterThan(0);
    const romaji = await loadWords("CD", { romaji: true });
    expect(wordsOf(romaji, "CD", { romaji: true })[0]?.written).toBe("ＣＤ");
  });
});

describe("a lookup of text that is spelled another way", () => {
  it("finds the same words in full-width and half-width, with stray spaces and invisible characters", async () => {
    const words = await loadWords(["ｶﾐ", " か み\u200B", "ＣＤ", "１人"]);
    expect(wordsOf(words, "かみ")[0]?.written).toBe("紙");
    expect(wordsOf(words, "ｶﾐ")[0]?.written).toBe("紙");
    expect(wordsOf(words, " か み\u200B")[0]?.written).toBe("紙");
    expect(wordsOf(words, "CD")[0]?.written).toBe("ＣＤ");
    expect(wordsOf(words, "ＣＤ")[0]?.written).toBe("ＣＤ");
  });

  it("finds a word JMdict writes in full-width characters by either spelling, and shows its own", async () => {
    const words = await loadWords(["1人", "１人"]);
    const found = wordsOf(words, "1人");
    expect(found.length).toBeGreaterThan(0);
    expect(found[0]?.written).toBe("１人");
    expect(wordsOf(words, "１人").map((one) => one.reading)).toEqual(found.map((one) => one.reading));
  });

  it("finds a long vowel written with any dash", async () => {
    const words = await loadWords(["コーヒー", "コ-ヒ-", "ｺｰﾋｰ", "こーひー"]);
    for (const text of ["コーヒー", "コ-ヒ-", "ｺｰﾋｰ", "こーひー"])
      expect(wordsOf(words, text)[0]?.reading, text).toBe("コーヒー");
  });
});

describe("a lookup of what is odd", () => {
  it("is nothing to load and nothing found, never an error, however odd and however long", async () => {
    const next = random(1103);
    const texts: string[] = ["", " ", "\u200B", "a".repeat(100_000), "紙".repeat(100_000), "𐀀\uDC00", "x".repeat(101)];
    for (let at = 0; at < 150; at++) {
      let text = "";
      for (let n = Math.floor(next() * 12); n > 0; n--) text += ODD[Math.floor(next() * ODD.length)];
      texts.push(text);
    }
    const words = await loadWords(texts);
    for (const text of texts) expect(Array.isArray(wordsOf(words, text)), JSON.stringify(text)).toBe(true);
    expect(wordsOf(words, "a".repeat(100_000))).toEqual([]);
    for (const odd of [undefined, null, 5, {}]) {
      const loaded = await loadWords(odd as unknown as string);
      expect(loaded.entries.size).toBe(0);
    }
    const mixed = await loadWords([5, null, "かみ", undefined] as unknown as string[]);
    expect(wordsOf(mixed, "かみ").length).toBeGreaterThan(0);
  });

  it("is the same for the common table", async () => {
    const common = await loadCommonWords();
    for (const text of ["", "\u200B", "a".repeat(5000), "😀", "ｶﾐ"])
      expect(Array.isArray(wordsOf(common, text))).toBe(true);
    expect(wordsOf(common, "ｶﾐ")[0]?.written).toBe("紙");
  });
});

describe("every written form is found by itself", () => {
  it("is a key the lookup makes of the form: nothing the tables hold is out of reach of a text made plain", async () => {
    const odd: string[] = [];
    for (const [at, load] of MANIFEST.forms.load.entries()) {
      const piece = await load();
      for (const line of piece.rows) {
        const key = line.slice(0, line.indexOf("\t"));
        if (normalizeText(key) !== key) odd.push(`${at} ${JSON.stringify(key)}`);
      }
    }
    // A form the lookup would change before it looks: a space beside Japanese, a dash after a kana. JMdict has none; one is a form
    // nobody could ask for.
    expect(odd.slice(0, 20)).toEqual([]);
  }, 60_000);

  it("is a reading the lookup makes of the reading", async () => {
    const odd: string[] = [];
    for (const [at, load] of MANIFEST.readings.load.entries()) {
      const piece = await load();
      for (const line of piece.rows) {
        const reading = line.slice(0, line.indexOf("\t"));
        if (/^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/.test(reading) && keyOf(reading) !== keyOf(normalizeText(reading)))
          odd.push(`${at} ${reading}`);
      }
    }
    expect(odd.slice(0, 20)).toEqual([]);
  }, 60_000);
});
