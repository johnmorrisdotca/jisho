import { describe, expect, it } from "vitest";
import { COMMON_WORDS } from "./data/words/common.data.ts";
import { findByMeaning, loadCommonWords, loadWords, readCommonWords, wordsOf, wordsWithKanji } from "./words.ts";
import type { WordsMode } from "./words.types.ts";
import { hasMarks, modeOf } from "./words-filter.ts";

/** Every way a caller can get the mode wrong, for JavaScript callers that TypeScript does not stop. */
const WRONG = [
  "Safe",
  "SAFE",
  "Unfiltered",
  "UNFILTERED",
  "unsafe",
  "Unsafe",
  "",
  " safe",
  "safe ",
  "bogus",
  null,
  0,
  1,
  true,
  false,
  {},
  [],
];
const asMode = (value: unknown) => value as WordsMode;

describe("the mode every lookup takes", () => {
  it("is safe when none is given, and safe or unfiltered when one is", () => {
    expect(modeOf(undefined)).toBe("safe");
    expect(modeOf("safe")).toBe("safe");
    expect(modeOf("unfiltered")).toBe("unfiltered");
  });

  it("throws a TypeError for any other spelling, naming it", () => {
    for (const wrong of WRONG) {
      expect(() => modeOf(wrong), String(wrong)).toThrow(TypeError);
      expect(() => modeOf(wrong), String(wrong)).toThrow(/safe.*unfiltered/);
    }
  });

  it("is refused by loadWords, loadCommonWords, readCommonWords, findByMeaning and wordsWithKanji alike", async () => {
    for (const wrong of WRONG) {
      const mode = asMode(wrong);
      await expect(loadWords("あげちん", { mode }), String(wrong)).rejects.toThrow(TypeError);
      await expect(loadCommonWords({ mode }), String(wrong)).rejects.toThrow(TypeError);
      expect(() => readCommonWords(COMMON_WORDS, { mode }), String(wrong)).toThrow(TypeError);
      await expect(findByMeaning("water", { mode }), String(wrong)).rejects.toThrow(TypeError);
      await expect(wordsWithKanji("山", { mode }), String(wrong)).rejects.toThrow(TypeError);
    }
  });

  it("is refused even when there is nothing to look up, so a typo is never quietly ignored", async () => {
    await expect(loadWords("", { mode: asMode("Safe") })).rejects.toThrow(TypeError);
    await expect(findByMeaning("zxqvwj", { mode: asMode("Safe") })).rejects.toThrow(TypeError);
    await expect(findByMeaning("", { mode: asMode("Safe") })).rejects.toThrow(TypeError);
    await expect(wordsWithKanji("a", { mode: asMode("Safe") })).rejects.toThrow(TypeError);
  });

  it("never turns the filter off: the wrong spellings that used to return vulgar senses now throw, and undefined stays safe", async () => {
    for (const mode of [undefined, "safe"] as const) {
      const words = await loadWords("あげちん", { mode });
      for (const word of wordsOf(words, "あげちん")) expect(hasMarks(word, ["vulg", "X", "sens", "derog"])).toBe(false);
      expect(words.mode).toBe("safe");
    }
    expect((await loadWords("あげちん", { mode: "unfiltered" })).mode).toBe("unfiltered");
    expect((await loadCommonWords({ mode: undefined })).mode).toBe("safe");
  });

  it("keeps the mode of the words being added to when none is given, and refuses a wrong one", async () => {
    const first = await loadWords("かみ", { mode: "unfiltered" });
    expect((await loadWords("紙", { previous: first })).mode).toBe("unfiltered");
    await expect(loadWords("紙", { previous: first, mode: asMode("UNFILTERED") })).rejects.toThrow(TypeError);
  });
});
