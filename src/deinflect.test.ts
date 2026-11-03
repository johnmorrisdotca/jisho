import { describe, expect, it } from "vitest";
import { deinflect } from "./deinflect.ts";

const find = (text: string, base: string) => deinflect(text).filter((one) => one.base === base);

describe("deinflect", () => {
  it("walks the endings off outermost first: 食べなかった is the negative, then the past, of 食べる", () => {
    expect(find("食べなかった", "食べる")).toEqual([{ base: "食べる", kind: "i", path: ["negative", "past"] }]);
    expect(deinflect("食べなかった").map((one) => one.path.length)).toEqual(
      [...deinflect("食べなかった").map((one) => one.path.length)].sort((a, b) => a - b),
    );
  });

  it("proposes a form once, by the shortest path that reaches it", () => {
    const keys = deinflect("食べさせられたくなかった").map((one) => `${one.base}\0${one.kind}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(find("食べさせられる", "食べる")[0]?.path).toEqual(["causative", "passive"]);
  });

  it("gives nothing for a word no ending fits, an empty text, or a value that is not text", () => {
    expect(deinflect("紙")).toEqual([]);
    expect(deinflect("")).toEqual([]);
    expect(deinflect(undefined as never)).toEqual([]);
    expect(deinflect(42 as never)).toEqual([]);
  });

  it("reads 行く's te and past forms, which are not the く row's", () => {
    expect(find("行って", "行く")[0]?.path).toEqual(["te"]);
    expect(find("行った", "行く")[0]?.path).toEqual(["past"]);
    expect(find("書いて", "書く")[0]?.path).toEqual(["te"]);
    expect(find("買って", "行く")).toEqual([]);
  });

  it("reads 来る in kanji, and in kana only where no kanji comes before it", () => {
    expect(find("来なかった", "来る")[0]?.path).toEqual(["negative", "past"]);
    expect(find("きます", "くる")[0]?.path).toEqual(["polite"]);
    expect(find("持ってきた", "持ってくる")[0]?.path).toEqual(["past"]);
    expect(find("行きました", "行くる")).toEqual([]);
  });

  it("keeps an ichidan stem to a kanji or an え or い row kana, so that 取った is not 取るる's cousin", () => {
    expect(find("かった", "かる").every((one) => one.kind !== "i")).toBe(true);
    expect(find("たべた", "たべる")[0]?.kind).toBe("i");
  });

  it("reads a noun with する as the noun, and a verb with する as itself", () => {
    expect(find("勉強した", "勉強")[0]).toEqual({ base: "勉強", kind: "s", path: ["past"] });
    expect(find("愛した", "愛する")[0]).toEqual({ base: "愛する", kind: "s", path: ["past"] });
  });

  it("stops after a few steps, however long the ending", () => {
    const long = `食べ${"させられ".repeat(6)}たくなかった`;
    expect(find(long, "食べる")).toEqual([]);
  });
});
