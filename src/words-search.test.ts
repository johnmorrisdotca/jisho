import { describe, expect, it } from "vitest";
import { KANJI } from "./data/kanji.data.ts";
import { INDEX_MANIFEST } from "./data/words/index-manifest.data.ts";
import { MANIFEST } from "./data/words/manifest.data.ts";
import { readKanji } from "./index.ts";
import {
  commonestFirst,
  findByMeaning,
  kanjiOfWord,
  loadCommonWords,
  loadWords,
  priorityTags,
  rankOfTags,
  searchMeanings,
  wordsOf,
  wordsWithKanji,
} from "./words.ts";
import type { WordsPiece } from "./words.types.ts";
import { hasMarks } from "./words-filter.ts";

const glossesOf = (word: { senses: readonly { glosses: readonly string[] }[] }) =>
  word.senses.flatMap((sense) => sense.glosses);

describe("words found by what they mean", () => {
  it("find the commonest words whose gloss holds the whole word, the exact gloss first", async () => {
    const found = await findByMeaning("water");
    expect(found.length).toBeGreaterThan(3);
    expect(found.length).toBeLessThanOrEqual(10);
    expect(found[0]?.written).toBe("水");
    for (const word of found)
      expect(
        glossesOf(word).some((gloss) => /\bwater\b/i.test(gloss)),
        word.written,
      ).toBe(true);
  });

  it("do not find part of a word: water is not in watermelon", async () => {
    const found = await findByMeaning("melon");
    expect(found.map((one) => one.written)).toContain("メロン");
    const water = await findByMeaning("watermelon");
    expect(water.map((one) => one.reading)).toContain("すいか");
    for (const word of water) expect(glossesOf(word).some((gloss) => /\bwatermelon\b/i.test(gloss))).toBe(true);
  });

  it("find a phrase whose words follow each other, and leave out the words every gloss has", async () => {
    const found = await findByMeaning("go out");
    expect(found.length).toBeGreaterThan(0);
    for (const word of found)
      expect(
        glossesOf(word).some((gloss) => /\bgo(?:es|ing)? out\b|\bgo out\b/i.test(gloss)),
        word.written,
      ).toBe(true);
    expect((await findByMeaning("to walk", { limit: 20 })).map((one) => one.written)).toContain("歩く");
    expect((await findByMeaning("walk", { limit: 20 })).map((one) => one.written)).toContain("歩く");
  });

  it("are as many as asked for, at most twenty, and as few as there are", async () => {
    expect(await findByMeaning("water", { limit: 3 })).toHaveLength(3);
    expect((await findByMeaning("water", { limit: 500 })).length).toBeLessThanOrEqual(20);
    expect((await findByMeaning("water", { limit: -4 })).length).toBeGreaterThan(0);
    expect((await findByMeaning("water", { limit: Number.NaN })).length).toBeLessThanOrEqual(10);
    expect(await findByMeaning("zxqvwj")).toEqual([]);
  });

  it("are none for a text with no word to find, and never an error", async () => {
    for (const text of ["", " ", "the", "to be", "☃", "紙", "\u200B", "a".repeat(5000), "\uD800", "😀😀"])
      expect(await findByMeaning(text), text).toEqual([]);
    for (const odd of [undefined, null, 5]) expect(await findByMeaning(odd as unknown as string)).toEqual([]);
  });

  it("keep to the mode: safe leaves out what safe mode leaves out, unfiltered has it", async () => {
    const safe = await findByMeaning("cunnilingus");
    expect(safe.map((one) => one.written)).not.toContain("ハーモニカ");
    for (const word of safe) expect(hasMarks(word, ["vulg", "X", "sens", "derog"])).toBe(false);
    const everything = await findByMeaning("cunnilingus", { mode: "unfiltered" });
    expect(everything.map((one) => one.written)).toContain("ハーモニカ");
    expect(everything.length).toBeGreaterThan(safe.length);
  });

  it("lay the consumer's lists over what is found", async () => {
    const all = await findByMeaning("water");
    const blocked = await findByMeaning("water", { block: ["水", "みず"] });
    expect(blocked.map((one) => one.written)).not.toContain("水");
    expect(blocked.length).toBeLessThan(all.length);
    expect((await findByMeaning("water", { allow: ["水"] })).map((one) => one.written)).toEqual(["水"]);
    expect(await findByMeaning("water", { allow: [] })).toEqual([]);
  });

  it("search words already loaded without fetching: the common table", async () => {
    const common = await loadCommonWords();
    const found = searchMeanings(common, "paper");
    expect(found[0]?.written).toBe("紙");
    expect(searchMeanings(common, "")).toEqual([]);
    expect(searchMeanings(common, "the")).toEqual([]);
  });
});

describe("words found by a kanji", () => {
  it("are written with it, the commonest first, each shown by the form that holds it", async () => {
    const found = await wordsWithKanji("山", { limit: 12 });
    expect(found).toHaveLength(12);
    expect(found[0]?.written).toBe("山");
    for (const word of found) expect(word.written, word.reading).toContain("山");
    expect([...found].sort((a, b) => a.rank - b.rank).slice(0, 3)).toEqual(commonestFirst(found).slice(0, 3));
  });

  it("take the first kanji of the text, and none for a text with no kanji", async () => {
    expect((await wordsWithKanji("  山川 ", { limit: 3 }))[0]?.written).toBe("山");
    for (const text of ["", "やま", "abc", "😀", "々", "\uD800", "ー"])
      expect(await wordsWithKanji(text), text).toEqual([]);
  });

  it("keep to the mode and the lists", async () => {
    const found = await wordsWithKanji("山", { block: ["山"] });
    expect(found.map((one) => one.written)).not.toContain("山");
    expect(found.length).toBeGreaterThan(0);
    const unfiltered = await wordsWithKanji("淫", { mode: "unfiltered" });
    const safe = await wordsWithKanji("淫");
    expect(unfiltered.length).toBeGreaterThanOrEqual(safe.length);
    for (const word of safe) expect(hasMarks(word, ["vulg", "X", "sens", "derog"])).toBe(false);
  });

  it("link a word to its kanji in the table of kanji, with their grade, level and readings", async () => {
    const table = readKanji(KANJI);
    const words = await loadWords(["日本", "やま", "ひらがな"]);
    const nihon = wordsOf(words, "日本")[0];
    expect(nihon && kanjiOfWord(nihon, table).map((one) => [one.kanji, one.grade, one.level])).toEqual([
      ["日", 1, "N5"],
      ["本", 1, "N5"],
    ]);
    const yama = wordsOf(words, "やま")[0];
    expect(yama && kanjiOfWord(yama, table).map((one) => one.kanji)).toEqual(["山"]);
    const kana = wordsOf(words, "ひらがな")[0];
    expect(kana && kanjiOfWord(kana, table).map((one) => one.kanji)).toEqual(["平", "仮", "名"]);
    expect(nihon && kanjiOfWord(nihon, [])).toEqual([]);
  });
});

describe("how common a word is", () => {
  it("is the priority tags JMdict gives it, and one rank made from them", async () => {
    const words = await loadWords(["紙", "ぬぬぬぬ"]);
    const kami = wordsOf(words, "紙")[0];
    expect(kami?.priority).toEqual(["news1", "ichi1", "nf03"]);
    expect(kami?.rank).toBe(1250);
    expect(priorityTags("")).toEqual([]);
    expect(priorityTags("ni03")).toEqual(["news1", "ichi1", "nf03"]);
    expect(priorityTags("stg")).toEqual(["spec1", "spec2", "gai1"]);
    expect(rankOfTags([])).toBe(100_000);
    expect(rankOfTags(["news1"])).toBe(12_000);
    expect(rankOfTags(["ichi2"])).toBe(24_000);
    expect(rankOfTags(["gai2", "nf01"])).toBe(250);
  });

  it("puts the commonest first, and a word with no priority last", async () => {
    const words = await loadWords("かみ");
    const all = wordsOf(words, "かみ");
    const ranks = all.map((one) => one.rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(commonestFirst([...all].reverse()).map((one) => one.rank)).toEqual(ranks);
    expect(all.at(-1)?.rank).toBe(100_000);
  });
});

describe("what a lookup by reading fetches", () => {
  it("does not touch the indexes: a plain kana guess fetches exactly the one piece it did before", async () => {
    const asked: string[] = [];
    const wrap = (name: string, load: readonly (() => Promise<WordsPiece>)[]) =>
      load.forEach((fetchIt, at) => {
        (load as (() => Promise<WordsPiece>)[])[at] = () => {
          asked.push(`${name}${at}`);
          return fetchIt();
        };
      });
    wrap("m", INDEX_MANIFEST.meanings.load);
    wrap("k", INDEX_MANIFEST.kanji.load);
    wrap("r", MANIFEST.readings.load);
    wrap("f", MANIFEST.forms.load);
    await loadWords("まったくべつのことば");
    expect(asked.filter((name) => /^[mk]/.test(name))).toEqual([]);
    expect(asked.filter((name) => name.startsWith("r"))).toHaveLength(1);
    expect(asked).toHaveLength(1);
  });
});
