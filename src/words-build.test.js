// The word tables are made by scripts/words-parse.mjs and scripts/build-words.mjs. These hold the rules to small entries written
// in JMdict's own shape, so they run with no dictionary here: the real one is held by words.test.ts, over the tables it made.
import { describe, expect, it } from "vitest";

import { cut } from "../scripts/build-words.mjs";
import {
  foldKana,
  glossesOf,
  kindLetters,
  meaningOf,
  packRow,
  rankOf,
  releaseOf,
  rowsOfDictionary,
  rowsOfEntry,
} from "../scripts/words-parse.mjs";

const entry = (body) => `\n<ent_seq>1</ent_seq>\n${body}\n`;
const sense = (pos, misc, glosses) =>
  `<sense>${pos.map((one) => `<pos>&${one};</pos>`).join("")}${misc.map((one) => `<misc>&${one};</misc>`).join("")}${glosses
    .map((one) => (typeof one === "string" ? `<gloss>${one}</gloss>` : `<gloss g_type="${one[0]}">${one[1]}</gloss>`))
    .join("")}</sense>`;

describe("an entry becomes a row for each reading", () => {
  it("keeps the written forms JMdict tags first, and the reading beside them", () => {
    const rows = rowsOfEntry(
      entry(
        `<k_ele><keb>煙草</keb></k_ele><k_ele><keb>莨</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>たばこ</reb></r_ele>${sense(["n"], ["uk"], ["tobacco"])}`,
      ),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      reading: "たばこ",
      forms: ["莨", "煙草"],
      meaning: "tobacco",
      common: true,
      usuallyKana: true,
    });
  });

  it("gives each reading its own row, and a reading limited to some forms only those", () => {
    const rows = rowsOfEntry(
      entry(
        `<k_ele><keb>大人</keb></k_ele><k_ele><keb>成人</keb></k_ele><r_ele><reb>おとな</reb><re_restr>大人</re_restr></r_ele><r_ele><reb>せいじん</reb><re_restr>成人</re_restr></r_ele><r_ele><reb>オトナ</reb><re_nokanji/></r_ele>${sense(["n"], [], ["adult"])}`,
      ),
    );
    expect(rows.map((one) => [one.reading, one.forms])).toEqual([
      ["おとな", ["大人"]],
      ["せいじん", ["成人"]],
      ["オトナ", []],
    ]);
  });

  it("leaves out a form that is search-only or irregular, and an entry with nothing to read or to say", () => {
    const rows = rowsOfEntry(
      entry(
        `<k_ele><keb>良い</keb></k_ele><k_ele><keb>好い</keb><ke_inf>&sK;</ke_inf></k_ele><r_ele><reb>いい</reb></r_ele>${sense(["adj-ix"], [], ["good"])}`,
      ),
    );
    expect(rows[0]?.forms).toEqual(["良い"]);
    expect(rowsOfEntry(entry(`<k_ele><keb>x</keb></k_ele>${sense(["n"], [], ["no reading"])}`))).toEqual([]);
    expect(rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele>${sense(["n"], [], [])}`))).toEqual([]);
  });

  it("keeps a reading JMdict calls irregular, but behind the regular ones and never as a common reading", () => {
    const rows = rowsOfDictionary(
      `<entry>${entry(
        `<k_ele><keb>港</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>みなと</reb><re_pri>ichi1</re_pri></r_ele><r_ele><reb>みなど</reb><re_inf>&ik;</re_inf></r_ele>${sense(["n"], [], ["harbour"])}`,
      )}`,
    );
    expect(rows.map((one) => [one.reading, one.common])).toEqual([
      ["みなと", true],
      ["みなど", false],
    ]);
  });

  it("reads the kinds of word a conjugation needs, from every sense", () => {
    expect(kindLetters(["v5r", "vt", "v1", "vs-i", "adj-ix", "vk", "n"])).toBe("agiks");
    expect(kindLetters(["n", "adv"])).toBe("");
  });

  it("is common when any form or reading carries one of the five marks, and ranks by the newspaper band first", () => {
    const common = (mark) =>
      rowsOfEntry(
        entry(
          `<k_ele><keb>字</keb><ke_pri>${mark}</ke_pri></k_ele><r_ele><reb>じ</reb></r_ele>${sense(["n"], [], ["letter"])}`,
        ),
      )[0];
    for (const mark of ["news1", "ichi1", "spec1", "spec2", "gai1"]) expect(common(mark)?.common, mark).toBe(true);
    for (const mark of ["news2", "ichi2", "gai2", "nf20"]) expect(common(mark)?.common, mark).toBe(false);
    expect(rankOf(["ichi1", "nf01"])).toBeLessThan(rankOf(["ichi1"]));
    expect(rankOf(["ichi1"])).toBeLessThan(rankOf(["news2"]));
    expect(rankOf(["news2"])).toBeLessThan(rankOf([]));
  });

  it("orders the dictionary commonest first, and keeps its own order among equals", () => {
    const xml = [
      entry(`<r_ele><reb>b</reb></r_ele>${sense(["n"], [], ["rare"])}`),
      entry(`<r_ele><reb>c</reb><re_pri>nf01</re_pri></r_ele>${sense(["n"], [], ["common"])}`),
      entry(`<r_ele><reb>a</reb></r_ele>${sense(["n"], [], ["rare too"])}`),
    ].join("<entry>");
    expect(rowsOfDictionary(`<entry>${xml}`).map((one) => one.reading)).toEqual(["c", "b", "a"]);
  });
});

describe("the English", () => {
  it("shows the plain glosses first, and the one that opens with a note behind one that does not", () => {
    expect(glossesOf(sense([], [], [["lit", "literally"], "(of a person) tall", "tall"]))).toEqual([
      "tall",
      "(of a person) tall",
    ]);
    expect(glossesOf(sense([], [], [["expl", "an explanation"]]))).toEqual(["an explanation"]);
  });

  it("stops at a whole gloss inside sixty characters, two senses at most, the first gloss always whole", () => {
    expect(meaningOf([["paper"]])).toBe("paper");
    expect(meaningOf([["a", "b", "c", "d"], ["e"], ["f"]])).toBe("a, b, c; e");
    const long = "x".repeat(70);
    expect(meaningOf([[long, "short"]])).toBe(long);
    expect(meaningOf([["one", "two"], [`${"y".repeat(58)}`]])).toBe("one, two");
    expect(meaningOf([])).toBe("");
  });

  it("reads the five XML entities JMdict uses", () => {
    expect(
      rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele>${sense(["n"], [], ["R&amp;D &lt;lab&gt;"])}`))[0]?.meaning,
    ).toBe("R&D <lab>");
  });
});

describe("what is not for children", () => {
  const rows = (misc) =>
    rowsOfEntry(
      entry(
        `<r_ele><reb>ほも</reb></r_ele>${sense(["n"], [], ["polite word"])}${sense(["n"], misc, ["rude word"])}${sense(["n"], [], ["another"])}`,
      ),
    );

  for (const mark of ["vulg", "X", "sens", "derog"]) {
    it(`leaves out a sense marked ${mark}, and keeps the meaning for adults whole`, () => {
      const [row] = rows([mark]);
      expect(row?.meaning).toBe("polite word; rude word");
      expect(row?.kids).toBe("polite word; another");
    });
  }

  it("keeps a sense with any other mark", () => {
    expect(rows(["col"])[0]?.kids).toBeUndefined();
  });

  it("leaves nothing when every sense is marked, and says so with an empty text and not with a missing one", () => {
    const [row] = rowsOfEntry(
      entry(`<r_ele><reb>ホモビデオ</reb></r_ele>${sense(["n"], ["sens"], ["gay porn video"])}`),
    );
    expect(row?.kids).toBe("");
    expect(packRow(row ?? {})).toBe("ホモビデオ\t\tgay porn video\t\t");
  });

  it("is the same text where the sense left out was past the ones the meaning shows", () => {
    const [row] = rowsOfEntry(
      entry(
        `<r_ele><reb>い</reb></r_ele>${sense(["n"], [], ["a"])}${sense(["n"], [], ["b"])}${sense(["n"], ["derog"], ["c"])}`,
      ),
    );
    expect(row?.meaning).toBe("a; b");
    expect(row?.kids).toBeUndefined();
  });
});

describe("the stored row", () => {
  it("is tab-apart fields: reading, forms, meaning, flags, and the meaning for children only where it differs", () => {
    const [row] = rowsOfEntry(
      entry(
        `<k_ele><keb>紙</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>かみ</reb></r_ele>${sense(["n"], [], ["paper"])}`,
      ),
    );
    expect(packRow(row ?? {})).toBe("かみ\t紙\tpaper\tC");
  });

  it("refuses a field with a tab or a line break in it, which would be two fields", () => {
    expect(() =>
      packRow({ reading: "a", forms: [], meaning: "x\ty", kinds: "", common: false, usuallyKana: false }),
    ).toThrow(/separator/);
    expect(() =>
      packRow({ reading: "a", forms: ["b|c"], meaning: "x", kinds: "", common: false, usuallyKana: false }),
    ).toThrow(/separator/);
  });

  it("folds katakana to hiragana and leaves ー and the rest", () => {
    expect(foldKana("カミ")).toBe("かみ");
    expect(foldKana("ヴァイオリン")).toBe("ゔぁいおりん");
    expect(foldKana("コーヒー・紙")).toBe("こーひー・紙");
  });

  it("reads the release from the file's first comment", () => {
    expect(releaseOf("<!-- JMdict created: 2026-11-02 -->")).toBe("2026-11-02");
    expect(releaseOf("<JMdict>")).toBeNull();
  });
});

describe("cutting into pieces", () => {
  const sorted = ["a", "a", "b", "c", "c", "c", "d", "e"].map((key, at) => [key, `${key}${at}`]);

  it("never splits a key across two pieces, and starts the first piece at nothing", () => {
    const pieces = cut(sorted, 5);
    expect(pieces.map((piece) => piece.lines)).toEqual([
      ["a0", "a1"],
      ["b2", "c3", "c4", "c5"],
      ["d6", "e7"],
    ]);
    expect(pieces[0]?.start).toBe("");
  });

  it("starts each later piece at the shortest text after the last key before it, that is not after its own first", () => {
    const keys = ["かみ", "かみさま", "かみそり", "かもめ"];
    const pieces = cut(
      keys.map((key) => [key, key]),
      1,
    );
    expect(pieces.map((piece) => piece.start)).toEqual(["", "かみさ", "かみそ", "かも"]);
    for (const [at, piece] of pieces.entries()) {
      if (at === 0) continue;
      expect(piece.start > (keys[at - 1] ?? ""), String(at)).toBe(true);
      expect(piece.start <= (keys[at] ?? ""), String(at)).toBe(true);
    }
  });
});
