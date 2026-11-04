// Writes src/data/strokes/ from KanjiVG, so that the stroke order of every kanji is machine output anybody can make again,
// in pieces of about 48 kB (20 kB gzipped), each holding some kanji, so that the stroke order of one kanji is one small fetch.
//
//   node scripts/build-strokes.mjs                    fetches KanjiVG's release
//   node scripts/build-strokes.mjs kanjivg-main.zip   reads a copy already here
//
// KanjiVG (https://kanjivg.tagaini.net, Ulrich Apel and its contributors) draws each kanji as one SVG path for each stroke, in the order the strokes
// are written. It is under the Creative Commons Attribution-Share Alike 3.0 licence, which asks every file made from it to say so in its own header and
// to link to KanjiVG's website: the data file does. This keeps the paths of the kanji of Jisho's table and nothing else.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { cut } from "./build-words.mjs";

const RELEASE = "r20260714";
const URL_OF_ZIP = `https://github.com/KanjiVG/kanjivg/releases/download/${RELEASE}/kanjivg-${RELEASE.slice(1)}-main.zip`;
const OUT = "src/data/strokes";
/** About this many bytes of paths to a piece. */
const PIECE_BYTES = 48_000;

async function zipBytes() {
  const given = process.argv[2];
  if (given !== undefined) {
    if (!existsSync(given)) throw new Error(`No such file: ${given}`);
    return readFileSync(given);
  }
  const response = await fetch(URL_OF_ZIP, {
    headers: { "user-agent": "jisho-build (https://github.com/johnmorrisdotca/jisho)" },
  });
  if (!response.ok) throw new Error(`${URL_OF_ZIP} answered ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** The paths of a KanjiVG file, the strokes in the order they are written (the ids end in -s1, -s2…). */
export function pathsOfSvg(svg) {
  return [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s(\d+)"[^>]* d="([^"]*)"/g)]
    .map((match) => ({ at: Number(match[1]), d: match[2] }))
    .sort((a, b) => a.at - b.at)
    .map((one) => one.d);
}

async function main() {
  const bytes = await zipBytes();
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const work = mkdtempSync(join(tmpdir(), "jisho-kanjivg-"));
  try {
    mkdirSync(work, { recursive: true });
    writeFileSync(join(work, "kanjivg.zip"), bytes);
    const unzipped = spawnSync("unzip", ["-qo", join(work, "kanjivg.zip"), "-d", work]);
    if (unzipped.status !== 0) throw new Error(`unzip failed: ${unzipped.stderr}`);
    const { KANJI } = await import(pathToFileURL("src/data/kanji.data.ts").href);
    const paths = {};
    const missing = [];
    const counted = [];
    for (const row of KANJI.rows) {
      const kanji = row[0];
      // A compatibility ideograph (神 as U+FA19) is drawn as the character it stands for.
      const file = join(work, "kanji", `${kanji.normalize("NFKC").codePointAt(0).toString(16).padStart(5, "0")}.svg`);
      if (!existsSync(file)) {
        missing.push(kanji);
        continue;
      }
      const strokes = pathsOfSvg(readFileSync(file, "utf8"));
      if (strokes.length === 0) missing.push(kanji);
      else {
        paths[kanji] = strokes.join("|");
        if (strokes.length !== row[1]) counted.push(kanji);
      }
    }
    writePieces(paths, RELEASE);
    writeSource(sha256);
    console.log(
      `${Object.keys(paths).length} kanji, ${missing.length} without strokes${missing.length > 0 ? `: ${missing.join("")}` : ""}; ${counted.length} where KanjiVG and KANJIDIC2 count the strokes differently${counted.length > 0 ? `: ${counted.join("")}` : ""}`,
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

const LICENCE = ` * Made from KanjiVG (https://kanjivg.tagaini.net), copyright Ulrich Apel and its contributors, which is distributed under the Creative
 * Commons Attribution-Share Alike 3.0 licence (https://creativecommons.org/licenses/by-sa/3.0/). This table is derived from it and is under
 * the same licence: you are free to share and adapt it, with attribution to KanjiVG and a link to its website, and any work you make from it
 * may be distributed only under the same or a similar licence.`;

const literal = (lines) => lines.map((line) => `    ${JSON.stringify(line)},`).join("\n");
const file = ({ summary, imports, type, name, body }) => `${imports}
/**
 * ${summary} Written by \`scripts/build-strokes.mjs\` from KanjiVG ${RELEASE}, never edited by hand.
 *
${LICENCE}
 */
export const ${name}: ${type} = ${body};
`;
const pad = (at, count) => String(at).padStart(String(count - 1).length, "0");

/** Each kanji as one line, kanji then its paths apart by "|", cut into pieces by kanji. */
function writePieces(paths, release) {
  const sorted = Object.entries(paths)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([kanji, strokes]) => [kanji, `${kanji}\t${strokes}`]);
  const pieces = cut(sorted, PIECE_BYTES);
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const [at, piece] of pieces.entries()) {
    writeFileSync(
      `${OUT}/t${pad(at, pieces.length)}.data.ts`,
      file({
        imports: `import type { WordsPiece } from "../../words.types.ts";\n`,
        summary: `The strokes of some kanji, in the order they are written, each line the kanji and then the SVG paths KanjiVG draws its strokes with, apart by "|", in a square of 109 by 109. Piece ${at + 1} of ${pieces.length}, from ${JSON.stringify(piece.start)}.`,
        type: "WordsPiece",
        name: "PIECE",
        body: `{\n  rows: [\n${literal(piece.lines)}\n  ],\n}`,
      }),
    );
  }
  writeFileSync(
    `${OUT}/stroke-manifest.data.ts`,
    file({
      imports: `import type { EntryManifest } from "../../words.types.ts";\n`,
      summary: `Where the pieces of the strokes are: the first kanji of each, and how to fetch it. ${pieces.length} pieces of ${sorted.length.toLocaleString("en-US")} kanji.`,
      type: "EntryManifest",
      name: "STROKES_MANIFEST",
      body: `{
  source: "KanjiVG",
  release: ${JSON.stringify(release)},
  entries: {
    starts: [${pieces.map((piece) => JSON.stringify(piece.start)).join(", ")}],
    load: [
${pieces.map((_piece, at) => `      () => import("./t${pad(at, pieces.length)}.data.ts").then((one) => one.PIECE),`).join("\n")}
    ],
  },
}`,
    }),
  );
}

function writeSource(sha256) {
  const file = "data-sources/sources.json";
  const sources = JSON.parse(readFileSync(file, "utf8"));
  sources.kanjivg = {
    address: URL_OF_ZIP,
    site: "https://kanjivg.tagaini.net",
    terms: "https://github.com/KanjiVG/kanjivg#readme",
    licence: "CC BY-SA 3.0",
    release: RELEASE,
    sha256,
    retrieved: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(file, `${JSON.stringify(sources, null, 2)}\n`);
}

if (process.argv[1]?.endsWith("build-strokes.mjs")) await main();
