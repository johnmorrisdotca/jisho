import { describe, expect, it } from "vitest";
import { readText } from "./reader.ts";
import { type StudyRow, studyList, studyListText } from "./study-list.ts";

describe("studyList", () => {
  it("lists each word once, in order, with how often it came and the form it first came in", async () => {
    const rows = studyList(await readText("私は食べなかった。私は食べた。"));
    expect(rows.map((row) => [row.written, row.count])).toEqual([
      ["私", 2],
      ["は", 2],
      ["食べる", 2],
    ]);
    expect(rows[2]).toMatchObject({ reading: "たべる", example: "食べなかった", level: "N5", grade: 2 });
  });

  it("leaves out the words with no kanji when asked, and the unknown and the not Japanese always", async () => {
    const result = await readText("私は水を飲む。ぬぬぬぬぬ 123");
    expect(studyList(result).map((row) => row.written)).toContain("は");
    const kanji = studyList(result, { kanjiOnly: true }).map((row) => row.written);
    expect(kanji).toEqual(["私", "水", "飲む"]);
    expect(studyList(await readText(""))).toEqual([]);
  });

  it("takes the highest grade among a word's kanji, and none for a word with no kanji", async () => {
    const rows = studyList(await readText("友達でひらがな"));
    expect(rows.find((row) => row.written === "友達")?.grade).toBe(4);
    expect(rows.find((row) => row.written === "で")?.grade).toBeNull();
  });
});

describe("studyListText", () => {
  const row = (over: Partial<StudyRow>): StudyRow => ({
    written: "水",
    reading: "みず",
    meaning: "water",
    level: "N5",
    grade: 1,
    count: 1,
    example: "水",
    ...over,
  });

  it("writes CSV with a header, and quotes what holds a comma, a quote or a line break", () => {
    const text = studyListText([row({ meaning: 'water, "H2O"\nliquid', level: null, grade: null })], "csv");
    expect(text).toBe('written,reading,meaning,level,grade,count,example\n水,みず,"water, ""H2O""\nliquid",,,1,水\n');
  });

  it("writes tab-separated lines with no header, for pasting", () => {
    expect(studyListText([row({ meaning: "a\tb" }), row({ written: "火" })], "tsv")).toBe(
      "水\tみず\ta b\tN5\t1\t1\t水\n火\tみず\twater\tN5\t1\t1\t水\n",
    );
  });

  it("is nothing for no rows", () => {
    expect(studyListText([], "csv")).toBe("");
    expect(studyListText([], "tsv")).toBe("");
  });
});
