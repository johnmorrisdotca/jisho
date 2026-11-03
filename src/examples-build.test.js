// The example sentences are made by scripts/examples-parse.mjs and scripts/build-examples.mjs. These hold the rules to small inputs.
import { describe, expect, it } from "vitest";

import {
  examplesOfEntry,
  levelOfText,
  packExample,
  packExamples,
  RUBY_CLOSE,
  RUBY_OPEN,
  rubyText,
} from "../scripts/examples-parse.mjs";
import { readExamples } from "./words-examples.ts";

const entry = `<ent_seq>1234</ent_seq><sense><gloss>a</gloss></sense><sense><gloss>b</gloss>
<example><ex_srce exsrc_type="tat">77</ex_srce><ex_text>走る</ex_text><ex_sent xml:lang="jpn">私は走る &amp; 歩く。</ex_sent><ex_sent xml:lang="eng">I run &amp; walk.</ex_sent></example>
<example><ex_srce exsrc_type="tat">78</ex_srce><ex_text>走る</ex_text><ex_sent xml:lang="jpn">走れ。</ex_sent></example>
<example><ex_text>走る</ex_text><ex_sent xml:lang="jpn">走る。</ex_sent><ex_sent xml:lang="eng">Run.</ex_sent></example></sense>`;

describe("the examples of an entry", () => {
  it("are found with the sense they show, counting every sense", () => {
    expect(examplesOfEntry(entry)).toEqual([
      { id: 1234, sense: 2, source: 77, headword: "走る", japanese: "私は走る & 歩く。", english: "I run & walk." },
    ]);
    expect(examplesOfEntry("<sense></sense>")).toEqual([]);
  });
});

describe("a sentence's level", () => {
  const levels = { 私: "N5", 走: "N4", 憂: "N1" };
  const level = (kanji) => levels[kanji] ?? null;

  it("is the hardest of its kanji, N5 with none, and nothing when a kanji is on no list", () => {
    expect(levelOfText("私は走る", level)).toBe(4);
    expect(levelOfText("私は憂う", level)).toBe(1);
    expect(levelOfText("わたしは", level)).toBe(5);
    expect(levelOfText("私は噂", level)).toBeNull();
  });
});

describe("an example is packed and read back", () => {
  const parts = [{ text: "私", reading: "わたし" }, { text: "は" }, { text: "走", reading: "はし" }, { text: "る" }];
  const example = {
    sense: 2,
    ruby: rubyText(parts),
    english: "I run.",
    level: 4,
    source: 77,
    japaneseAuthor: "alice",
    englishAuthor: undefined,
    headword: "走る",
  };

  it("round-trips through the line the data files hold", () => {
    expect(example.ruby).toBe("｜私《わたし》は｜走《はし》る");
    const line = packExamples(1234, [example]);
    expect(line.startsWith("0000z")).toBe(false);
    const { id, examples } = readExamples(line);
    expect(id).toBe(1234);
    expect(examples[0]).toMatchObject({
      sense: 2,
      japanese: "私は走る",
      english: "I run.",
      level: "N4",
      headword: "走る",
    });
    expect(examples[0]?.credit).toEqual({ id: 77, japanese: "alice", english: null });
  });

  it("refuses text that would end a field early", () => {
    expect(() => packExample({ ...example, english: "a¦b" })).toThrow(/separator in a translation/);
    expect(() => packExample({ ...example, japaneseAuthor: "a\tb" })).toThrow(/separator in an author/);
    expect([RUBY_OPEN, RUBY_CLOSE]).toEqual(["《", "》"]);
  });
});
