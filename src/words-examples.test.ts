import { describe, expect, it } from "vitest";

import { EXTRA_EXAMPLE_MANIFEST } from "./data/examples/example-extra-manifest.data.ts";
import { exampleCredit, furiganaOfExample, loadExamples, readExamples } from "./examples.ts";
import { loadWords, wordsOf } from "./words.ts";
import { entryKey } from "./words-pieces.ts";

const idOf = async (text: string, mode: "safe" | "unfiltered" = "safe") => {
  const word = wordsOf(await loadWords(text, { mode }), text)[0];
  if (word?.id === undefined) throw new Error(`no word for ${text}`);
  return word;
};

describe("the examples of a word", () => {
  it("are sentences with their furigana, English, level, sense and credit", async () => {
    const word = await idOf("犬");
    const examples = await loadExamples(word);
    expect(examples.length).toBeGreaterThan(0);
    const [one] = examples;
    expect(one?.sense).toBeGreaterThanOrEqual(1);
    expect(one?.english.length).toBeGreaterThan(5);
    expect(one?.furigana.map((part) => part.text).join("")).toBe(one?.japanese);
    expect(one?.furigana.some((part) => part.reading !== undefined)).toBe(true);
    expect(one?.japanese).toContain("犬");
    expect(one?.credit.id).toBeGreaterThan(0);
    expect(Object.isFrozen(one)).toBe(true);
  });

  it("are given by the number of the entry as well, and by sense", async () => {
    const word = await idOf("猫");
    const all = await loadExamples(word.id as number);
    expect(all.length).toBeGreaterThan(0);
    const first = all[0]?.sense;
    const some = await loadExamples(word, { sense: first });
    expect(some.length).toBeGreaterThan(0);
    expect(some.every((one) => one.sense === first)).toBe(true);
    expect(await loadExamples(word, { sense: 99 })).toEqual([]);
  });

  it("are none for a word with none, and for a number that is not an entry", async () => {
    expect(await loadExamples(1)).toEqual([]);
    expect(await loadExamples(999_999_999_999)).toEqual([]);
  });

  it("refuse what is not a word or a mode", async () => {
    await expect(loadExamples({} as never)).rejects.toThrow(TypeError);
    await expect(loadExamples(-1)).rejects.toThrow(TypeError);
    await expect(loadExamples(1, { mode: "careful" as never })).rejects.toThrow(TypeError);
  });

  it("leave out in safe mode the ones that are not for it, and give them when asked for everything", async () => {
    const [first] = (await EXTRA_EXAMPLE_MANIFEST.entries.load[0]?.())?.rows ?? [];
    const id = Number.parseInt(first?.slice(0, first.indexOf("\t")) ?? "", 36);
    expect(entryKey(id)).toBe(first?.slice(0, first.indexOf("\t")));
    const safe = await loadExamples(id);
    const whole = await loadExamples(id, { mode: "unfiltered" });
    expect(whole.length).toBeGreaterThan(safe.length);
    const kept = new Set(safe.map((one) => one.credit.id));
    expect(whole.filter((one) => !kept.has(one.credit.id)).length).toBeGreaterThan(0);
  });
});

describe("an example read from its line", () => {
  const line = "0000z\t1¦｜私《わたし》は｜走《はし》る¦I run.¦5¦3fk¦alice¦bob¦走る\t2¦食べる¦Eat.¦¦1¦¦¦食べる";

  it("has every field, and the furigana put together are the sentence", () => {
    const { id, examples } = readExamples(line);
    expect(id).toBe(Number.parseInt("0000z", 36));
    expect(examples).toHaveLength(2);
    expect(examples[0]).toEqual({
      sense: 1,
      japanese: "私は走る",
      furigana: [{ text: "私", reading: "わたし" }, { text: "は" }, { text: "走", reading: "はし" }, { text: "る" }],
      english: "I run.",
      level: "N5",
      headword: "走る",
      credit: { id: 4448, japanese: "alice", english: "bob" },
    });
    expect(examples[1]?.level).toBeNull();
    expect(examples[1]?.credit).toEqual({ id: 1, japanese: null, english: null });
    expect(examples[1]?.furigana).toEqual([{ text: "食べる" }]);
  });

  it("is read as pieces by furiganaOfExample", () => {
    expect(furiganaOfExample("")).toEqual([{ text: "" }]);
    expect(furiganaOfExample("かな")).toEqual([{ text: "かな" }]);
    expect(furiganaOfExample("｜犬《いぬ》")).toEqual([{ text: "犬", reading: "いぬ" }]);
  });

  it("has a credit line that names the sentence and whoever is known", () => {
    expect(exampleCredit({ credit: { id: 4448, japanese: "alice", english: "bob" } })).toBe(
      "Tatoeba #4448, Japanese by alice, English by bob (CC BY 2.0 FR)",
    );
    expect(exampleCredit({ credit: { id: 7, japanese: null, english: "bob" } })).toBe(
      "Tatoeba #7, English by bob (CC BY 2.0 FR)",
    );
    expect(exampleCredit({ credit: { id: 7, japanese: null, english: null } })).toBe("Tatoeba #7 (CC BY 2.0 FR)");
  });
});
