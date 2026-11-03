// Writes src/data/examples/ from JMdict_e_examp (the examples EDRDG attaches to the senses of JMdict) and the Tatoeba project's exports (the authors
// of the sentences), so that every example is machine output anybody can make again and none is typed by hand.
//
//   node scripts/build-examples.mjs                     fetches the four files
//   node scripts/build-examples.mjs <folder>            reads copies already in <folder>: JMdict_e.gz, JMdict_e_examp.gz,
//                                                       jpn_sentences_detailed.tsv.bz2, eng_sentences_detailed.tsv.bz2, links.tar.bz2
//
// Each sentence is read with Jisho's own `readText` (from src/, which Node 22.18 and later runs as it is), for its furigana, its level, and to see
// whether safe mode would read it the same way. `bzip2` and `tar` must exist.
//
// The default pieces hold the examples safe mode keeps: those of a sense JMdict does not mark vulgar, X-rated, sensitive or derogatory, in a
// sentence that shows no such sense of any word and whose words safe mode finds as the words unfiltered mode does. What it leaves out goes in pieces of its own, fetched only unfiltered.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";

import { cut } from "./build-words.mjs";
import {
  examplesOfEntry,
  levelOfText,
  packExamples,
  RUBY_CLOSE,
  RUBY_OPEN,
  RUBY_START,
  rubyText,
} from "./examples-parse.mjs";
import { entriesOfDictionary, entryKey } from "./words-entries.mjs";
import { entriesOf } from "./words-parse.mjs";

const OUT = "src/data/examples";
const FILES = {
  words: ["JMdict_e.gz", "http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz"],
  examples: ["JMdict_e_examp.gz", "http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz"],
  jpn: [
    "jpn_sentences_detailed.tsv.bz2",
    "https://downloads.tatoeba.org/exports/per_language/jpn/jpn_sentences_detailed.tsv.bz2",
  ],
  eng: [
    "eng_sentences_detailed.tsv.bz2",
    "https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences_detailed.tsv.bz2",
  ],
  links: ["links.tar.bz2", "https://downloads.tatoeba.org/exports/links.tar.bz2"],
};
/** About this many bytes of examples to a piece: one lookup of a word's examples fetches one. */
const PIECE_BYTES = 48_000;

/** The file of that name in `folder`, or fetched from its address into `folder` when there is no folder. */
async function fileOf(key, folder) {
  const [name, address] = FILES[key];
  if (folder !== undefined) {
    const path = join(folder, name);
    if (!existsSync(path)) throw new Error(`No such file: ${path}`);
    return path;
  }
  mkdirSync(".cache", { recursive: true });
  const path = join(".cache", name);
  if (!existsSync(path)) {
    const response = await fetch(address, {
      headers: { "user-agent": "jisho-build (https://github.com/johnmorrisdotca/jisho)" },
    });
    if (!response.ok) throw new Error(`${address} answered ${response.status}`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  return path;
}

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

/** The lines of a bz2 file (or of the one file in a tar.bz2), read as the program decompresses them. */
async function* linesOf(path) {
  const child = path.endsWith(".tar.bz2")
    ? spawn("tar", ["-xjOf", path], { stdio: ["ignore", "pipe", "inherit"] })
    : spawn("bzip2", ["-dc", path], { stdio: ["ignore", "pipe", "inherit"] });
  yield* createInterface({ input: child.stdout, crlfDelay: Number.POSITIVE_INFINITY });
}

/** The author of each wanted Japanese sentence, from the detailed export: sentence, language, text, user, added, changed. */
async function japaneseAuthors(path, wanted) {
  const authors = new Map();
  for await (const line of linesOf(path)) {
    const [id, , , user] = line.split("\t");
    if (wanted.has(Number(id)) && user !== undefined && user !== "\\N") authors.set(Number(id), user);
  }
  return authors;
}

/** The translations of each wanted Japanese sentence, from the links export: sentence, translation. */
async function translationsOf(path, wanted) {
  const found = new Map();
  for await (const line of linesOf(path)) {
    const [from, to] = line.split("\t");
    if (!wanted.has(Number(from))) continue;
    found.set(Number(from), [...(found.get(Number(from)) ?? []), Number(to)]);
  }
  return found;
}

/** The text and author of each wanted English sentence. */
async function englishSentences(path, wanted) {
  const found = new Map();
  for await (const line of linesOf(path)) {
    const [id, , text, user] = line.split("\t");
    if (wanted.has(Number(id))) found.set(Number(id), { text, user: user === "\\N" ? undefined : user });
  }
  return found;
}

const LICENCE = ` * The sentences are from the Tatoeba project (https://tatoeba.org), under the Creative Commons Attribution 2.0 France licence (CC BY 2.0 FR,
 * https://creativecommons.org/licenses/by/2.0/fr/), each with its author's name. The links from a sense of a word to the sentences that show it are
 * JMdict_e_examp's, of the Electronic Dictionary Research and Development Group, under the Creative Commons Attribution-ShareAlike 4.0 licence
 * and the Group's conditions: https://www.edrdg.org/edrdg/licence.html. This table is derived from them.`;

const literal = (lines) => lines.map((line) => `    ${JSON.stringify(line)},`).join("\n");
const dataFile = ({ summary, imports, type, name, body }) => `${imports}
/**
 * ${summary} Written by \`scripts/build-examples.mjs\`, never edited by hand.
 *
${LICENCE}
 */
export const ${name}: ${type} = ${body};
`;
const pad = (at, count) => String(at).padStart(String(count - 1).length, "0");

function writeSet({ prefix, pieces, summary, manifestFile, manifestName, manifestSummary, release }) {
  for (const [at, piece] of pieces.entries()) {
    writeFileSync(
      `${OUT}/${prefix}${pad(at, pieces.length)}.data.ts`,
      dataFile({
        imports: `import type { WordsPiece } from "../../words.types.ts";\n`,
        summary: `${summary} Piece ${at + 1} of ${pieces.length}, from ${JSON.stringify(piece.start)}.`,
        type: "WordsPiece",
        name: "PIECE",
        body: `{\n  rows: [\n${literal(piece.lines)}\n  ],\n}`,
      }),
    );
  }
  writeFileSync(
    `${OUT}/${manifestFile}`,
    dataFile({
      imports: `import type { EntryManifest } from "../../words.types.ts";\n`,
      summary: manifestSummary,
      type: "EntryManifest",
      name: manifestName,
      body: `{
  source: "JMdict_e_examp and Tatoeba",
  release: ${JSON.stringify(release)},
  entries: {
    starts: [${pieces.map((piece) => JSON.stringify(piece.start)).join(", ")}],
    load: [
${pieces.map((_piece, at) => `      () => import("./${prefix}${pad(at, pieces.length)}.data.ts").then((one) => one.PIECE),`).join("\n")}
    ],
  },
}`,
    }),
  );
}

async function main() {
  const folder = process.argv[2];
  const paths = Object.fromEntries(
    await Promise.all(Object.keys(FILES).map(async (key) => [key, await fileOf(key, folder)])),
  );
  const sourceXml = gunzipSync(readFileSync(paths.examples)).toString("utf8");
  const release = /<!-- JMdict created: (\d{4}-\d{2}-\d{2}) -->/.exec(sourceXml)?.[1];
  if (release === undefined) throw new Error("No release date in JMdict_e_examp.");

  // Which senses of which entries safe mode leaves out, from the English file the words were made from.
  const unfit = new Map();
  for (const one of entriesOfDictionary(entriesOf(gunzipSync(readFileSync(paths.words)).toString("utf8")))) {
    unfit.set(one.id, new Set(one.senses.filter((sense) => sense.unfit).map((sense) => sense.number)));
  }

  const examples = entriesOf(sourceXml).flatMap(examplesOfEntry);
  const sentences = new Set(examples.map((one) => one.source));
  // A sentence JMdict_e_examp links to a sense safe mode leaves out shows that sense wherever else it is linked: it is out of every default piece.
  const showsUnfit = new Set(examples.filter((one) => unfit.get(one.id)?.has(one.sense)).map((one) => one.source));
  console.log(`${examples.length} examples of ${sentences.size} sentences`);
  const authors = await japaneseAuthors(paths.jpn, sentences);
  const translations = await translationsOf(paths.links, sentences);
  const english = await englishSentences(paths.eng, new Set([...translations.values()].flat()));

  const { readText } = await import(pathToFileURL("src/words.ts").href);
  const { cacheLimit } = await import(pathToFileURL("src/words-pieces.ts").href);
  const { levelOf } = await import(pathToFileURL("src/index.ts").href);
  const { JLPT } = await import(pathToFileURL("src/data/jlpt.data.ts").href);
  cacheLimit.pieces = 600;

  // Each sentence once: its ruby, its level, and whether safe mode reads it as unfiltered mode does.
  const made = new Map();
  for (const one of examples) {
    if (made.has(one.japanese)) continue;
    const text = one.japanese;
    if ([RUBY_OPEN, RUBY_CLOSE, RUBY_START].some((mark) => text.includes(mark)))
      throw new Error(`A ruby mark in a sentence: ${text}`);
    const whole = await readText(text, { mode: "unfiltered" });
    const safe = await readText(text, { mode: "safe" });
    const alike =
      whole.tokens.length === safe.tokens.length &&
      whole.tokens.every((token, at) => token.text === safe.tokens[at]?.text && token.kind === safe.tokens[at]?.kind);
    made.set(text, {
      // The furigana belong to the text readText made plain; a sentence it changed (full-width digits) is shown with none.
      ruby: whole.text === text ? rubyText(whole.tokens.flatMap((token) => token.furigana)) : text,
      level: levelOfText(text, (kanji) => levelOf(JLPT, kanji)),
      safe: alike,
    });
  }

  const full = new Map();
  const kept = new Map();
  const seen = new Set();
  let withAuthor = 0;
  for (const one of examples) {
    const key = `${one.id}:${one.sense}:${one.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const reading = made.get(one.japanese);
    const wanted = (translations.get(one.source) ?? [])
      .map((id) => english.get(id))
      .find((sentence) => sentence?.text === one.english);
    const example = {
      ...one,
      ruby: reading.ruby,
      level: reading.level,
      japaneseAuthor: authors.get(one.source),
      englishAuthor: wanted?.user,
    };
    if (example.japaneseAuthor !== undefined && example.englishAuthor !== undefined) withAuthor++;
    full.set(one.id, [...(full.get(one.id) ?? []), example]);
    if (reading.safe && !showsUnfit.has(one.source) && unfit.has(one.id) && !unfit.get(one.id).has(one.sense))
      kept.set(one.id, [...(kept.get(one.id) ?? []), example]);
  }
  console.log(
    `${full.size} entries have examples, ${kept.size} in safe mode; ${withAuthor} of ${seen.size} have both authors`,
  );

  const ids = [...full.keys()].sort((a, b) => a - b);
  const lines = (map, which) =>
    which.filter((id) => map.has(id)).map((id) => [entryKey(id), packExamples(id, map.get(id))]);
  const same = (id) => JSON.stringify(full.get(id)) === JSON.stringify(kept.get(id));
  const defaultPieces = cut(lines(kept, ids), PIECE_BYTES);
  const extraPieces = cut(
    lines(
      full,
      ids.filter((id) => !same(id)),
    ),
    PIECE_BYTES,
  );

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  writeSet({
    prefix: "s",
    pieces: defaultPieces,
    summary:
      "The example sentences of JMdict that safe mode keeps, by the number of the entry in base 36: each line is the entry's number, then each example, apart by tabs. An example is the number of the sense it shows, the sentence with the kana that read each kanji marked ｜kanji《かな》, the English, the JLPT level of its kanji (5 to 1), the Tatoeba number in base 36, the authors of the two sentences and the form of the word in the sentence, apart by ¦.",
    manifestFile: "example-manifest.data.ts",
    manifestName: "EXAMPLE_MANIFEST",
    manifestSummary: `Where the pieces of the example sentences are: the first number of each, and how to fetch it. ${defaultPieces.length} pieces.`,
    release,
  });
  writeSet({
    prefix: "xs",
    pieces: extraPieces,
    summary:
      "The whole list of examples, as JMdict_e_examp has it, for each entry whose list is not the same in safe mode, in the same format. Only for a lookup that asks for everything.",
    manifestFile: "example-extra-manifest.data.ts",
    manifestName: "EXTRA_EXAMPLE_MANIFEST",
    manifestSummary: `Where the pieces are of the example lists that safe mode cuts: the first number of each, and how to fetch it. ${extraPieces.length} pieces. Only for a lookup that asks for everything.`,
    release,
  });
  recordSources(paths, release);
  const kb = (pieces) =>
    `${(Math.max(...pieces.map((piece) => Buffer.byteLength(piece.lines.join("\n")))) / 1e3).toFixed(0)} kB`;
  console.log(
    `${defaultPieces.length} pieces, the largest ${kb(defaultPieces)}; ${extraPieces.length} extra, the largest ${kb(extraPieces)}`,
  );
}

/** Notes the files used in data-sources/sources.json: each one's address and SHA-256. */
function recordSources(paths, release) {
  const file = "data-sources/sources.json";
  const sources = JSON.parse(readFileSync(file, "utf8"));
  const date = new Date().toISOString().slice(0, 10);
  sources.jmdictExamples = {
    address: FILES.examples[1],
    terms: "https://www.edrdg.org/edrdg/licence.html",
    licence: "CC BY-SA 4.0 and the Group's conditions; the sentences are Tatoeba's, CC BY 2.0 FR",
    dateOfCreation: release,
    sha256: sha256(paths.examples),
    retrieved: date,
  };
  sources.tatoeba = {
    site: "https://tatoeba.org",
    terms: "https://tatoeba.org/en/terms_of_use",
    licence: "CC BY 2.0 FR",
    note: "Read for the authors of the sentences; the sentences themselves are those JMdict_e_examp holds.",
    retrieved: date,
    files: Object.fromEntries(
      ["jpn", "eng", "links"].map((key) => [FILES[key][0], { address: FILES[key][1], sha256: sha256(paths[key]) }]),
    ),
  };
  writeFileSync(file, `${JSON.stringify(sources, null, 2)}\n`);
}

if (process.argv[1]?.endsWith("build-examples.mjs")) await main();
