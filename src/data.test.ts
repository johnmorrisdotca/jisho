import { describe, expect, it } from "vitest";
import { GRADES } from "./data/grades.data.ts";
import { JLPT } from "./data/jlpt.data.ts";
import { KANJI } from "./data/kanji.data.ts";
import { LOOK_ALIKE } from "./data/look-alike.data.ts";
import {
  ELEMENTARY_GRADES,
  gradeOf,
  JLPT_LEVELS,
  JOYO_GRADES,
  kanjiIn,
  kanjiOfGrade,
  kanjiOfLevel,
  levelOf,
  lookAlikes,
  readKanji,
  SCHOOL_GRADES,
  searchKanji,
} from "./index.ts";

const kanji = readKanji(KANJI);
const row = (one: string) => kanji.find((each) => each.kanji === one);

describe("the school grades", () => {
  it("hold the numbers the Ministry of Education's lists do", () => {
    const counts = SCHOOL_GRADES.map((grade) => kanjiOfGrade(GRADES, grade).length);
    expect(counts).toEqual([80, 160, 200, 202, 193, 191, 1110, 651, 212]);
    expect(ELEMENTARY_GRADES.flatMap((grade) => kanjiOfGrade(GRADES, grade))).toHaveLength(1026);
    expect(JOYO_GRADES.flatMap((grade) => kanjiOfGrade(GRADES, grade))).toHaveLength(2136);
  });

  it("put each kanji in one grade, and say so for a few anybody can check", () => {
    const all = SCHOOL_GRADES.flatMap((grade) => kanjiOfGrade(GRADES, grade));
    expect(new Set(all).size).toBe(all.length);
    expect(gradeOf(GRADES, "一")).toBe(1);
    expect(gradeOf(GRADES, "語")).toBe(2);
    expect(gradeOf(GRADES, "鬱")).toBe(8);
    expect(gradeOf(GRADES, "龘")).toBeNull();
  });
});

describe("the JLPT levels", () => {
  it("hold what Waller's five pages hold, each kanji once", () => {
    const counts = JLPT_LEVELS.map((level) => kanjiOfLevel(JLPT, level).length);
    expect(counts).toEqual([79, 166, 367, 367, 1232]);
    const all = JLPT_LEVELS.flatMap((level) => kanjiOfLevel(JLPT, level));
    expect(new Set(all).size).toBe(2211);
  });

  it("are read as the pages read, first rows and last", () => {
    expect(kanjiOfLevel(JLPT, "N5").slice(0, 3)).toEqual(["日", "一", "国"]);
    expect(kanjiOfLevel(JLPT, "N3").slice(0, 2)).toEqual(["政", "議"]);
    expect(kanjiOfLevel(JLPT, "N2").slice(0, 2)).toEqual(["党", "協"]);
    expect(levelOf(JLPT, "日")).toBe("N5");
    expect(levelOf(JLPT, "鬱")).toBeNull();
  });

  it("are all in the table, so a level never names a kanji with no row", () => {
    const inTable = new Set(kanji.map((one) => one.kanji));
    for (const level of JLPT_LEVELS)
      for (const one of kanjiOfLevel(JLPT, level)) expect(inTable.has(one), one).toBe(true);
  });
});

describe("the table", () => {
  it("has every kanji with a school grade, and every row what a row promises", () => {
    expect(kanji).toHaveLength(2999);
    for (const one of kanji) {
      expect(gradeOf(GRADES, one.kanji), one.kanji).toBe(one.grade);
      expect(levelOf(JLPT, one.kanji), one.kanji).toBe(one.level);
      expect(one.strokes, one.kanji).toBeGreaterThan(0);
    }
    // Only the rarer name kanji may have nothing to say: KANJIDIC2 gives some of grades 9 and 10 no meaning, and a few variants of grade 10 no reading.
    expect(kanji.filter((one) => one.grade <= 8 && one.meanings.length === 0)).toEqual([]);
    expect(kanji.filter((one) => one.grade <= 9 && one.on.length + one.kun.length === 0)).toEqual([]);
  });

  it("reads a few rows as KANJIDIC2 has them", () => {
    expect(row("日")).toMatchObject({ strokes: 4, grade: 1, level: "N5", frequency: 1 });
    expect(row("日")?.on).toContain("ニチ");
    expect(row("日")?.meanings).toContain("day");
    expect(row("日")?.meaningsFr).toContain("jour");
    expect(row("山")?.kun).toContain("やま");
    expect(row("鬱")).toMatchObject({ strokes: 29, grade: 8, level: null });
  });

  it("can be searched by what a kanji is, reads or means", () => {
    expect(searchKanji(kanji, "mountain")[0]?.kanji).toBe("山");
    expect(searchKanji(kanji, "やま").map((one) => one.kanji)).toContain("山");
    expect(searchKanji(kanji, "ニチ").map((one) => one.kanji)).toContain("日");
    expect(searchKanji(kanji, "montagne").map((one) => one.kanji)).toContain("山");
    expect(searchKanji(kanji, "日")[0]?.kanji).toBe("日");
    expect(searchKanji(kanji, "  ")).toEqual([]);
  });

  it("finds the kanji in a piece of text, once each, and nothing else", () => {
    expect(kanjiIn("日本語を日本で、kana も")).toEqual(["日", "本", "語"]);
    expect(kanjiIn("人々")).toEqual(["人"]);
    expect(kanjiIn("かな only")).toEqual([]);
  });
});

describe("the pairs that look alike", () => {
  it("hold the classic pairs a stroke apart, at the score a reader is told about", () => {
    const has = (a: string, b: string) => lookAlikes(LOOK_ALIKE, a, { max: 99 }).some((one) => one.kanji === b);
    for (const [a, b] of [
      ["土", "士"],
      ["未", "末"],
      ["料", "科"],
      ["田", "由"],
      ["入", "八"],
      ["人", "入"],
      ["大", "犬"],
      ["日", "目"],
      ["白", "百"],
      ["矢", "失"],
      ["牛", "午"],
      ["暑", "署"],
      ["輸", "輪"],
    ] as const) {
      expect(has(a, b), `${a} ${b}`).toBe(true);
      expect(has(b, a), `${b} ${a}`).toBe(true);
    }
  });

  it("reach the closer calls when asked for less", () => {
    expect(lookAlikes(LOOK_ALIKE, "千", { atLeast: 60, max: 99 }).map((one) => one.kanji)).toContain("干");
    expect(lookAlikes(LOOK_ALIKE, "千", { max: 99 }).map((one) => one.kanji)).not.toContain("干");
  });

  it("put the closest first, keep to the limit, and give each score", () => {
    const found = lookAlikes(LOOK_ALIKE, "土");
    expect(found.length).toBeLessThanOrEqual(6);
    for (let at = 1; at < found.length; at += 1)
      expect((found[at - 1]?.score ?? 0) >= (found[at]?.score ?? 0)).toBe(true);
    expect(found.find((one) => one.kanji === "士")).toMatchObject({ score: 100, strokes: 100, parts: 67 });
    expect(lookAlikes(LOOK_ALIKE, "土", { max: 1 })).toHaveLength(1);
    expect(lookAlikes(LOOK_ALIKE, "A")).toEqual([]);
  });

  it("name only kanji in the table, each pair once and in order", () => {
    const inTable = new Set(kanji.map((one) => one.kanji));
    const pairs = LOOK_ALIKE.pairs.map(([pair]) => pair);
    expect(new Set(pairs).size).toBe(pairs.length);
    for (const pair of pairs) {
      const [first, second] = [...pair] as [string, string];
      expect(first < second, pair).toBe(true);
      expect(inTable.has(first) && inTable.has(second), pair).toBe(true);
    }
  });
});
