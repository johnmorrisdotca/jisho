import { describe, expect, it } from "vitest";
import { furiganaOf, furiganaOfSurface } from "./furigana.ts";

describe("furiganaOf", () => {
  it("matches the kana of a word against its reading, and the rest reads the kanji", () => {
    expect(furiganaOf("食べる", "たべる")).toEqual([{ text: "食", reading: "た" }, { text: "べる" }]);
    expect(furiganaOf("引っ越し", "ひっこし")).toEqual([
      { text: "引", reading: "ひ" },
      { text: "っ" },
      { text: "越", reading: "こ" },
      { text: "し" },
    ]);
    expect(furiganaOf("今日は", "きょうは")).toEqual([{ text: "今日", reading: "きょう" }, { text: "は" }]);
  });

  it("reads a run of kanji as one piece, and a word that cannot be matched as a whole", () => {
    expect(furiganaOf("日本語", "にほんご")).toEqual([{ text: "日本語", reading: "にほんご" }]);
    expect(furiganaOf("大人", "おとな")).toEqual([{ text: "大人", reading: "おとな" }]);
    expect(furiganaOf("食べる", "のむ")).toEqual([{ text: "食べる", reading: "のむ" }]);
  });

  it("gives a word with no kanji no reading, and takes a katakana reading as hiragana", () => {
    expect(furiganaOf("ビール", "ビール")).toEqual([{ text: "ビール" }]);
    expect(furiganaOf("かみ", "かみ")).toEqual([{ text: "かみ" }]);
    expect(furiganaOf("食べる", "タベル")).toEqual([{ text: "食", reading: "た" }, { text: "べる" }]);
  });
});

describe("furiganaOfSurface", () => {
  it("keeps the dictionary form's pieces as far as the two spellings agree", () => {
    expect(furiganaOfSurface("食べなかった", "食べる", "たべる")).toEqual([
      { text: "食", reading: "た" },
      { text: "べ" },
      { text: "なかった" },
    ]);
    expect(furiganaOfSurface("勉強した", "勉強", "べんきょう")).toEqual([
      { text: "勉強", reading: "べんきょう" },
      { text: "した" },
    ]);
    expect(furiganaOfSurface("行った", "行く", "いく")).toEqual([{ text: "行", reading: "い" }, { text: "った" }]);
    expect(furiganaOfSurface("食べる", "食べる", "たべる")).toEqual(furiganaOf("食べる", "たべる"));
  });

  it("reads 来 as its ending asks: こ, き or く", () => {
    const first = (surface: string) => furiganaOfSurface(surface, "来る", "くる")[0];
    expect(first("来ない")).toEqual({ text: "来", reading: "こ" });
    expect(first("来られた")).toEqual({ text: "来", reading: "こ" });
    expect(first("来ます")).toEqual({ text: "来", reading: "き" });
    expect(first("来た")).toEqual({ text: "来", reading: "き" });
    expect(first("来れば")).toEqual({ text: "来", reading: "く" });
  });

  it("gives a kana word's form as it is written, and a surface that cuts a kanji piece as one piece with no reading", () => {
    expect(furiganaOfSurface("たべなかった", "たべる", "たべる")).toEqual([{ text: "たべ" }, { text: "なかった" }]);
    expect(furiganaOfSurface("日本", "日本語", "にほんご")).toEqual([{ text: "日本" }]);
  });
});
