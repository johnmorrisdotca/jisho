import { describe, expect, it } from "vitest";

import { loadEntry, readEntry, referenceOf } from "./entries.ts";
import { loadWords, wordsOf } from "./words.ts";

const first = async (text: string, mode: "safe" | "unfiltered" = "safe") => {
  const words = await loadWords(text, { mode });
  const word = wordsOf(words, text)[0];
  if (word === undefined) throw new Error(`no word for ${text}`);
  return word;
};

describe("a row says which entry it is", () => {
  it("has the number JMdict gives the entry, and a word made by hand may have none", async () => {
    const word = await first("かみ");
    expect(word.written).toBe("紙");
    expect(Number.isInteger(word.id)).toBe(true);
    expect(word.id).toBeGreaterThan(1_000_000);
  });
});

describe("the whole entry of a word", () => {
  it("has every sense, with its parts of speech, glosses, and the forms and readings", async () => {
    const word = await first("かみ");
    const entry = await loadEntry(word);
    expect(entry?.id).toBe(word.id);
    expect(entry?.forms.map((form) => form.text)).toContain("紙");
    expect(entry?.readings.map((reading) => reading.text)).toEqual(["かみ"]);
    expect(entry?.senses[0]?.pos).toContain("n");
    expect(entry?.senses[0]?.glosses.map((gloss) => gloss.text)).toContain("paper");
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry?.senses[0]?.glosses)).toBe(true);
  });

  it("is given by the number of the entry as well", async () => {
    const word = await first("かみ");
    expect((await loadEntry(word.id as number))?.id).toBe(word.id);
  });

  it("holds more than the row, for a word with more senses than a row keeps", async () => {
    const word = await first("する");
    const entry = await loadEntry(word);
    expect(word.senses.length).toBeLessThanOrEqual(4);
    expect(entry?.senses.length).toBeGreaterThan(word.senses.length);
  });

  it("says where a loanword comes from, and the cross-references and antonyms of a sense", async () => {
    const entry = await loadEntry(await first("パン"));
    const source = entry?.senses.flatMap((sense) => sense.sources)[0];
    expect(source?.lang).toBe("por");
    expect(source?.text).toBe("pão");
    const hot = await loadEntry(await first("あつい"));
    expect(hot?.senses.some((sense) => sense.antonyms.length > 0)).toBe(true);
    const upper = await loadEntry(await first("じょうず"));
    expect(upper?.senses.length).toBeGreaterThan(0);
  });

  it("leaves out in safe mode a sense JMdict marks vulgar, and gives it whole when asked for everything", async () => {
    const word = await first("ハーモニカ", "unfiltered");
    const safe = await loadEntry(word);
    const whole = await loadEntry(word, { mode: "unfiltered" });
    const text = (entry: typeof safe) => JSON.stringify(entry);
    expect(text(safe)).toContain("harmonica");
    expect(text(safe)).not.toContain("cunnilingus");
    expect(text(whole)).toContain("cunnilingus");
    expect(text(whole)).toContain("harmonica");
    expect(whole?.senses.length).toBeGreaterThan(safe?.senses.length ?? 99);
    // A sense keeps the number JMdict gives it, so a cross-reference to it still means it when a sense before it is left out.
    expect(safe?.senses.map((sense) => sense.number)).toEqual(
      whole?.senses.filter((sense) => !JSON.stringify(sense).includes("cunnilingus")).map((sense) => sense.number),
    );
    expect(whole?.senses.map((sense) => sense.number)).toEqual(whole?.senses.map((_, at) => at + 1));
  });

  it("gives an entry JMdict has no word for as null, and refuses what is not an entry", async () => {
    expect(await loadEntry(1)).toBeNull();
    expect(await loadEntry(999_999_999_999)).toBeNull();
    await expect(loadEntry({} as never)).rejects.toThrow(TypeError);
    await expect(loadEntry(-1)).rejects.toThrow(TypeError);
    await expect(loadEntry(1.5)).rejects.toThrow(TypeError);
    await expect(loadEntry(1, { mode: "careful" as never })).rejects.toThrow(TypeError);
  });
});

describe("an entry read from its line", () => {
  const mark = (n: number) => String.fromCharCode(0xe000 + n);
  const [lit, expl, fig, tm] = [0x10, 0x11, 0x12, 0x13].map(mark);
  const [onlyForms, onlyReadings, seeAlso, antonyms, notes, sources] = [1, 2, 3, 4, 5, 6].map(mark);
  const line = [
    "00z1",
    "亜米利加~ateji|アメリカ",
    "アメリカ|あめりか~ok~亜米利加|ごっこ~~~!",
    [
      "n,adj-no",
      "food,ksb",
      `${lit}literal bit`,
      "plain",
      `${expl}an explanation`,
      `${fig}figurative`,
      `${tm}brand`,
      `${onlyForms}亜米利加`,
      `${onlyReadings}アメリカ`,
      `${seeAlso}神・かみ・1|紙`,
      `${antonyms}下`,
      `${notes}usu. in the negative\u2028second note`,
      `${sources}eng~america|ger~Amerika|porp~x|jpnw~y`,
    ].join("¦"),
    `v5r¦¦stay¦${mark(7)}4`,
  ].join("\t");

  it("has its forms, readings, senses and everything optional", () => {
    const entry = readEntry(line);
    expect(entry.id).toBe(Number.parseInt("00z1", 36));
    expect(entry.forms).toEqual([
      { text: "亜米利加", marks: ["ateji"] },
      { text: "アメリカ", marks: [] },
    ]);
    expect(entry.readings).toEqual([
      { text: "アメリカ", marks: [], onlyForms: [], noKanji: false },
      { text: "あめりか", marks: ["ok"], onlyForms: ["亜米利加"], noKanji: false },
      { text: "ごっこ", marks: [], onlyForms: [], noKanji: true },
    ]);
    const sense = entry.senses[0];
    expect(sense?.number).toBe(1);
    expect(sense?.pos).toEqual(["n", "adj-no"]);
    expect(sense?.marks).toEqual(["food", "ksb"]);
    expect(sense?.glosses).toEqual([
      { text: "literal bit", kind: "lit" },
      { text: "plain", kind: null },
      { text: "an explanation", kind: "expl" },
      { text: "figurative", kind: "fig" },
      { text: "brand", kind: "tm" },
    ]);
    expect(sense?.onlyForms).toEqual(["亜米利加"]);
    expect(sense?.onlyReadings).toEqual(["アメリカ"]);
    expect(sense?.seeAlso).toEqual(["神・かみ・1", "紙"]);
    expect(sense?.antonyms).toEqual(["下"]);
    expect(sense?.notes).toEqual(["usu. in the negative", "second note"]);
    expect(sense?.sources).toEqual([
      { lang: "eng", text: "america", partial: false, wasei: false },
      { lang: "ger", text: "Amerika", partial: false, wasei: false },
      { lang: "por", text: "x", partial: true, wasei: false },
      { lang: "jpn", text: "y", partial: false, wasei: true },
    ]);
    expect(entry.senses[1]?.glosses).toEqual([{ text: "stay", kind: null }]);
    expect(entry.senses[1]?.number).toBe(4);
    expect(entry.senses[1]?.sources).toEqual([]);
  });
});

describe("a cross-reference", () => {
  it("is read as a word, a reading and a sense", () => {
    expect(referenceOf("神")).toEqual({ written: "神", reading: undefined, sense: undefined });
    expect(referenceOf("神・かみ")).toEqual({ written: "神", reading: "かみ", sense: undefined });
    expect(referenceOf("天神・6")).toEqual({ written: "天神", reading: undefined, sense: 6 });
    expect(referenceOf("神・かみ・1")).toEqual({ written: "神", reading: "かみ", sense: 1 });
    expect(referenceOf("ア・ラ・カルト・あらかると")).toEqual({
      written: "ア・ラ・カルト",
      reading: "あらかると",
      sense: undefined,
    });
    expect(referenceOf("")).toEqual({ written: "", reading: undefined, sense: undefined });
  });
});
