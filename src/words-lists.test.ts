import { describe, expect, it } from "vitest";
import { COMMON_WORDS } from "./data/words/common.data.ts";
import {
  hasMarks,
  loadCommonWords,
  loadWords,
  meaningFrom,
  onlyWords,
  readCommonWords,
  SAFE_MARKS,
  type Word,
  withoutMarks,
  withoutWords,
  wordsOf,
} from "./words.ts";

const word = (written: string, reading: string, senses: Word["senses"], forms: string[] = [written]): Word => ({
  written,
  reading,
  forms,
  meaning: meaningFrom(senses),
  senses,
  kinds: "",
  common: false,
  rank: 100_000,
  priority: [],
});
const plain = { marks: [], glosses: ["paper"] };
const rude = { marks: ["vulg", "col"], glosses: ["rude"] };
const old = { marks: ["arch"], glosses: ["old"] };

describe("every sense carries the marks JMdict gives it", () => {
  it("in either mode: 外人 has a sensitive sense with its mark, and the plain ones none", async () => {
    const unfiltered = await loadWords("がいじん", { mode: "unfiltered" });
    const senses = wordsOf(unfiltered, "がいじん")[0]?.senses ?? [];
    expect(senses.some((one) => one.marks.includes("sens") && one.glosses.join().includes("Westerner"))).toBe(true);
    expect(senses.some((one) => !one.marks.includes("sens") && one.glosses.includes("outsider"))).toBe(true);
    const safe = await loadWords("がいじん");
    for (const word of wordsOf(safe, "がいじん"))
      for (const sense of word.senses) expect(sense.marks).not.toContain("sens");
  });

  it("keep usage, field and dialect: 犬 is a dog, and a sense of something may be a field's or a dialect's", async () => {
    const words = await loadWords(["いぬ", "おおきに"], { mode: "unfiltered" });
    expect(wordsOf(words, "いぬ")[0]?.senses.length).toBeGreaterThanOrEqual(2);
    const marks = [...wordsOf(words, "おおきに"), ...wordsOf(words, "いぬ")].flatMap((one) =>
      one.senses.flatMap((sense) => sense.marks),
    );
    expect(marks).toEqual(expect.arrayContaining(["ksb"]));
  });

  it("make the meaning from the senses a word has, the same in either mode when nothing was left out", async () => {
    const [safe, unfiltered] = await Promise.all([loadWords("かみ"), loadWords("かみ", { mode: "unfiltered" })]);
    expect(wordsOf(unfiltered, "かみ").slice(0, 3)).toEqual(wordsOf(safe, "かみ").slice(0, 3));
    expect(wordsOf(safe, "かみ")[0]).toMatchObject({ meaning: "paper", senses: [{ marks: [], glosses: ["paper"] }] });
  });
});

describe("the safe marks", () => {
  it("are the four JMdict marks that safe mode leaves out, for a consumer to pass to a tool", () => {
    expect(SAFE_MARKS).toEqual(["vulg", "X", "sens", "derog"]);
  });

  it("applied to unfiltered words leave the senses safe mode leaves: the same meanings as safe mode gives", async () => {
    const texts = ["がいじん", "ピザ", "ハーモニカ", "いぬ"];
    const [safe, unfiltered] = await Promise.all([loadWords(texts), loadWords(texts, { mode: "unfiltered" })]);
    for (const text of texts) {
      const done = withoutMarks(wordsOf(unfiltered, text), SAFE_MARKS).map((one) => one.meaning);
      const given = wordsOf(safe, text).map((one) => one.meaning);
      // Safe mode also leaves out the forms and readings only a marked sense applies to, which the tool does not: it is the same senses.
      expect(done, text).toEqual(given);
    }
  });
});

describe("the block and allow lists", () => {
  it("are applied only when given, by written form or reading, in either kana", async () => {
    const plainLoad = await loadWords("かみ");
    const blocked = await loadWords("かみ", { block: ["神", "カミ"] });
    expect(wordsOf(plainLoad, "かみ").length).toBeGreaterThan(5);
    expect(wordsOf(blocked, "かみ")).toEqual([]);
    const some = await loadWords("かみ", { block: ["神"] });
    expect(
      wordsOf(some, "かみ")
        .map((one) => one.written)
        .slice(0, 3),
    ).toEqual(["紙", "髪", "加味"]);
  });

  it("let only the words named through: the allow list", async () => {
    const words = await loadWords(["かみ", "いぬ"], { allow: ["紙", "髪", "犬"] });
    expect(wordsOf(words, "かみ").map((one) => one.written)).toEqual(["紙", "髪"]);
    expect(wordsOf(words, "いぬ").map((one) => one.written)).toEqual(["犬"]);
    expect((await loadWords("かみ", { allow: [] })).entries.size).toBe(1);
    expect(wordsOf(await loadWords("かみ", { allow: [] }), "かみ")).toEqual([]);
  });

  it("are laid over unfiltered words as over safe ones, and over the common table, and never fetch more", async () => {
    const words = await loadWords("ほもびでお", { mode: "unfiltered", block: ["ホモビ"] });
    expect(wordsOf(words, "ほもびでお")[0]?.reading).toBe("ホモビデオ");
    const none = await loadWords("ほもびでお", { mode: "unfiltered", block: ["ほもびでお"] });
    expect(wordsOf(none, "ほもびでお")).toEqual([]);
    const common = await loadCommonWords({ block: ["紙"] });
    expect(wordsOf(common, "紙")).toEqual([]);
    expect(wordsOf(readCommonWords(COMMON_WORDS, { allow: ["神"] }), "かみ").map((one) => one.written)).toEqual(["神"]);
  });

  it("are carried by what is added to words, unless the new call says otherwise", async () => {
    const first = await loadWords("かみ", { block: ["神"] });
    const second = await loadWords("いぬ", { previous: first });
    expect(second.block).toEqual(["神"]);
    expect(wordsOf(second, "かみ").some((one) => one.written === "神")).toBe(false);
  });
});

describe("the tools for what a lookup returned", () => {
  const words = [
    word("紙", "かみ", [plain]),
    word("神", "かみ", [rude, old]),
    word("髪", "かみ", [{ marks: ["col"], glosses: ["hair"] }]),
  ];

  it("say whether a word has any of some marks", () => {
    expect(hasMarks(words[1] as Word, ["vulg"])).toBe(true);
    expect(hasMarks(words[1] as Word, ["food", "sl"])).toBe(false);
    expect(hasMarks(words[0] as Word, ["vulg", "col"])).toBe(false);
    expect(hasMarks(words[2] as Word, ["col"])).toBe(true);
  });

  it("leave out the senses with some marks, and the words left with none, and make the meaning again", () => {
    const left = withoutMarks(words, ["vulg"]);
    expect(left.map((one) => [one.written, one.meaning])).toEqual([
      ["紙", "paper"],
      ["神", "old"],
      ["髪", "hair"],
    ]);
    expect(withoutMarks(words, ["vulg", "arch"]).map((one) => one.written)).toEqual(["紙", "髪"]);
    expect(withoutMarks(words, [])).toEqual(words);
    expect(words[1]?.senses).toHaveLength(2);
  });

  it("leave out the words on a list, by reading or form, and keep only the words on one", () => {
    expect(withoutWords(words, ["神"]).map((one) => one.written)).toEqual(["紙", "髪"]);
    expect(withoutWords(words, ["かみ"])).toEqual([]);
    expect(withoutWords(words, ["カミ"])).toEqual([]);
    expect(withoutWords(words, [])).toEqual(words);
    expect(onlyWords(words, ["髪"]).map((one) => one.written)).toEqual(["髪"]);
    expect(onlyWords(words, [])).toEqual([]);
  });

  it("apply nothing on their own: a lookup is the same whether they are imported or not", async () => {
    expect(wordsOf(await loadWords("かみ"), "かみ").length).toBeGreaterThan(5);
  });
});

describe("the meaning of some senses", () => {
  it("is up to two senses of up to three glosses, cut at a whole gloss inside sixty characters, the first always whole", () => {
    const sense = (...glosses: string[]) => ({ marks: [], glosses });
    expect(meaningFrom([sense("paper")])).toBe("paper");
    expect(meaningFrom([sense("a", "b", "c", "d"), sense("e"), sense("f")])).toBe("a, b, c; e");
    const long = "x".repeat(70);
    expect(meaningFrom([sense(long, "short")])).toBe(long);
    expect(meaningFrom([sense("one", "two"), sense("y".repeat(58))])).toBe("one, two");
    expect(meaningFrom([])).toBe("");
  });
});
