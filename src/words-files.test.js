// What is not for children must never reach a browser that did not ask for it. These read the files a default lookup fetches, as
// the bytes they are shipped in, and find none of it: not the word, not its readings, not the text of the sense. The files that
// hold it are the extra ones, and they are the only ones that do.
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FOLDER = "src/data/words";
const files = readdirSync(FOLDER);
/** What a default lookup can fetch: the common table, the manifest, and the pieces. */
const DEFAULT = files.filter(
  (name) =>
    name === "common.data.ts" ||
    name === "manifest.data.ts" ||
    name === "index-manifest.data.ts" ||
    name === "entry-manifest.data.ts" ||
    /^[rfmke]\d+\.data\.ts$/.test(name),
);
/** What only a host that asks for everything fetches. */
const EXTRA = files.filter(
  (name) =>
    name === "extra-manifest.data.ts" ||
    name === "index-extra-manifest.data.ts" ||
    name === "common-extra.data.ts" ||
    name === "entry-extra-manifest.data.ts" ||
    /^x[rfmke]\d+\.data\.ts$/.test(name),
);
const text = (names) => names.map((name) => readFileSync(`${FOLDER}/${name}`, "utf8")).join("\n");

describe("the files a default lookup fetches", () => {
  const everyDefaultFile = text(DEFAULT);
  const everyExtraFile = text(EXTRA);

  it("are every file but the extra ones, which are named for what they are", () => {
    expect(EXTRA).toContain("common-extra.data.ts");
    expect(EXTRA).toContain("extra-manifest.data.ts");
    expect(EXTRA).toContain("entry-extra-manifest.data.ts");
    expect(EXTRA.filter((name) => /^x[rfmke]/.test(name)).length).toBeGreaterThan(5);
    expect(DEFAULT.length + EXTRA.length).toBe(files.length);
    expect(DEFAULT.length).toBeGreaterThan(300);
  });

  it("hold nothing of a word with nothing in it for children: ほもびでお is in none of them, in either kana, nor its other spellings", () => {
    // The pieces are keyed by the reading folded to hiragana, and a row keeps the reading as JMdict writes it.
    for (const left of ["ほもびでお", "ホモビデオ", "ホモビ", "ホモ・ビデオ", "ほも・びでお", "gay porn"])
      expect(everyDefaultFile, left).not.toContain(left);
    for (const left of ["ホモビデオ", "ホモ・ビデオ", "gay porn"]) expect(everyExtraFile, left).toContain(left);
  });

  it("hold no sense JMdict marks vulgar, derogatory or sensitive, in the row of the word that has it", () => {
    // [the word's reading, the text of the marked sense]. JMdict's marks are its own and are not complete: a sense it has not marked
    // (クンニ, 口淫) is in the default files and is not a fault of these.
    const unfit = [
      ["ハーモニカ", "cunnilingus"], // vulgar
      ["しゃくはち", "blow job"],
      ["シックスナイン", "sixty-nine"],
      ["ピザ", "fat, ugly person"], // derogatory
      ["シュガー", "schizophrenia"],
      ["チンピラ", "hoodlum"],
      ["くたばる", "kick the bucket"],
      ["ジプシー", "gypsy"], // sensitive
      ["がいじん", "Westerner"],
      ["ちび", "pipsqueak"],
    ];
    for (const [reading, left] of unfit) {
      const row = new RegExp(`"${reading}\\\\t[^"]*${left.replace(/[()]/g, "\\$&")}`);
      expect(everyDefaultFile, `${reading} ${left}`).not.toMatch(row);
      expect(everyExtraFile, `${reading} ${left}`).toMatch(row);
    }
  });

  it("hold no sense JMdict marks vulgar, derogatory or sensitive in the whole entries either, and keep the plain ones", () => {
    const lines = (names) =>
      names.flatMap((name) =>
        [...readFileSync(`${FOLDER}/${name}`, "utf8").matchAll(/^ {4}"((?:[^"\\]|\\.)*)",$/gm)].map((match) =>
          JSON.parse(`"${match[1]}"`),
        ),
      );
    const kept = lines(DEFAULT.filter((name) => /^e\d+\.data\.ts$/.test(name)));
    const cut = lines(EXTRA.filter((name) => /^xe\d+\.data\.ts$/.test(name)));
    const harmonica = (list) => list.find((line) => line.split("\t")[2]?.split("|").includes("ハーモニカ"));
    expect(harmonica(kept), "the harmonica is kept").toContain("harmonica");
    expect(harmonica(kept)).not.toContain("cunnilingus");
    expect(harmonica(cut)).toContain("cunnilingus");
    expect(harmonica(cut)).toContain("harmonica");
    expect(kept.filter((line) => line.includes("gay porn"))).toEqual([]);
    expect(cut.filter((line) => line.includes("gay porn")).length).toBeGreaterThan(0);
    // An entry of which every sense is marked is in no default piece, and a sense marked is in no line of one.
    expect(kept.length).toBeGreaterThan(200_000);
    expect(cut.length).toBeGreaterThan(800);
  });

  it("hold no example that safe mode leaves out, and the extra pieces hold the whole list of each entry that differs", () => {
    const folder = "src/data/examples";
    const names = readdirSync(folder);
    const lines = (pattern) =>
      names
        .filter((name) => pattern.test(name))
        .flatMap((name) =>
          [...readFileSync(`${folder}/${name}`, "utf8").matchAll(/^ {4}"((?:[^"\\]|\\.)*)",$/gm)].map((match) =>
            JSON.parse(`"${match[1]}"`),
          ),
        );
    const kept = new Map(lines(/^s\d+\.data\.ts$/).map((line) => [line.slice(0, line.indexOf("\t")), line]));
    const whole = lines(/^xs\d+\.data\.ts$/);
    expect(kept.size).toBeGreaterThan(28_000);
    expect(whole.length).toBeGreaterThan(50);
    let cut = 0;
    for (const line of whole) {
      const [key, ...examples] = line.split("\t");
      const keptLine = kept.get(key) ?? "";
      for (const example of examples) {
        if (keptLine.includes(example)) continue;
        cut++;
        const sentence = example.split("¦")[1];
        for (const other of kept.values()) expect(other, sentence).not.toContain(sentence);
      }
    }
    expect(cut).toBeGreaterThan(50);
  });

  it("keep the plain senses of the words that have both: the harmonica, the lunch, the pizza, the outsider", () => {
    for (const kept of [
      "harmonica",
      "boxed lunch bought at a station",
      "pizza",
      "outsider",
      "shakuhachi",
      "to be pooped",
    ])
      expect(everyDefaultFile, kept).toContain(kept);
  });

  it("do not name the files that do, so that nothing reaches for them: the manifest never imports an extra file", () => {
    expect(readFileSync(`${FOLDER}/manifest.data.ts`, "utf8")).not.toMatch(/extra|x[rf]\d/);
    expect(readFileSync(`${FOLDER}/entry-manifest.data.ts`, "utf8")).not.toMatch(/extra|xe\d/);
    expect(readFileSync(`${FOLDER}/index-manifest.data.ts`, "utf8")).not.toMatch(/extra|x[mk]\d/);
    expect(everyDefaultFile).not.toMatch(
      /import\("\.\/(?:common-|index-|entry-)?extra|import\("\.\/(?:entry-)?(?:x[rfmke]\d)/,
    );
  });

  it("hold the keys of no extra row: every reading left out whole is in none of the pieces", () => {
    const readings = (names) =>
      names.flatMap((name) =>
        [...readFileSync(`${FOLDER}/${name}`, "utf8").matchAll(/^ {4}"([^\\"]*)\\t/gm)].map((match) => match[1]),
      );
    const kept = new Set(readings(DEFAULT.filter((name) => /^r\d+\.data\.ts$/.test(name))));
    const left = readings(EXTRA.filter((name) => /^xr\d+\.data\.ts$/.test(name))).filter(
      (reading) => !kept.has(reading),
    );
    // The readings of words left out whole: more than seven hundred of them are in the extra pieces and not in any default piece.
    expect(left.length).toBeGreaterThan(700);
    expect(left).toContain("ホモビデオ");
  });

  it("are small: the default pieces and the common words are the same files as before, and the extra ones are small beside them", () => {
    const size = (names) => names.reduce((sum, name) => sum + readFileSync(`${FOLDER}/${name}`).length, 0);
    expect(size(EXTRA)).toBeLessThan(size(DEFAULT) / 30);
  });
});
