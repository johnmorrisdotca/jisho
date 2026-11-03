import { describe, expect, it } from "vitest";
import { kanaFromRomaji, romajiToKana } from "./romaji.ts";

describe("romaji into hiragana", () => {
  it("reads modified Hepburn", () => {
    const cases: [string, string][] = [
      ["kami", "かみ"],
      ["shinbun", "しんぶん"],
      ["shimbun", "しんぶん"],
      ["gakkō", "がっこう"],
      ["gakkou", "がっこう"],
      ["Tōkyō", "とうきょう"],
      ["tsukue", "つくえ"],
      ["chizu", "ちず"],
      ["fuji", "ふじ"],
      ["jisho", "じしょ"],
      ["ryokō", "りょこう"],
      ["kyō", "きょう"],
      ["sensei", "せんせい"],
      ["ai", "あい"],
      ["matcha", "まっちゃ"],
      ["zasshi", "ざっし"],
      ["kitte", "きって"],
      ["konnichiwa", "こんにちわ"],
      ["kon'nichi", "こんにち"],
      ["kannai", "かんない"],
      ["kanai", "かない"],
      ["hon", "ほん"],
      ["honnō", "ほんのう"],
      ["wo", "を"],
      ["nn", "ん"],
      ["n", "ん"],
      ["cha", "ちゃ"],
      ["ja", "じゃ"],
      ["tchi", "っち"],
      ["ko-hi-", "こーひー"],
    ];
    for (const [romaji, kana] of cases) expect(romajiToKana(romaji), romaji).toBe(kana);
  });

  it("reads Kunrei and the sounds of loanwords", () => {
    const cases: [string, string][] = [
      ["si", "し"],
      ["ti", "ち"],
      ["tu", "つ"],
      ["hu", "ふ"],
      ["zi", "じ"],
      ["sya", "しゃ"],
      ["tyo", "ちょ"],
      ["zyu", "じゅ"],
      ["fa", "ふぁ"],
      ["vu", "ゔ"],
      ["thi", "てぃ"],
      ["je", "じぇ"],
      ["tsa", "つぁ"],
    ];
    for (const [romaji, kana] of cases) expect(romajiToKana(romaji), romaji).toBe(kana);
  });

  it("is the same in capitals, in full-width letters, with stray spaces, and with a decomposed macron", () => {
    for (const text of ["KAMI", "ｋａｍｉ", " ka mi ", "Ｋａｍｉ\u200B"]) expect(romajiToKana(text), text).toBe("かみ");
    expect(romajiToKana("Tōkyō")).toBe("とうきょう");
    expect(romajiToKana("Tôkyô")).toBe("とうきょう");
  });

  it("gives every way a long vowel can be read, the usual first, at most eight", () => {
    expect(kanaFromRomaji("kōhī")).toEqual(["こうひい", "こーひー", "こうひー", "こおひい", "こおひー", "こーひい"]);
    expect(kanaFromRomaji("Tōkyō")).toContain("とうきょう");
    expect(kanaFromRomaji("Tōkyō")).toContain("とーきょー");
    expect(kanaFromRomaji("kami")).toEqual(["かみ"]);
    expect(kanaFromRomaji("ōōōōōō").length).toBeLessThanOrEqual(8);
    expect(kanaFromRomaji("ōōōōōō")[0]).toBe("おうおうおうおうおうおう");
  });

  it("is nothing for a text that is not romaji, and never throws", () => {
    for (const text of [
      "",
      " ",
      "かみ",
      "紙",
      "Hello!",
      "123",
      "x",
      "q",
      "xyz",
      "c",
      "ya ya y",
      "n.",
      "a😀",
      "\u0000",
      "—",
    ])
      expect(romajiToKana(text), JSON.stringify(text)).toBeNull();
    for (const odd of [undefined, null, 5, {}]) expect(kanaFromRomaji(odd as unknown as string)).toEqual([]);
    expect(kanaFromRomaji("a".repeat(100_000))).toEqual([]);
  });
});
