import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MANIFEST } from "./data/words/manifest.data.ts";
import { loadWords, wordsOf } from "./words.ts";
import type { PieceSet, WordsPiece } from "./words.types.ts";
import { indexed, retry, WordsLoadError } from "./words-pieces.ts";

const key = (line: string) => line.slice(0, line.indexOf("\t"));
const piece: WordsPiece = { rows: ["a\t1", "b\t2"] };

/** A set of one piece whose fetch is the function given, counting how often it is asked. */
function setOf(run: (call: number) => Promise<WordsPiece>): { set: PieceSet; calls: () => number } {
  let calls = 0;
  return { set: { starts: [""], load: [() => run(++calls)] }, calls: () => calls };
}

beforeEach(() => {
  retry.delayMs = 0;
});

describe("a piece is fetched once however many lookups ask at the same moment", () => {
  it("shares one fetch between lookups that overlap, and none after", async () => {
    const { set, calls } = setOf(async () => {
      await new Promise((done) => setTimeout(done, 20));
      return piece;
    });
    const all = await Promise.all(Array.from({ length: 8 }, () => indexed("readings", set, 0, key)));
    expect(calls()).toBe(1);
    expect(new Set(all).size).toBe(1);
    await indexed("readings", set, 0, key);
    expect(calls()).toBe(1);
  });

  it("is one fetch for several loadWords at once for the same pieces", async () => {
    const at = MANIFEST.readings.starts.length - 3;
    const original = MANIFEST.readings.load[at];
    let calls = 0;
    (MANIFEST.readings.load as (() => Promise<WordsPiece>)[])[at] = () => {
      calls++;
      return original?.() ?? Promise.reject(new Error("no piece"));
    };
    try {
      const start = MANIFEST.readings.starts[at] ?? "";
      const texts = await Promise.all([
        loadWords(start === "" ? "ん" : start),
        loadWords(start === "" ? "ん" : start),
        loadWords([start === "" ? "ん" : start]),
      ]);
      expect(calls).toBe(1);
      expect(texts).toHaveLength(3);
    } finally {
      (MANIFEST.readings.load as (() => Promise<WordsPiece>)[])[at] = original as () => Promise<WordsPiece>;
    }
  });
});

describe("a piece that fails is asked for once more", () => {
  it("answers when the second ask works", async () => {
    const { set, calls } = setOf(async (call) => (call === 1 ? Promise.reject(new TypeError("network down")) : piece));
    expect((await indexed("forms", set, 0, key)).get("a")).toEqual(["a\t1"]);
    expect(calls()).toBe(2);
  });

  it("rejects with a typed error that names the piece, when the second ask fails too", async () => {
    const cause = new TypeError("Failed to fetch");
    const { set, calls } = setOf(() => Promise.reject(cause));
    const error = await indexed("readings", set, 0, key).catch((one: unknown) => one);
    expect(calls()).toBe(2);
    expect(error).toBeInstanceOf(WordsLoadError);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(TypeError);
    const failed = error as WordsLoadError;
    expect(failed.name).toBe("WordsLoadError");
    expect(failed.kind).toBe("readings");
    expect(failed.index).toBe(0);
    expect(failed.piece).toBe("the readings piece 0 of 1");
    expect(failed.message).toContain("the readings piece 0 of 1");
    expect(failed.message).toContain("Failed to fetch");
    expect(failed.cause).toBe(cause);
  });

  it("does not remember a failure: asking again tries again", async () => {
    const { set, calls } = setOf(async (call) => (call <= 2 ? Promise.reject(new Error("down")) : piece));
    await expect(indexed("forms", set, 0, key)).rejects.toBeInstanceOf(WordsLoadError);
    expect(calls()).toBe(2);
    expect((await indexed("forms", set, 0, key)).get("b")).toEqual(["b\t2"]);
    expect(calls()).toBe(3);
  });

  it("says a piece that does not exist is a RangeError, not a fetch that failed", async () => {
    const { set } = setOf(async () => piece);
    await expect(indexed("readings", set, 5, key)).rejects.toBeInstanceOf(RangeError);
  });

  it("rejects loadWords with the error, naming the piece, and answers once the file is back", async () => {
    const at = 1;
    const original = MANIFEST.readings.load[at];
    const start = MANIFEST.readings.starts[at] ?? "";
    const text = start;
    (MANIFEST.readings.load as (() => Promise<WordsPiece>)[])[at] = () => Promise.reject(new TypeError("offline"));
    try {
      const error = await loadWords(text).catch((one: unknown) => one);
      expect(error).toBeInstanceOf(WordsLoadError);
      expect((error as WordsLoadError).kind).toBe("readings");
      expect((error as WordsLoadError).index).toBe(at);
    } finally {
      (MANIFEST.readings.load as (() => Promise<WordsPiece>)[])[at] = original as () => Promise<WordsPiece>;
    }
    const words = await loadWords(text);
    expect(wordsOf(words, text)).toBeInstanceOf(Array);
  });
});

describe("a lookup before loading keeps its clear error", () => {
  afterEach(() => {
    retry.delayMs = 250;
  });

  it("throws a RangeError that says what to do, and does not for a text with nothing in it", async () => {
    const words = await loadWords("かみ");
    expect(() => wordsOf(words, "いぬ")).toThrow(RangeError);
    expect(() => wordsOf(words, "いぬ")).toThrow(/was not loaded: ask loadWords for it before wordsOf/);
    expect(wordsOf(words, "")).toEqual([]);
    expect(wordsOf(words, "\u200B ")).toEqual([]);
  });
});
