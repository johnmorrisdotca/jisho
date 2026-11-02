// Writes src/data/words/ from JMdict, so that every row of the words is machine output anybody can make again and none is typed
// by hand.
//
//   node scripts/build-words.mjs                  fetches JMdict_e from the EDRDG
//   node scripts/build-words.mjs JMdict_e.gz      reads a copy already here
//
// It writes the common words (about 26,000 rows, one file), then the whole dictionary twice over, in pieces small enough for one
// lookup to fetch one: the rows by reading, and an index from each written form to its readings. Both are cut where a reading or
// a form changes, so that no key is split across two pieces, and the first key of each piece is in the manifest. See
// docs/guides/words.md.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import process from "node:process";
import { gunzipSync } from "node:zlib";

import { foldKana, packRow, releaseOf, rowsOfDictionary } from "./words-parse.mjs";

const JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz";
const OUT = "src/data/words";
/** About this many bytes of rows to a piece of the rows by reading: one guess fetches one, gzipped to a third of it. */
const READING_PIECE_BYTES = 64_000;
/** About this many to a piece of the index of written forms. */
const FORM_PIECE_BYTES = 96_000;
/** Readings that are not all kana (a middle dot is kana here, as it is in loanwords): they are looked up like a written form. */
export const KANA_TEXT = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

async function jmdictBytes() {
  const given = process.argv[2];
  if (given !== undefined) {
    if (!existsSync(given)) throw new Error(`No such file: ${given}`);
    return readFileSync(given);
  }
  const response = await fetch(JMDICT_URL);
  if (!response.ok) throw new Error(`${JMDICT_URL} answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Cuts a sorted list of [key, line] into pieces of about `bytes`, never between two lines of one key. Returns [{ start, lines }],
 * where `start` is the shortest text that sorts after the last key of the piece before and not after the first key of this one:
 * a lookup finds a key's piece by comparing it with the starts, and the manifest stays small.
 */
export function cut(sorted, bytes) {
  const pieces = [];
  let current = null;
  let size = 0;
  let last = null;
  for (const [key, line] of sorted) {
    if (current === null || (size >= bytes && key !== last)) {
      let start = "";
      if (current !== null) {
        const characters = [...key];
        let length = 1;
        while (characters.slice(0, length).join("") <= last) length++;
        start = characters.slice(0, length).join("");
      }
      current = { start, lines: [] };
      pieces.push(current);
      size = 0;
    }
    current.lines.push(line);
    size += Buffer.byteLength(line) + 1;
    last = key;
  }
  return pieces;
}

const EDRDG = ` * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.`;

const rowsLiteral = (lines) => lines.map((line) => `    ${JSON.stringify(line)},`).join("\n");

/** The text of a data file: its licence first, then the rows, one to a line so that a month's change reads row by row. */
function dataFile({ summary, type, name, entry, body, imports }) {
  const example =
    entry === undefined
      ? ""
      : ` *
 * @example
 * \`\`\`ts
 * import { ${name} } from "@johnmorrisdotca/moji/${entry}";
 *
 * console.log(Object.keys(${name}));
 * \`\`\`
`;
  return `${imports}
/**
 * ${summary} Written by \`scripts/build-words.mjs\` from JMdict, never edited by hand.
 *
${EDRDG}
${example} */
export const ${name}: ${type} = ${body};
`;
}

function main(zipped) {
  const sha256 = createHash("sha256").update(zipped).digest("hex");
  const xml = gunzipSync(zipped).toString("utf8");
  const release = releaseOf(xml);
  if (release === null) throw new Error("No release date in JMdict.");

  const rows = rowsOfDictionary(xml);
  if (rows.length < 200_000) throw new Error(`JMdict gave ${rows.length} rows: far too few, read the source.`);
  const lines = rows.map(packRow);
  const keyed = rows.map((row, at) => [foldKana(row.reading), lines[at], row, at]);

  // 1. The common words, in one file.
  const common = keyed.filter(([, , row]) => row.common).map(([, line]) => line);

  // 2. The rows by reading, sorted by the reading folded to hiragana and, within one, the commonest first (already the order).
  const byReading = keyed
    .map(([key, line, , at]) => [key, line, at])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[2] - b[2]))
    .map(([key, line]) => [key, line]);
  const readingPieces = cut(byReading, READING_PIECE_BYTES);

  // 3. The index: each written form with its readings, the commonest word's first. A reading that is not kana alone cannot be
  // asked for as kana, so it is listed as a form of its own.
  const readingsOf = new Map();
  for (const row of rows) {
    for (const form of row.forms) {
      const held = readingsOf.get(form) ?? [];
      if (!held.includes(row.reading)) held.push(row.reading);
      readingsOf.set(form, held);
    }
    if (!KANA_TEXT.test(row.reading)) {
      const held = readingsOf.get(row.reading) ?? [];
      if (!held.includes(row.reading)) held.push(row.reading);
      readingsOf.set(row.reading, held);
    }
  }
  const byForm = [...readingsOf]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([form, readings]) => [form, `${form}\t${readings.join("|")}`]);
  const formPieces = cut(byForm, FORM_PIECE_BYTES);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const pieceName = (prefix, at, count) => `${prefix}${String(at).padStart(String(count - 1).length, "0")}`;

  writeFileSync(
    `${OUT}/common.data.ts`,
    dataFile({
      imports: `import type { PackedWords } from "../../words.ts";\n`,
      summary: `The ${common.length.toLocaleString("en-US")} common words of JMdict, which tags a word common when any of its written forms or readings is in news1, ichi1, spec1, spec2 or gai1. Each row: reading, written forms joined by "|", English meaning, flags, and the meaning for children where it differs.`,
      type: "PackedWords",
      name: "COMMON_WORDS",
      entry: "words-common",
      body: `{
  source: "JMdict",
  release: ${JSON.stringify(release)},
  rows: [
${rowsLiteral(common)}
  ],
}`,
    }),
  );

  const loaders = (prefix, pieces) =>
    pieces
      .map(
        (_piece, at) =>
          `      () => import("./${pieceName(prefix, at, pieces.length)}.data.ts").then((one) => one.PIECE),`,
      )
      .join("\n");
  const starts = (pieces) => pieces.map((piece) => JSON.stringify(piece.start)).join(", ");
  const writePieces = (prefix, pieces, summary) => {
    for (const [at, piece] of pieces.entries()) {
      writeFileSync(
        `${OUT}/${pieceName(prefix, at, pieces.length)}.data.ts`,
        dataFile({
          imports: `import type { WordsPiece } from "../../words.ts";\n`,
          summary: `${summary} Piece ${at + 1} of ${pieces.length}, from ${JSON.stringify(piece.start)}.`,
          type: "WordsPiece",
          name: "PIECE",
          body: `{
  rows: [
${rowsLiteral(piece.lines)}
  ],
}`,
        }),
      );
    }
  };
  writePieces(
    "r",
    readingPieces,
    'Rows of JMdict by reading, each: reading, written forms joined by "|", English meaning, flags, and the meaning for children where it differs.',
  );
  writePieces("f", formPieces, 'Written forms of JMdict, each: form, then the readings it has joined by "|".');

  writeFileSync(
    `${OUT}/manifest.data.ts`,
    dataFile({
      imports: `import type { WordsManifest } from "../../words.ts";\n`,
      summary: `Where the pieces of JMdict are: the first key of each, and how to fetch it. ${readingPieces.length} pieces of rows by reading and ${formPieces.length} of written forms.`,
      type: "WordsManifest",
      name: "MANIFEST",
      body: `{
  source: "JMdict",
  release: ${JSON.stringify(release)},
  rowCount: ${rows.length},
  readings: {
    starts: [${starts(readingPieces)}],
    load: [
${loaders("r", readingPieces)}
    ],
  },
  forms: {
    starts: [${starts(formPieces)}],
    load: [
${loaders("f", formPieces)}
    ],
  },
}`,
    }),
  );

  recordSource({ release, sha256 });
  const kb = (n) => `${(n / 1e3).toFixed(0)} kB`;
  const size = (pieces) => pieces.map((piece) => Buffer.byteLength(piece.lines.join("\n")));
  console.log(`JMdict ${release}, SHA-256 ${sha256}`);
  console.log(
    `${rows.length} rows, ${common.length} of them common, ${rows.filter((row) => row.kids !== undefined).length} with a sense left out for children`,
  );
  console.log(`${readingPieces.length} pieces by reading, the largest ${kb(Math.max(...size(readingPieces)))}`);
  console.log(
    `${formPieces.length} pieces of written forms (${readingsOf.size} forms), the largest ${kb(Math.max(...size(formPieces)))}`,
  );
}

/** Notes the file used in data-sources/sources.json, beside the other sources: its address, date and SHA-256. */
function recordSource({ release, sha256 }) {
  const file = "data-sources/sources.json";
  const sources = JSON.parse(readFileSync(file, "utf8"));
  sources.jmdict = {
    address: JMDICT_URL,
    terms: "https://www.edrdg.org/edrdg/licence.html",
    licence: "CC BY-SA 4.0 and the Group's conditions",
    dateOfCreation: release,
    sha256,
    retrieved: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(file, `${JSON.stringify(sources, null, 2)}\n`);
}

if (process.argv[1]?.endsWith("build-words.mjs")) main(await jmdictBytes());
