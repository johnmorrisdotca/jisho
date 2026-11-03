import { describe, expect, it } from "vitest";
import { GOLDEN } from "./deinflect-golden.test.ts";
import { findInflected, inflectedOf, loadCommonWords, loadWords } from "./words.ts";

const same = (left: readonly string[], right: readonly string[]) => left.join(", ") === right.join(", ");

describe("the golden set against the dictionary", () => {
  it("finds the dictionary word, of the right kind, by the path, for every form", async () => {
    const missed: string[] = [];
    for (let at = 0; at < GOLDEN.length; at += 40) {
      const part = GOLDEN.slice(at, at + 40);
      const words = await loadWords(
        part.map((one) => one.form),
        { inflected: true },
      );
      for (const one of part) {
        const found = inflectedOf(words, one.form).some(
          (hit) =>
            same(hit.path, one.path) &&
            hit.word.kinds.includes(one.kind) &&
            (hit.word.forms.includes(one.base) || hit.word.reading === one.base),
        );
        if (!found) missed.push(`${one.form} -> ${one.base} (${one.kind}) [${one.path.join(", ")}]`);
      }
    }
    expect(missed).toEqual([]);
  });
});

describe("findInflected", () => {
  it("finds 食べる for 食べなかった and says how: the negative, then the past", async () => {
    const found = await findInflected("食べなかった");
    expect(found[0]?.word.written).toBe("食べる");
    expect(found[0]?.path).toEqual(["negative", "past"]);
    expect(found[0]?.word.meaning).toContain("eat");
  });

  it("gives the text's own words first, with no path, and then the words it could come from", async () => {
    const found = await findInflected("来た");
    expect(found[0]?.path).toEqual([]);
    expect(found.some((one) => one.word.written === "来る" && same(one.path, ["past"]))).toBe(true);
    expect(found.findIndex((one) => one.path.length > 0)).toBeGreaterThan(0);
  });

  it("reads kana, katakana and a verb written in both: たべなかった, ググらなかった", async () => {
    expect((await findInflected("たべなかった"))[0]?.word.written).toBe("食べる");
    expect((await findInflected("ググらなかった"))[0]?.word.reading).toBe("ググる");
  });

  it("reads romaji when it is asked to", async () => {
    const found = await findInflected("tabenakatta", { romaji: true });
    expect(found.some((one) => one.word.written === "食べる" && same(one.path, ["negative", "past"]))).toBe(true);
  });

  it("keeps only words of the kind the ending needs: 取れる is not a way to 取る's ichidan form", async () => {
    const found = await findInflected("書いた");
    expect(found.every((one) => one.path.length === 0 || one.word.kinds.includes("g"))).toBe(true);
    expect(found.map((one) => one.word.written)).toContain("書く");
  });

  it("is nothing for a word that is no conjugation, and for odd input", async () => {
    const paper = await findInflected("紙");
    expect(paper.length).toBeGreaterThan(0);
    expect(paper.every((one) => one.word.written === "紙" && one.path.length === 0)).toBe(true);
    expect(await findInflected("")).toEqual([]);
    expect(await findInflected("😀")).toEqual([]);
    expect(await findInflected("あいうえおかきくけこ")).toEqual([]);
  });

  it("takes the mode: safe by default, everything when unfiltered", async () => {
    const safe = await findInflected("死んだ");
    expect(safe.some((one) => one.word.written === "死ぬ")).toBe(true);
    const all = await findInflected("死んだ", { mode: "unfiltered" });
    expect(all.length).toBeGreaterThanOrEqual(safe.length);
    await expect(findInflected("食べた", { mode: "bogus" as never })).rejects.toThrow(TypeError);
  });
});

describe("inflectedOf", () => {
  it("answers from words loaded with inflected: true, and adds to words already loaded", async () => {
    const first = await loadWords("食べた", { inflected: true });
    const both = await loadWords("書いた", { inflected: true, previous: first });
    expect(inflectedOf(both, "食べた")[0]?.word.written).toBe("食べる");
    expect(inflectedOf(both, "書いた")[0]?.word.written).toBe("書く");
  });

  it("throws, rather than answer as if the dictionary had none, for a text loaded without inflected: true", async () => {
    const plain = await loadWords("食べた");
    expect(() => inflectedOf(plain, "食べた")).toThrow(RangeError);
    expect(() => inflectedOf(plain, "食べた")).toThrow(/inflected: true/);
    expect(() => inflectedOf(plain, "書いた")).toThrow(RangeError);
  });

  it("works on the table of common words with nothing more loaded", async () => {
    const common = await loadCommonWords();
    const found = inflectedOf(common, "見ませんでした");
    expect(found[0]?.word.written).toBe("見る");
    expect(found[0]?.path).toEqual(["polite", "negative", "past"]);
  });

  it("gives a word once, by the shortest path", async () => {
    const found = await findInflected("行って");
    const keys = found.map((one) => `${one.word.reading}${one.word.written}${one.word.meaning}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(found.filter((one) => one.word.reading === "いく").every((one) => same(one.path, ["te"]))).toBe(true);
  });
});
