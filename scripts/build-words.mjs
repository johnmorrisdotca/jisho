// Writes src/data/words/ from JMdict, so that every row of the words is machine output anybody can make again and none is typed
// by hand.
//
//   node scripts/build-words.mjs                  fetches JMdict_e from the EDRDG
//   node scripts/build-words.mjs JMdict_e.gz      reads a copy already here
//
// It writes the default words, which hold only what safe mode keeps: the common words (about 26,000 rows, one file), then the
// whole dictionary twice over, in pieces small enough for one lookup to fetch one: the rows by reading, and an index from each
// written form to its readings. Both are cut where a reading or a form changes, so that no key is split across two pieces, and the
// first key of each piece is in the manifest. Everything the default words leave out goes in files of their own, which a lookup
// fetches only in unfiltered mode. See docs/guides/words.md.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import process from "node:process";
import { gunzipSync } from "node:zlib";
import { packRow, releaseOf, rowsOfDictionary } from "./words-parse.mjs";
import { patched, tablesOf } from "./words-tables.mjs";

const JMDICT_URL = "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz";
const OUT = "src/data/words";
/** About this many bytes of rows to a piece of the rows by reading: one guess fetches one, gzipped to a third of it. */
const READING_PIECE_BYTES = 64_000;
/** About this many to a piece of what safe mode leaves out. */
const EXTRA_PIECE_BYTES = 48_000;
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
 * import { ${name} } from "@johnmorrisdotca/jisho/${entry}";
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
  const tables = tablesOf(rows);
  const { common, commonPatch, counts } = tables;
  const readingPieces = cut(tables.readings, READING_PIECE_BYTES);
  const formPieces = cut(tables.forms, FORM_PIECE_BYTES);
  // The patch must turn the default common words back into every common word as JMdict has it.
  const everyCommon = rows.filter((row) => row.common).map((row) => packRow(row));
  if (JSON.stringify(patched(common, commonPatch)) !== JSON.stringify(everyCommon))
    throw new Error("The patch of the common words does not make every common word again.");

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const pieceName = (prefix, at, count) => `${prefix}${String(at).padStart(String(count - 1).length, "0")}`;

  writeFileSync(
    `${OUT}/common.data.ts`,
    dataFile({
      imports: `import type { PackedWords } from "../../words.ts";\n`,
      summary: `The ${common.length.toLocaleString("en-US")} common words of JMdict that safe mode keeps, which tags a word common when any of its written forms or readings is in news1, ichi1, spec1, spec2 or gai1. Each row: reading, written forms joined by "|", flags, then one field for each sense: its marks, then its glosses. Nothing that safe mode leaves out is in it.`,
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

  writeFileSync(
    `${OUT}/common-extra.data.ts`,
    dataFile({
      imports: `import type { PackedPatch } from "../../words.ts";\n`,
      summary: `What to do to the common words to have every common word as JMdict has it: each line is a position, "r" to replace the row there or "i" to insert one before it, and the row. Only for unfiltered mode.`,
      type: "PackedPatch",
      name: "COMMON_EXTRA",
      entry: "words-common-extra",
      body: `{
  source: "JMdict",
  release: ${JSON.stringify(release)},
  edits: [
${rowsLiteral(commonPatch)}
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
    'Rows of JMdict that safe mode keeps, by reading, each: reading, written forms joined by "|", flags, then one field for each sense.',
  );
  writePieces(
    "f",
    formPieces,
    'Written forms of JMdict that safe mode keeps, each: form, then the readings it has joined by "|".',
  );

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
  rowCount: ${counts.cleanRows},
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

  // Everything the pieces leave out, in pieces of its own with a manifest of its own, so that nothing a safe lookup fetches names it.
  const extraReadingPieces = cut(tables.extraReadings, EXTRA_PIECE_BYTES);
  const extraFormPieces = cut(tables.extraForms, EXTRA_PIECE_BYTES);
  writePieces(
    "xr",
    extraReadingPieces,
    'The whole answer, as JMdict has it, for each reading whose answer is not the same in safe mode, each row: reading, written forms joined by "|", flags, then one field for each sense. Only for a lookup that asks for everything.',
  );
  writePieces(
    "xf",
    extraFormPieces,
    'The whole list of readings, as JMdict has it, for each written form whose readings are not the same in safe mode, each: form, then its readings joined by "|". Only for a lookup that asks for everything.',
  );
  writeFileSync(
    `${OUT}/extra-manifest.data.ts`,
    dataFile({
      imports: `import type { WordsManifest } from "../../words.ts";\n`,
      summary: `Where the pieces are that hold what safe mode leaves out: the first key of each, and how to fetch it. ${extraReadingPieces.length} pieces of rows by reading and ${extraFormPieces.length} of written forms. ${counts.rows.toLocaleString("en-US")} rows in the dictionary in all.`,
      type: "WordsManifest",
      name: "EXTRA_MANIFEST",
      body: `{
  source: "JMdict",
  release: ${JSON.stringify(release)},
  rowCount: ${counts.rows},
  readings: {
    starts: [${starts(extraReadingPieces)}],
    load: [
${loaders("xr", extraReadingPieces)}
    ],
  },
  forms: {
    starts: [${starts(extraFormPieces)}],
    load: [
${loaders("xf", extraFormPieces)}
    ],
  },
}`,
    }),
  );

  recordSource({ release, sha256 });
  const kb = (n) => `${(n / 1e3).toFixed(0)} kB`;
  const size = (pieces) => pieces.map((piece) => Buffer.byteLength(piece.lines.join("\n")));
  const bytes = (lines) => Buffer.byteLength(lines.join("\n"));
  console.log(`JMdict ${release}, SHA-256 ${sha256}`);
  console.log(
    `${counts.rows} rows; ${counts.cleanRows} in safe mode, ${counts.rows - counts.cleanRows} left out whole; ${counts.common} common in safe mode of ${counts.commonAll}`,
  );
  console.log(`${readingPieces.length} pieces by reading, the largest ${kb(Math.max(...size(readingPieces)))}`);
  console.log(`${formPieces.length} pieces of written forms, the largest ${kb(Math.max(...size(formPieces)))}`);
  console.log(
    `extra: ${extraReadingPieces.length} pieces of ${tables.extraReadings.length} rows ${kb(bytes(tables.extraReadings.map(([, line]) => line)))}, ${extraFormPieces.length} of ${tables.extraForms.length} forms ${kb(bytes(tables.extraForms.map(([, line]) => line)))}, ${commonPatch.length} common edits`,
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
