import { describe, expect, it } from "vitest";
import { MAX_READ_LENGTH, readText } from "./reader.ts";

const texts = (result: Awaited<ReturnType<typeof readText>>) => result.tokens.map((token) => token.text);

// Each sentence is cut into the words a reader would cut it into. Written out by hand; no native reader has checked them yet.
const SENTENCES: [string, string[]][] = [
  ["私は昨日、友達と学校に行きました。", ["私", "は", "昨日", "、", "友達", "と", "学校", "に", "行きました", "。"]],
  ["今日はいい天気ですね。", ["今日", "は", "いい天気", "です", "ね", "。"]],
  ["私は寿司を食べなかった。", ["私", "は", "寿司", "を", "食べなかった", "。"]],
  ["ここではきものをぬいでください", ["ここ", "では", "きもの", "を", "ぬいでください"]],
  ["あのひとはせんせいです", ["あのひと", "は", "せんせい", "です"]],
  ["すみません、駅はどこですか", ["すみません", "、", "駅", "は", "どこ", "ですか"]],
  ["彼女は美しかったです", ["彼女", "は", "美しかったです"]],
  ["毎日日本語を勉強しています。", ["毎日", "日本語", "を", "勉強しています", "。"]],
  ["それはおいしそうなケーキですね", ["それ", "は", "おいしそう", "な", "ケーキ", "です", "ね"]],
];

describe("readText", () => {
  it.each(SENTENCES)("cuts %s into its words", async (sentence, words) => {
    const result = await readText(sentence);
    expect(texts(result)).toEqual(words);
    expect(texts(result).join("")).toBe(sentence);
    expect(result.unknown).toEqual([]);
  });

  it("gives each word its dictionary form, the path to the text, its furigana, reading, meaning and levels", async () => {
    const [, , , , token] = (await readText("私は寿司を食べなかった。")).tokens;
    expect(token).toMatchObject({
      text: "食べなかった",
      kind: "word",
      form: "食べる",
      path: ["negative", "past"],
      reading: "たべなかった",
      level: "N5",
    });
    expect(token?.furigana).toEqual([{ text: "食", reading: "た" }, { text: "べなかった" }]);
    expect(token?.meaning).toContain("eat");
    expect(token?.kanji).toEqual([{ kanji: "食", grade: 2, level: "N5" }]);
    expect(token?.word?.written).toBe("食べる");
  });

  it("takes the hardest JLPT level among a word's kanji, and every kanji's grade", async () => {
    const [token] = (await readText("寿司")).tokens;
    expect(token?.kanji.map((one) => one.kanji)).toEqual(["寿", "司"]);
    expect(token?.level).toBe("N1");
    const [school] = (await readText("学校")).tokens;
    expect(school?.kanji).toEqual([
      { kanji: "学", grade: 1, level: "N5" },
      { kanji: "校", grade: 1, level: "N5" },
    ]);
    expect((await readText("ひらがな")).tokens[0]?.level).toBeNull();
  });

  it("reads a word in kana as the word usually written in kana: は is the particle, not a leaf or a tooth", async () => {
    const [token] = (await readText("は")).tokens;
    expect(token?.meaning).toMatch(/topic|sentence/);
    expect(token?.alternatives.length).toBeGreaterThan(0);
  });

  it("reads the い of いい as よ in a conjugated form, and 来 as its ending asks", async () => {
    expect((await readText("良かった")).tokens[0]).toMatchObject({ reading: "よかった", form: "良い" });
    expect((await readText("来なかった")).tokens[0]).toMatchObject({ reading: "こなかった" });
    expect((await readText("来ました")).tokens[0]).toMatchObject({ reading: "きました" });
  });

  it("lists what no word fits, once each, and keeps it in place", async () => {
    const result = await readText("私はぬぬぬぬぬを食べる。ぬぬぬぬぬ");
    expect(result.unknown).toEqual(["ぬぬぬぬぬ"]);
    expect(result.tokens.filter((token) => token.kind === "unknown").map((token) => token.text)).toEqual([
      "ぬぬぬぬぬ",
      "ぬぬぬぬぬ",
    ]);
    expect(texts(result).join("")).toBe("私はぬぬぬぬぬを食べる。ぬぬぬぬぬ");
  });

  it("keeps what is not Japanese as it is: spaces, digits, Latin letters and punctuation are not words and not unknown", async () => {
    const result = await readText("私は 3 人と Tokyo へ！");
    expect(result.tokens.filter((token) => token.kind === "other").map((token) => token.text)).toEqual([
      " 3 ",
      " Tokyo ",
      "!",
    ]);
    expect(result.unknown).toEqual([]);
    expect(result.tokens.every((token) => token.kind !== "other" || token.word === null)).toBe(true);
  });

  it("makes the text plain first: full-width digits and letters, half-width kana, invisible characters", async () => {
    const result = await readText("ｶﾐ​１");
    expect(result.text).toBe("カミ1");
    expect(texts(result).join("")).toBe("カミ1");
  });

  it("is nothing for an empty text or one that is not text, and cuts a text that is too long", async () => {
    expect((await readText("")).tokens).toEqual([]);
    expect((await readText(undefined as never)).tokens).toEqual([]);
    const long = await readText("。".repeat(MAX_READ_LENGTH + 1));
    expect(long.truncated).toBe(true);
    expect(long.text.length).toBe(MAX_READ_LENGTH);
    expect((await readText("私")).truncated).toBe(false);
  });

  it("says the JMdict release, and takes the mode: safe leaves out what unfiltered gives", async () => {
    const safe = await readText("外人");
    expect(safe.release).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const unfiltered = await readText("外人", { mode: "unfiltered" });
    expect(unfiltered.tokens[0]?.word?.senses.some((sense) => sense.marks.includes("sens"))).toBe(true);
    await expect(readText("外人", { mode: "bogus" as never })).rejects.toThrow(TypeError);
  });
});
