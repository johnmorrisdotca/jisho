// The word tables are made by scripts/words-parse.mjs and scripts/build-words.mjs. These hold the rules to small entries written
// in JMdict's own shape, so they run with no dictionary here: the real one is held by words.test.ts, over the tables it made.
import { describe, expect, it } from "vitest";

import { cut } from "../scripts/build-words.mjs";
import {
  foldKana,
  formKey,
  glossesOf,
  kindLetters,
  packClean,
  packRow,
  priorityOf,
  rankOf,
  readingKey,
  releaseOf,
  rowsOfDictionary,
  rowsOfEntry,
} from "../scripts/words-parse.mjs";
import {
  indexesOf,
  KANJI_CAP,
  MEANING_CAP,
  patched,
  STOP_WORDS,
  tablesOf,
  termsInOrder,
  termsOf,
} from "../scripts/words-tables.mjs";
import { priorityTags, rankOfTags, readRow } from "./words-rows.ts";
import {
  STOP_WORDS as TS_STOP_WORDS,
  formKey as tsFormKey,
  readingKey as tsReadingKey,
  termsInOrder as tsTermsInOrder,
  termsOf as tsTermsOf,
} from "./words-text.ts";

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
      senses: [{ marks: ["uk"], glosses: ["tobacco"] }],
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

describe("the senses", () => {
  it("show the plain glosses first, and the one that opens with a note behind one that does not", () => {
    expect(glossesOf(sense([], [], [["lit", "literally"], "(of a person) tall", "tall"]))).toEqual([
      "tall",
      "(of a person) tall",
    ]);
    expect(glossesOf(sense([], [], [["expl", "an explanation"]]))).toEqual(["an explanation"]);
  });

  it("keep four senses of three glosses, each with the marks JMdict gives it: usage, field and dialect", () => {
    const [row] = rowsOfEntry(
      entry(
        `<r_ele><reb>あ</reb></r_ele>` +
          `<sense><pos>&n;</pos><misc>&col;</misc><misc>&sl;</misc><gloss>a</gloss><gloss>b</gloss><gloss>c</gloss><gloss>d</gloss></sense>` +
          `<sense><field>&food;</field><dial>&ksb;</dial><gloss>e</gloss></sense>` +
          `${sense(["n"], [], ["f"])}${sense(["n"], [], ["g"])}${sense(["n"], [], ["h"])}`,
      ),
    );
    expect(row?.senses).toEqual([
      { marks: ["col", "sl"], glosses: ["a", "b", "c"] },
      { marks: ["food", "ksb"], glosses: ["e"] },
      { marks: [], glosses: ["f"] },
      { marks: [], glosses: ["g"] },
    ]);
  });

  it("have no sense with no gloss, and no row for a word that has none with one", () => {
    expect(rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele>${sense(["n"], [], [])}`))).toEqual([]);
    expect(
      rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele>${sense(["n"], [], [])}${sense(["n"], [], ["x"])}`))[0]?.senses,
    ).toHaveLength(1);
  });

  it("read the five XML entities JMdict uses", () => {
    expect(
      rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele>${sense(["n"], [], ["R&amp;D &lt;lab&gt;"])}`))[0]?.senses[0]
        ?.glosses,
    ).toEqual(["R&D <lab>"]);
  });
});

describe("what safe mode leaves out", () => {
  const rows = (misc) =>
    rowsOfEntry(
      entry(
        `<r_ele><reb>ほも</reb></r_ele>${sense(["n"], [], ["polite word"])}${sense(["n"], misc, ["rude word"])}${sense(["n"], [], ["another"])}`,
      ),
    );
  const glosses = (list) => list.map((one) => one.glosses[0]);

  for (const mark of ["vulg", "X", "sens", "derog"]) {
    it(`leaves out a sense marked ${mark} from the clean row, and keeps the whole row with its marks`, () => {
      const [row] = rows([mark]);
      expect(glosses(row?.senses ?? [])).toEqual(["polite word", "rude word", "another"]);
      expect(row?.senses[1]?.marks).toEqual([mark]);
      expect(glosses(row?.clean?.senses ?? [])).toEqual(["polite word", "another"]);
    });
  }

  it("keeps a sense with any other mark", () => {
    const [row] = rows(["col"]);
    expect(row?.clean?.senses).toEqual(row?.senses);
    expect(packClean(row ?? {})).toBe(packRow(row ?? {}));
  });

  it("has no clean row when every sense is marked", () => {
    const [row] = rowsOfEntry(
      entry(`<r_ele><reb>ホモビデオ</reb></r_ele>${sense(["n"], ["sens"], ["gay porn video"])}`),
    );
    expect(row?.clean).toBeNull();
    expect(packClean(row ?? {})).toBeNull();
    expect(packRow(row ?? {})).toBe("ホモビデオ\t\t\tsens¦gay porn video");
  });

  it("leaves out a written form that only a marked sense applies to, and a reading that only one does", () => {
    const [first, second] = rowsOfEntry(
      entry(
        `<k_ele><keb>抜かす</keb></k_ele><k_ele><keb>吐かす</keb></k_ele><r_ele><reb>ぬかす</reb></r_ele><r_ele><reb>ぬかせ</reb></r_ele>` +
          `<sense><pos>&v5s;</pos><stagk>抜かす</stagk><gloss>to omit</gloss></sense>` +
          `<sense><pos>&v5s;</pos><stagk>吐かす</stagk><stagr>ぬかせ</stagr><misc>&vulg;</misc><gloss>to speak</gloss></sense>`,
      ),
    );
    expect(first?.forms).toEqual(["抜かす", "吐かす"]);
    expect(first?.clean).toEqual({ forms: ["抜かす"], senses: [{ marks: [], glosses: ["to omit"] }] });
    expect(second?.clean?.forms).toEqual(["抜かす"]);
    const [a, b] = rowsOfEntry(
      entry(
        `<r_ele><reb>あ</reb></r_ele><r_ele><reb>い</reb></r_ele><sense><stagr>あ</stagr><gloss>plain</gloss></sense><sense><stagr>い</stagr><misc>&derog;</misc><gloss>rude</gloss></sense>`,
      ),
    );
    expect(glosses(a?.clean?.senses ?? [])).toEqual(["plain"]);
    expect(b?.clean).toBeNull();
  });
});

describe("the tables", () => {
  const dictionary = [
    entry(
      `<k_ele><keb>紙</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>かみ</reb></r_ele>${sense(["n"], [], ["paper"])}`,
    ),
    entry(
      `<r_ele><reb>ホモビデオ</reb></r_ele><r_ele><reb>ホモ・ビデオ</reb></r_ele>${sense(["n"], ["sens"], ["rude video"])}`,
    ),
    entry(
      `<k_ele><keb>外人</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>がいじん</reb></r_ele>${sense(["n"], ["sens"], ["foreigner"])}${sense(["n"], [], ["outsider"])}`,
    ),
  ]
    .map((one) => `<entry>${one}`)
    .join("");
  const rows = rowsOfDictionary(dictionary);
  const tables = tablesOf(rows);

  it("hold nothing in the default tables that is not for children: the word, its readings, its forms and its sense", () => {
    const text = JSON.stringify([tables.common, tables.readings, tables.forms]);
    for (const left of ["ホモビデオ", "ほもびでお", "ホモ・ビデオ", "rude video", "foreigner"])
      expect(text, left).not.toContain(left);
    for (const kept of ["かみ", "paper", "outsider", "外人"]) expect(text, kept).toContain(kept);
    expect(tables.counts).toMatchObject({ rows: 4, cleanRows: 2 });
  });

  it("hold what was left out whole in the extra ones, for the keys whose answer is not the same", () => {
    expect(tables.extraReadings.map(([key]) => key)).toEqual(["がいじん", "ほもびでお", "ほも・びでお"]);
    expect(tables.extraReadings.map(([, line]) => line).join("\n")).toMatch(/sens¦foreigner\t¦outsider/);
    expect(tables.extraForms).toEqual([]);
    expect(tables.extraReadings.some(([key]) => key === "かみ")).toBe(false);
  });

  it("have a patch that turns the common words for children back into every common word", () => {
    expect(tables.common).toHaveLength(2);
    expect(tables.commonPatch).toHaveLength(1);
    const every = rows.filter((row) => row.common).map((row) => packRow(row));
    expect(patched(tables.common, tables.commonPatch)).toEqual(every);
    expect(every).toHaveLength(2);
  });

  it("are the same in every order of the dictionary: a patch inserts and replaces at the right places", () => {
    const lines = ["a", "b", "c", "d"];
    const patch = ["0\ti\tx", "2\tr\tB", "4\ti\ty"];
    expect(patched(lines, patch)).toEqual(["x", "a", "B", "c", "y", "d"]);
    expect(patched(lines, [])).toEqual(lines);
  });
});

describe("the stored row", () => {
  it("is tab-apart fields: reading, forms, flags, then a field for each sense, its marks and then its glosses apart by ¦", () => {
    const [row] = rowsOfEntry(
      entry(
        `<k_ele><keb>紙</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>かみ</reb></r_ele>${sense(["n"], ["col"], ["paper", "sheet"])}${sense(["n"], [], ["one"])}`,
      ),
    );
    expect(packRow(row ?? {})).toBe("かみ\t紙\tC~i\tcol¦paper¦sheet\t¦one");
  });

  it("refuses a field with a tab, a line break or the sense break in it, which would be two fields", () => {
    const row = (gloss, form = "b") => ({
      reading: "a",
      forms: [form],
      senses: [{ marks: [], glosses: [gloss] }],
      kinds: "",
      common: false,
      usuallyKana: false,
    });
    expect(() => packRow(row("x\ty"))).toThrow(/separator/);
    expect(() => packRow(row("x¦y"))).toThrow(/separator/);
    expect(() => packRow(row("x", "b|c"))).toThrow(/separator/);
    expect(() => packRow({ ...row("x"), senses: [{ marks: ["a,b"], glosses: ["x"] }] })).toThrow(/separator/);
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

describe("the priority a row keeps", () => {
  const priorities = (...tags) =>
    rowsOfEntry(
      entry(
        `<k_ele><keb>紙</keb>${tags.map((one) => `<ke_pri>${one}</ke_pri>`).join("")}</k_ele><r_ele><reb>かみ</reb></r_ele>${sense(["n"], [], ["paper"])}`,
      ),
    )[0];

  it("is the tags of the entry as letters in one order, then the newspaper band's two digits", () => {
    expect(priorityOf(["ichi1", "news1", "nf03"])).toBe("ni03");
    expect(priorityOf(["gai2", "spec1", "ichi2"])).toBe("jsh");
    expect(priorityOf(["nf12", "nf04"])).toBe("04");
    expect(priorityOf([])).toBe("");
    expect(packRow(priorities("ichi1", "news1", "nf03") ?? {})).toBe("かみ\t紙\tC~ni03\t¦paper");
    expect(packRow(priorities() ?? {})).toBe("かみ\t紙\t\t¦paper");
  });

  it("is read back as the tags, and makes the rank the build makes", () => {
    for (const tags of [["ichi1", "news1", "nf03"], ["spec2"], ["gai2", "ichi2"], ["nf48"], ["news2", "gai1"], []]) {
      const row = priorities(...tags);
      expect(rankOfTags(priorityTags(row?.priority ?? "")), tags.join()).toBe(rankOf(tags));
      expect(readRow(packRow(row ?? {})).priority).toBe(row?.priority);
    }
    expect(priorityTags("ni03")).toEqual(["news1", "ichi1", "nf03"]);
  });

  it("is none for a reading JMdict calls irregular", () => {
    const [regular, irregular] = rowsOfEntry(
      entry(
        `<k_ele><keb>紙</keb><ke_pri>ichi1</ke_pri></k_ele><r_ele><reb>かみ</reb></r_ele><r_ele><reb>かみい</reb><re_inf>&ik;</re_inf></r_ele>${sense(["n"], [], ["paper"])}`,
      ),
    );
    expect(regular?.priority).toBe("i");
    expect(irregular?.priority).toBe("");
  });
});

describe("the keys of the tables", () => {
  it("are made as the lookup makes them: the same NFKC for a form, folded to hiragana for a reading", () => {
    for (const text of ["１人", "ＣＤ", "ﾀﾋ", "カミ", "紙", "Ｔシャツ", "e\u0301", "コーヒー"]) {
      expect(formKey(text), text).toBe(tsFormKey(text));
      expect(readingKey(text), text).toBe(tsReadingKey(text));
    }
  });

  it("find a form written in full-width characters by its half-width spelling", () => {
    const rows = rowsOfDictionary(
      `<entry>${entry(`<k_ele><keb>１人</keb></k_ele><r_ele><reb>ひとり</reb></r_ele>${sense(["n"], [], ["one person"])}`)}`,
    );
    expect(tablesOf(rows).forms.map(([key]) => key)).toEqual(["1人"]);
  });
});

describe("the indexes by meaning and by kanji", () => {
  const dictionary = rowsOfDictionary(
    [
      entry(
        `<k_ele><keb>水</keb><ke_pri>news1</ke_pri><ke_pri>nf02</ke_pri></k_ele><r_ele><reb>みず</reb></r_ele>${sense(["n"], [], ["water", "fluid"])}${sense(["n"], [], ["to go out of the way"])}`,
      ),
      entry(
        `<k_ele><keb>水泳</keb></k_ele><r_ele><reb>すいえい</reb></r_ele>${sense(["n"], [], ["swimming"])}${sense(["n"], [], ["water sport"])}`,
      ),
      entry(
        `<k_ele><keb>淫水</keb></k_ele><r_ele><reb>いんすい</reb></r_ele>${sense(["n"], ["vulg"], ["rude water"])}${sense(["n"], [], ["wet"])}`,
      ),
      entry(`<r_ele><reb>ホモビデオ</reb></r_ele>${sense(["n"], ["sens"], ["rude video"])}`),
    ]
      .map((one) => `<entry>${one}`)
      .join(""),
  );
  const index = indexesOf(dictionary);
  const lineOf = (pairs, key) => pairs.find(([one]) => one === key)?.[1];

  it("have a line for each term, with the readings of the words that have it, the commonest first", () => {
    expect(lineOf(index.meanings, "water")).toBe("water\tみず");
    expect(lineOf(index.meanings, "rude")).toBeUndefined();
    expect(lineOf(index.meanings, "fluid")).toBe("fluid\tみず");
    expect(index.meanings.map(([key]) => key)).toEqual([...index.meanings.map(([key]) => key)].sort());
  });

  it("find a ranked word by two terms that follow each other, and an unranked one by its first gloss alone", () => {
    expect(lineOf(index.meanings, "go out")).toBe("go out\tみず");
    expect(lineOf(index.meanings, "out way")).toBe("out way\tみず");
    expect(lineOf(index.meanings, "water sport")).toBeUndefined();
    expect(lineOf(index.meanings, "water fluid")).toBeUndefined();
    expect(lineOf(index.meanings, "swimming")).toBe("swimming\tすいえい");
    // 水泳 has no priority, so only its first gloss is found by: "sport" is in its second.
    expect(lineOf(index.meanings, "sport")).toBeUndefined();
  });

  it("have no stop word, and no key for a word with nothing left", () => {
    expect(lineOf(index.meanings, "the")).toBeUndefined();
    expect(lineOf(index.meanings, "to")).toBeUndefined();
    expect(lineOf(index.meanings, "video")).toBeUndefined();
  });

  it("keep what safe mode leaves out in the extra index alone, and there only where the list is not the same", () => {
    expect(index.meanings.map(([key]) => key)).not.toContain("rude");
    expect(lineOf(index.extraMeanings, "rude")).toBe("rude\tいんすい|ホモビデオ");
    expect(lineOf(index.extraMeanings, "water")).toBe("water\tみず|いんすい");
    expect(lineOf(index.extraMeanings, "fluid")).toBeUndefined();
    expect(lineOf(index.extraMeanings, "wet")).toBeUndefined();
  });

  it("find words by the kanji in their written forms", () => {
    expect(lineOf(index.kanji, "水")).toBe("水\tみず|すいえい|いんすい");
    expect(lineOf(index.kanji, "泳")).toBe("泳\tすいえい");
    expect(lineOf(index.kanji, "淫")).toBe("淫\tいんすい");
  });

  it("hold at most the cap for a term", () => {
    const many = rowsOfDictionary(
      Array.from(
        { length: MEANING_CAP + 5 },
        (_, at) =>
          `<entry>${entry(`<k_ele><keb>字${at}</keb></k_ele><r_ele><reb>じ${String.fromCharCode(0x3041 + at)}</reb></r_ele>${sense(["n"], [], ["thing"])}`)}`,
      ).join(""),
    );
    expect(lineOf(indexesOf(many).meanings, "thing")?.split("\t")[1]?.split("|")).toHaveLength(MEANING_CAP);
    expect(KANJI_CAP).toBeGreaterThan(MEANING_CAP);
  });

  it("make the terms the lookup makes, with the same words left out", () => {
    expect(STOP_WORDS).toEqual([...TS_STOP_WORDS]);
    for (const text of ["water (cold)", "to be at one's wit's end", "Ǆ", "ＷＡＴＥＲ", "x’s", "café", "☃", ""]) {
      expect(termsOf(text), text).toEqual(tsTermsOf(text));
      expect(termsInOrder(text), text).toEqual(tsTermsInOrder(text));
    }
  });
});
