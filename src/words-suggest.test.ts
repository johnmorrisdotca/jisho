import { describe, expect, it } from "vitest";

import { SUGGEST_MOST, suggestWords } from "./words-suggest.ts";

const written = async (text: string, options = {}) =>
  (await suggestWords(text, options)).map((one) => one.word.written);

describe("a slip in romaji or kana finds the word that was meant", () => {
  it("a letter too many, too few, wrong or swapped, in romaji", async () => {
    expect(await written("nihonngo")).toContain("日本語");
    expect(await written("nihogo")).toContain("日本語");
    expect(await written("nihonga", { limit: 20 })).toContain("日本語");
    expect(await written("arigatuo")).toContain("ありがとう");
    expect(await written("ohayou gozaimsu")).toContain("おはようございます");
  });

  it("a kana too many, too few, wrong or swapped", async () => {
    expect(await written("にほんこ", { limit: 20 })).toContain("日本語");
    expect(await written("ありがとお", { limit: 20 })).toContain("ありがとう");
    expect(await written("ありがう")).toContain("ありがとう");
    expect(await written("ありとがう")).toContain("ありがとう");
    expect(await written("ニホンゴ")).toContain("日本語");
  });

  it("gives the exact words first (distance 0), then those one slip away, the commonest first", async () => {
    const found = await suggestWords("kami", { limit: 20 });
    const distances = found.map((one) => one.distance);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(found[0]?.distance).toBe(0);
    expect(found[0]?.word.written).toBe("紙");
    expect(found.some((one) => one.distance === 1)).toBe(true);
    const ones = found.filter((one) => one.distance === 1).map((one) => one.word.rank);
    expect(ones).toEqual([...ones].sort((a, b) => a - b));
  });

  it("gives each word once, and no more than the limit", async () => {
    const found = await suggestWords("kamii", { limit: 20 });
    expect(new Set(found.map((one) => `${one.word.written}${one.word.reading}`)).size).toBe(found.length);
    expect((await suggestWords("kamii", { limit: 2 })).length).toBe(2);
    expect((await suggestWords("kamii", { limit: 99 })).length).toBeLessThanOrEqual(SUGGEST_MOST);
    expect((await suggestWords("kamii", { limit: Number.NaN })).length).toBeLessThanOrEqual(5);
  });
});

describe("what it does not do", () => {
  it("gives nothing for kanji, an empty text, a text of other letters or one that is far too long", async () => {
    expect(await suggestWords("紙")).toEqual([]);
    expect(await suggestWords("")).toEqual([]);
    expect(await suggestWords("1234")).toEqual([]);
    expect(await suggestWords("a".repeat(41))).toEqual([]);
    expect(await suggestWords("kami!!")).toEqual([]);
  });

  it("leaves out in safe mode a word that is not for it, and gives it when asked for everything", async () => {
    const safe = await written("homobideo", { limit: 20 });
    const whole = await written("homobideo", { mode: "unfiltered", limit: 20 });
    expect(safe).not.toContain("ホモビデオ");
    expect(whole.length).toBeGreaterThanOrEqual(safe.length);
  });

  it("applies the consumer's lists, and refuses what is not a mode or a list", async () => {
    expect(await written("kami", { block: ["紙"] })).not.toContain("紙");
    expect(await written("kami", { allow: ["神"] })).toEqual(["神"]);
    await expect(suggestWords("kami", { mode: "careful" as never })).rejects.toThrow(TypeError);
    await expect(suggestWords("kami", { block: "神" as never })).rejects.toThrow(TypeError);
  });
});
