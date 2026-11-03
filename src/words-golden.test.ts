import { describe, expect, it } from "vitest";
import { findByMeaning, loadWords, searchMeanings } from "./words.ts";

/** About thirty-five of the commonest English words, and the word each must give within its top three (scripts/words-tables.mjs, MODULES-263). */
const GOLDEN: readonly (readonly [string, string])[] = [
  ["drink", "飲む"],
  ["walk", "歩く"],
  ["eat", "食べる"],
  ["water", "水"],
  ["see", "見る"],
  ["read", "読む"],
  ["come", "来る"],
  ["run", "走る"],
  ["sleep", "寝る"],
  ["write", "書く"],
  ["buy", "買う"],
  ["sell", "売る"],
  ["open", "開く"],
  ["small", "小さい"],
  ["big", "大きい"],
  ["new", "新しい"],
  ["old", "古い"],
  ["slow", "遅い"],
  ["fast", "早い"],
  ["friend", "友人"],
  ["teacher", "先生"],
  ["student", "学生"],
  ["school", "学校"],
  ["dog", "犬"],
  ["cat", "猫"],
  ["fish", "魚"],
  ["tree", "木"],
  ["mountain", "山"],
  ["river", "川"],
  ["rain", "雨"],
  ["flower", "花"],
  ["snow", "雪"],
  ["horse", "馬"],
  ["eye", "目"],
  ["hand", "手"],
  ["mouth", "口"],
];

describe("the obvious word for an English word", () => {
  it.each(GOLDEN)("%s finds %s in its top three", async (english, word) => {
    const found = await findByMeaning(english);
    expect(
      found.slice(0, 3).map((one) => one.written),
      english,
    ).toContain(word);
  });

  it("is found even when only one word is asked for, and in unfiltered mode as well", async () => {
    for (const mode of ["safe", "unfiltered"] as const) {
      expect((await findByMeaning("drink", { limit: 3, mode })).map((one) => one.written)).toContain("飲む");
      expect((await findByMeaning("walk", { limit: 3, mode })).map((one) => one.written)).toContain("歩く");
      expect((await findByMeaning("eat", { limit: 3, mode })).map((one) => one.written)).toContain("食べる");
    }
  });

  it("puts a word whose first gloss is the term before one that has it later, whatever their ranks", async () => {
    const words = await loadWords(["のむ", "いっき"]);
    const found = searchMeanings(words, "drink").map((one) => one.reading);
    expect(found.indexOf("のむ")).toBeLessThan(found.indexOf("いっき"));
    // An aside is not part of a gloss: 水 is "water (esp. cool or cold)".
    expect(searchMeanings(await loadWords("みず"), "water")[0]?.written).toBe("水");
  });
});
