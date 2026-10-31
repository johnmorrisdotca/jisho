// Writes src/data/ from public sources, so that every row is machine output anybody can make again and none is typed by hand.
//
//   node scripts/build-data.mjs                         fetches KANJIDIC2 from the EDRDG
//   node scripts/build-data.mjs kanjidic2.xml.gz        reads a copy already here
//
// The other sources are kept in data-sources/, with the address, date and SHA-256 of each in data-sources/sources.json:
// Jonathan Waller's JLPT lists, read once through scripts/extract-jlpt.mjs, and Lars Yencken's two kanji distance files.
// Nothing here reads any other project's files, and no list of any kind from a commercial study service goes in.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { gunzipSync } from "node:zlib";

const KANJIDIC2_URL = "http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz";
const OUT = "src/data";
/** Keep a pair at or above this, on either measure. Below it, a list stops being a warning: see docs/guides/look-alike.md. */
const KEEP_STROKES = 0.6;
const KEEP_PARTS = 0.7;

async function kanjidicBytes() {
  const given = process.argv[2];
  if (given !== undefined) {
    if (!existsSync(given)) throw new Error(`No such file: ${given}`);
    return readFileSync(given);
  }
  const response = await fetch(KANJIDIC2_URL);
  if (!response.ok) throw new Error(`${KANJIDIC2_URL} answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const decode = (text) =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");

const zipped = await kanjidicBytes();
const sha256 = createHash("sha256").update(zipped).digest("hex");
const xml = gunzipSync(zipped).toString("utf8");
const created = /<date_of_creation>(\d{4}-\d{2}-\d{2})<\/date_of_creation>/.exec(xml)?.[1];
if (created === undefined) throw new Error("No date of creation in KANJIDIC2.");

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const jlpt = Object.fromEntries(
  LEVELS.map((level) => [level, readFileSync(`data-sources/jlpt/${level.toLowerCase()}.txt`, "utf8").trim()]),
);
const levelOf = new Map(LEVELS.flatMap((level) => [...jlpt[level]].map((kanji) => [kanji, level])));

const rows = [];
const grades = new Map([1, 2, 3, 4, 5, 6, 8, 9, 10].map((grade) => [grade, []]));
const seenInKanjidic = new Set();
for (const match of xml.matchAll(/<character>[\s\S]*?<\/character>/g)) {
  const entry = match[0];
  const literal = /<literal>([\s\S]*?)<\/literal>/.exec(entry)[1];
  seenInKanjidic.add(literal);
  const grade = Number(/<grade>(\d+)<\/grade>/.exec(entry)?.[1] ?? 0);
  if (!grades.has(grade)) {
    if (levelOf.has(literal))
      throw new Error(`${literal} is on Waller's ${levelOf.get(literal)} and has no school grade.`);
    continue;
  }
  grades.get(grade).push(literal);
  const texts = (pattern) => [...entry.matchAll(pattern)].map((one) => decode(one[1].trim()));
  rows.push([
    literal,
    Number(/<stroke_count>(\d+)<\/stroke_count>/.exec(entry)[1]),
    grade,
    levelOf.get(literal) ?? "",
    Number(/<freq>(\d+)<\/freq>/.exec(entry)?.[1] ?? 0),
    texts(/<reading r_type="ja_on"[^>]*>([\s\S]*?)<\/reading>/g),
    texts(/<reading r_type="ja_kun"[^>]*>([\s\S]*?)<\/reading>/g),
    texts(/<meaning>([\s\S]*?)<\/meaning>/g),
    texts(/<meaning m_lang="fr">([\s\S]*?)<\/meaning>/g),
  ]);
}
for (const kanji of levelOf.keys()) if (!seenInKanjidic.has(kanji)) throw new Error(`${kanji} is not in KANJIDIC2.`);

const inTable = new Set(rows.map((row) => row[0]));
const read = (file) => {
  const scores = new Map();
  for (const line of readFileSync(`data-sources/look-alike/${file}`, "utf8").split("\n")) {
    const [kanji, ...rest] = line.trim().split(/\s+/);
    for (let at = 0; at + 1 < rest.length; at += 2) {
      const pair = [kanji, rest[at]].sort().join("");
      scores.set(pair, Math.max(scores.get(pair) ?? 0, Number(rest[at + 1])));
    }
  }
  return scores;
};
const strokes = read("jyouyou__strokeEditDistance.csv");
const parts = read("jyouyou__yehAndLiRadical.csv");
const percent = (score) => Math.round(score * 100);
const pairs = [...new Set([...strokes.keys(), ...parts.keys()])]
  .filter((pair) => [...pair].every((kanji) => inTable.has(kanji)))
  .filter((pair) => (strokes.get(pair) ?? 0) >= KEEP_STROKES || (parts.get(pair) ?? 0) >= KEEP_PARTS)
  .sort()
  .map((pair) => [pair, percent(strokes.get(pair) ?? 0), percent(parts.get(pair) ?? 0)]);

const EDRDG = ` * KANJIDIC2 is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.`;
const WALLER = ` * The JLPT levels are Jonathan Waller's lists, from his JLPT Resources at http://www.tanos.co.uk/jlpt/, under Creative Commons
 * "BY" (http://www.tanos.co.uk/jlpt/sharing/). The JLPT itself has published no list of kanji since 2010: these are one person's.`;
const YENCKEN = ` * The scores are Lars Yencken's, from https://lars.yencken.org/datasets/kanji-confusion/, under the Creative Commons Attribution
 * 3.0 Unported licence: Yencken, Lars (2010) Orthographic support for passing the reading hurdle in Japanese. PhD Thesis,
 * University of Melbourne, Melbourne, Australia.`;

mkdirSync(OUT, { recursive: true });
const example = (name, entry) => ` *
 * @example
 * \`\`\`ts
 * import { ${name} } from "@johnmorrisdotca/moji/${entry}";
 *
 * console.log(Object.keys(${name}));
 * \`\`\`
 */`;

writeFileSync(
  `${OUT}/grades.data.ts`,
  `/**
 * The school grades of ${rows.length} kanji, as a string of kanji a grade. Written by \`scripts/build-data.mjs\` from KANJIDIC2 of
 * ${created}. Never edited by hand.
 *
${EDRDG}
 * This table is derived from it and is under the same licence.
${example("GRADES", "grades")}
export const GRADES = {
  source: "KANJIDIC2",
  release: ${JSON.stringify(created)},
  grades: ${JSON.stringify(Object.fromEntries([...grades].map(([grade, kanji]) => [grade, kanji.join("")])))},
};
`,
);

writeFileSync(
  `${OUT}/jlpt.data.ts`,
  `/**
 * ${levelOf.size} kanji by JLPT level, each level a string of kanji in the order of Waller's list. Written by
 * \`scripts/build-data.mjs\` from \`data-sources/jlpt/\`. Never edited by hand.
 *
${WALLER}
${example("JLPT", "jlpt")}
export const JLPT = {
  source: "Jonathan Waller, JLPT Resources, tanos.co.uk",
  levels: ${JSON.stringify(jlpt)},
};
`,
);

writeFileSync(
  `${OUT}/kanji.data.ts`,
  `import type { PackedKanji } from "../index.ts";

/**
 * ${rows.length} kanji: every one with a school grade in KANJIDIC2, which holds every one on the JLPT lists. Written by
 * \`scripts/build-data.mjs\` from KANJIDIC2 of ${created} and \`data-sources/jlpt/\`. Never edited by hand.
 * Each row: kanji, strokes, grade, JLPT level or "", newspaper frequency rank or 0, on readings, kun readings, English meanings,
 * French meanings.
 *
${EDRDG}
 * This table is derived from it and is under the same licence.
${WALLER}
${example("KANJI", "kanji")}
export const KANJI: PackedKanji = {
  source: "KANJIDIC2",
  release: ${JSON.stringify(created)},
  rows: ${JSON.stringify(rows)},
};
`,
);

writeFileSync(
  `${OUT}/look-alike.data.ts`,
  `import type { PackedLookAlikes } from "../index.ts";

/**
 * ${pairs.length} pairs of kanji that look alike, each with two scores out of 100: by how few stroke edits separate them, and by
 * the parts they share (0 where the measure did not rank the pair among either kanji's ten nearest). Kept at ${percent(KEEP_STROKES)} or more by
 * strokes, or ${percent(KEEP_PARTS)} or more by parts. Written by \`scripts/build-data.mjs\` from \`data-sources/look-alike/\`. Never edited by hand.
 *
${YENCKEN}
${example("LOOK_ALIKE", "look-alike")}
export const LOOK_ALIKE: PackedLookAlikes = {
  source: "Lars Yencken, Kanji confusion datasets",
  pairs: ${JSON.stringify(pairs)},
};
`,
);

console.log(`KANJIDIC2 ${created}, SHA-256 ${sha256}`);
console.log(
  `${rows.length} kanji: ${[...grades].map(([grade, kanji]) => `grade ${grade}: ${kanji.length}`).join(", ")}`,
);
console.log(`JLPT: ${LEVELS.map((level) => `${level} ${[...jlpt[level]].length}`).join(", ")}`);
console.log(`${pairs.length} look-alike pairs, ${new Set(pairs.flatMap(([pair]) => [...pair])).size} kanji in them`);
