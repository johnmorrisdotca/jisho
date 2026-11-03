// The whole entries are made by scripts/words-entries.mjs. These hold its rules to small entries written in JMdict's own shape.
import { describe, expect, it } from "vitest";

import { cleanEntry, entriesOfDictionary, entryKey, entryOf, idOf, packEntry } from "../scripts/words-entries.mjs";
import { rowsOfEntry } from "../scripts/words-parse.mjs";
import { readEntry } from "./words-entry.ts";

const entry = (body, id = 1_000_123) => `\n<ent_seq>${id}</ent_seq>\n${body}\n`;
const KAMI = `<k_ele><keb>紙</keb></k_ele><k_ele><keb>神</keb><ke_inf>&ateji;</ke_inf></k_ele><r_ele><reb>かみ</reb></r_ele>`;

describe("an entry is read whole", () => {
  it("has its number, forms, readings and every field of its senses", () => {
    const whole = entryOf(
      entry(`${KAMI}<r_ele><reb>がみ</reb><re_restr>神</re_restr><re_inf>&ok;</re_inf></r_ele>
<sense><pos>&n;</pos><pos>&adj-no;</pos><stagk>紙</stagk><xref>神・かみ・1</xref><ant>下</ant><field>&food;</field><misc>&uk;</misc><dial>&ksb;</dial>
<s_inf>usu. in the negative</s_inf><lsource xml:lang="por" ls_type="part" ls_wasei="y">pão</lsource><lsource/>
<gloss>paper</gloss><gloss g_type="lit">sheet &amp; leaf</gloss><gloss g_type="expl">an explanation</gloss><gloss g_type="fig">fig</gloss><gloss g_type="tm">brand</gloss><gloss></gloss></sense>`),
    );
    expect(whole.id).toBe(1_000_123);
    expect(whole.forms).toEqual([
      { text: "紙", info: [] },
      { text: "神", info: ["ateji"] },
    ]);
    expect(whole.readings[1]).toEqual({ text: "がみ", info: ["ok"], only: ["神"], noKanji: false });
    const [sense] = whole.senses;
    expect(sense.pos).toEqual(["n", "adj-no"]);
    expect(sense.marks).toEqual(["uk", "food", "ksb"]);
    expect(sense.onlyForms).toEqual(["紙"]);
    expect(sense.seeAlso).toEqual(["神・かみ・1"]);
    expect(sense.antonyms).toEqual(["下"]);
    expect(sense.notes).toEqual(["usu. in the negative"]);
    expect(sense.sources).toEqual([
      { lang: "por", part: true, wasei: true, text: "pão" },
      { lang: "eng", part: false, wasei: false, text: "" },
    ]);
    expect(sense.glosses.map((gloss) => [gloss.text, gloss.type])).toEqual([
      ["paper", ""],
      ["sheet & leaf", "l"],
      ["an explanation", "e"],
      ["fig", "f"],
      ["brand", "t"],
    ]);
  });

  it("is none for an entry with no reading, no sense with a gloss or no number", () => {
    expect(entryOf(entry(`<k_ele><keb>x</keb></k_ele><sense><gloss>a</gloss></sense>`))).toBeNull();
    expect(entryOf(entry(`<r_ele><reb>あ</reb></r_ele><sense><gloss></gloss></sense>`))).toBeNull();
    expect(entryOf(`<r_ele><reb>あ</reb></r_ele><sense><gloss>a</gloss></sense>`)).toBeNull();
    expect(idOf("<ent_seq>12</ent_seq>")).toBe(12);
  });

  it("is in the order of the numbers, whatever order the file has them", () => {
    const sense = "<sense><gloss>a</gloss></sense>";
    const list = entriesOfDictionary([
      entry(`<r_ele><reb>い</reb></r_ele>${sense}`, 20),
      entry(`<r_ele><reb>あ</reb></r_ele>${sense}`, 3),
      "nothing",
    ]);
    expect(list.map((one) => one.id)).toEqual([3, 20]);
    expect(entryKey(3)).toBe("00003");
    expect(entryKey(36 ** 4)).toBe("10000");
  });
});

describe("an entry is packed and read back", () => {
  it("round-trips through the line the data files hold", () => {
    const whole = entryOf(
      entry(
        `${KAMI}<sense><pos>&n;</pos><xref>神</xref><s_inf>one</s_inf><s_inf>two</s_inf><lsource xml:lang="ger">Papier</lsource><gloss g_type="fig">paper</gloss><gloss>sheet</gloss></sense><sense><gloss>leaf</gloss></sense>`,
      ),
    );
    const line = packEntry(whole);
    expect(line.startsWith(`${entryKey(whole.id)}\t`)).toBe(true);
    const read = readEntry(line);
    expect(read.id).toBe(whole.id);
    expect(read.forms.map((form) => form.text)).toEqual(["紙", "神"]);
    expect(read.senses[0].glosses).toEqual([
      { text: "paper", kind: "fig" },
      { text: "sheet", kind: null },
    ]);
    expect(read.senses[0].notes).toEqual(["one", "two"]);
    expect(read.senses[0].sources).toEqual([{ lang: "ger", text: "Papier", partial: false, wasei: false }]);
    expect(read.senses[1].glosses).toEqual([{ text: "leaf", kind: null }]);
  });

  it("refuses text that would end a field early, and a private-use character in a gloss", () => {
    const base = (gloss) => entry(`<r_ele><reb>あ</reb></r_ele><sense><gloss>${gloss}</gloss></sense>`);
    expect(() => packEntry(entryOf(base("a¦b")))).toThrow(/separator in a gloss/);
    expect(() => packEntry(entryOf(base("a\u{E001}b")))).toThrow(/private-use/);
    const form = entry(`<k_ele><keb>a|b</keb></k_ele><r_ele><reb>あ</reb></r_ele><sense><gloss>x</gloss></sense>`);
    expect(() => packEntry(entryOf(form))).toThrow(/separator in a form/);
  });
});

describe("safe mode's entry", () => {
  const sense = (misc, gloss, extra = "") => `<sense>${extra}<misc>&${misc};</misc><gloss>${gloss}</gloss></sense>`;
  const text = `<k_ele><keb>紙</keb></k_ele><k_ele><keb>髪</keb></k_ele><r_ele><reb>かみ</reb></r_ele><r_ele><reb>かめ</reb></r_ele>`;

  it("leaves out a marked sense, and the forms and readings only that sense applies to", () => {
    const whole = entryOf(
      entry(
        `${text}${sense("uk", "plain", "<stagk>紙</stagk><stagr>かみ</stagr>")}${sense("vulg", "rude", "<stagk>髪</stagk><stagr>かめ</stagr>")}`,
      ),
    );
    const clean = cleanEntry(whole);
    expect(clean.senses.map((one) => one.glosses[0].text)).toEqual(["plain"]);
    const second = cleanEntry(entryOf(entry(`${text}${sense("vulg", "rude")}${sense("uk", "plain")}`)));
    expect(readEntry(packEntry(second)).senses[0].number).toBe(2);
    expect(clean.forms.map((form) => form.text)).toEqual(["紙"]);
    expect(clean.readings.map((one) => one.text)).toEqual(["かみ"]);
    expect(JSON.stringify(clean)).not.toContain("rude");
  });

  it("keeps everything a sense for all forms and readings applies to, and is the entry itself when nothing is marked", () => {
    const plain = entryOf(entry(`${text}${sense("uk", "plain")}`));
    expect(cleanEntry(plain)).toBe(plain);
    const mixed = cleanEntry(entryOf(entry(`${text}${sense("uk", "plain")}${sense("X", "rude")}`)));
    expect(mixed.forms).toHaveLength(2);
    expect(mixed.readings).toHaveLength(2);
  });

  it("is none when every sense is marked", () => {
    expect(cleanEntry(entryOf(entry(`${text}${sense("sens", "a")}${sense("derog", "b")}`)))).toBeNull();
  });
});

describe("a row says which entry it is", () => {
  it("has the number of its entry, and none when the entry has none", () => {
    const [row] = rowsOfEntry(entry(`<r_ele><reb>あ</reb></r_ele><sense><gloss>ah</gloss></sense>`, 1_005_000));
    expect(row.id).toBe(1_005_000);
    const [none] = rowsOfEntry(`<r_ele><reb>あ</reb></r_ele><sense><gloss>ah</gloss></sense>`);
    expect(none.id).toBeUndefined();
  });
});
