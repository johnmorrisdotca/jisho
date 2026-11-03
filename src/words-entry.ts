/**
 * The whole entry of a word: every sense with its part of speech, field, dialect and usage marks, its cross-references and
 * antonyms, its notes, the languages a loanword comes from and every gloss, and the marks of its written forms and readings.
 * A word carries a short row (up to four senses of three glosses); the whole entry is in pieces of its own, which are fetched
 * only when this is asked, one piece for an entry.
 */

import type {
  Entry,
  EntryGloss,
  EntryManifest,
  EntrySense,
  LoanSource,
  Reference,
  Word,
  WordsMode,
} from "./words.types.ts";
import { modeOf } from "./words-filter.ts";
import { indexed, once, pieceOf, type WordsPieceKind } from "./words-pieces.ts";

const KEY_WIDTH = 5;

/** The pieces of the whole entries: their manifest is fetched only when `loadEntry` is called. */
const entryPieces: () => Promise<EntryManifest> = once("manifest", () =>
  import("./data/words/entry-manifest.data.ts").then((one) => one.ENTRY_MANIFEST),
);

/** The pieces of the whole entries that safe mode cuts: fetched only when `loadEntry` asks for everything. */
const extraEntryPieces: () => Promise<EntryManifest> = once("manifest", () =>
  import("./data/words/entry-extra-manifest.data.ts").then((one) => one.EXTRA_ENTRY_MANIFEST),
);
/** The marks that open an optional field of a sense, and a kind of gloss: private-use characters, which no JMdict text holds. scripts/words-entries.mjs writes them. */
const mark = (n: number) => String.fromCharCode(0xe000 + n);
const [ONLY_FORMS, ONLY_READINGS, SEE_ALSO, ANTONYMS, NOTES, SOURCES] = [1, 2, 3, 4, 5, 6].map(mark) as [
  string,
  string,
  string,
  string,
  string,
  string,
];
const KIND_OF_MARK: Readonly<Record<string, EntryGloss["kind"]>> = {
  [mark(0x10)]: "lit",
  [mark(0x11)]: "expl",
  [mark(0x12)]: "fig",
  [mark(0x13)]: "tm",
};
const NOTES_BREAK = String.fromCharCode(0x2028);

const split = (text: string, by: string): readonly string[] => (text === "" ? [] : text.split(by));
const frozen = <T>(list: T[]): readonly T[] => Object.freeze(list);

/** What an entry is looked up by: its number in base 36, five characters wide. Mirrors scripts/words-entries.mjs. */
export const entryKey = (id: number): string => id.toString(36).padStart(KEY_WIDTH, "0");

function readSource(text: string): LoanSource {
  const at = text.indexOf("~");
  const flags = text.slice(0, at);
  const lang = flags.replace(/[pw]+$/, "");
  return Object.freeze({
    lang,
    text: text.slice(at + 1),
    partial: flags.slice(lang.length).includes("p"),
    wasei: flags.slice(lang.length).includes("w"),
  });
}

function readSense(field: string): EntrySense {
  const [pos = "", marks = "", ...rest] = field.split("¦");
  const optional = new Map<string, string>();
  const glosses: EntryGloss[] = [];
  for (const part of rest) {
    const first = part.charAt(0);
    if (first >= ONLY_FORMS && first <= SOURCES) optional.set(first, part.slice(1));
    else if (KIND_OF_MARK[first] !== undefined)
      glosses.push(Object.freeze({ text: part.slice(1), kind: KIND_OF_MARK[first] ?? null }));
    else glosses.push(Object.freeze({ text: part, kind: null }));
  }
  const list = (mark: string) => frozen([...split(optional.get(mark) ?? "", "|")]);
  return Object.freeze({
    pos: frozen([...split(pos, ",")]),
    marks: frozen([...split(marks, ",")]),
    glosses: frozen(glosses),
    onlyForms: list(ONLY_FORMS),
    onlyReadings: list(ONLY_READINGS),
    seeAlso: list(SEE_ALSO),
    antonyms: list(ANTONYMS),
    notes: frozen([...split(optional.get(NOTES) ?? "", NOTES_BREAK)]),
    sources: frozen(split(optional.get(SOURCES) ?? "", "|").map(readSource)),
  });
}

/**
 * An entry out of the line it is stored as. The entry and every list in it are frozen.
 *
 * @param line - One string of an entry piece: its number in base 36, its written forms, its readings, then one field for each sense.
 * @returns The entry.
 * @example
 * ```ts
 * import { readEntry } from "@johnmorrisdotca/jisho/entries";
 *
 * console.log(readEntry("0000z\t紙\tかみ\tn¦¦paper").senses[0]?.glosses[0]?.text); // paper
 * ```
 */
export function readEntry(line: string): Entry {
  const [key = "", forms = "", readings = "", ...senses] = line.split("\t");
  return Object.freeze({
    id: Number.parseInt(key, 36),
    forms: frozen(
      split(forms, "|").map((form) => {
        const [text = "", marks = ""] = form.split("~");
        return Object.freeze({ text, marks: frozen([...split(marks, ",")]) });
      }),
    ),
    readings: frozen(
      split(readings, "|").map((reading) => {
        const [text = "", marks = "", only = "", noKanji = ""] = reading.split("~");
        return Object.freeze({
          text,
          marks: frozen([...split(marks, ",")]),
          onlyForms: frozen([...split(only, ",")]),
          noKanji: noKanji === "!",
        });
      }),
    ),
    senses: frozen(senses.map(readSense)),
  });
}

/**
 * A cross-reference of a sense in its parts: JMdict writes one as the word, the reading and the number of the sense, apart by
 * "・", each of them optional (`神`, `神・かみ`, `天神・6`).
 *
 * @param text - An item of a sense's `seeAlso` or `antonyms`.
 * @returns The word to look up, its reading if it says one, and the sense number if it says one.
 * @example
 * ```ts
 * import { referenceOf } from "@johnmorrisdotca/jisho/entries";
 *
 * console.log(referenceOf("天神・6")); // { written: "天神", reading: undefined, sense: 6 }
 * console.log(referenceOf("神・かみ・1").reading); // かみ
 * ```
 */
export function referenceOf(text: string): Reference {
  const parts = text.split("・");
  const last = parts[parts.length - 1] ?? "";
  const sense = parts.length > 1 && /^\d+$/.test(last) ? Number(last) : undefined;
  if (sense !== undefined) parts.pop();
  const [written = text, reading] = parts.length > 2 ? [parts.slice(0, -1).join("・"), parts[parts.length - 1]] : parts;
  return { written, reading, sense };
}

/** The line of an entry in a set of pieces, or undefined when the set has none by that number. */
async function lineIn(kind: WordsPieceKind, manifest: EntryManifest, key: string): Promise<string | undefined> {
  const piece = await indexed(kind, manifest.entries, pieceOf(manifest.entries.starts, key), (line) =>
    line.slice(0, line.indexOf("\t")),
  );
  return piece.get(key)?.[0];
}

/**
 * The whole entry of a word, or null when JMdict has no entry by that number. In safe mode, the default, the senses JMdict marks
 * vulgar, X-rated, sensitive or derogatory are not in it and nothing that holds them is fetched; `"unfiltered"` gives the entry
 * whole. One piece of about 40 kB gzipped is fetched for an entry, and one more in unfiltered mode, kept for the next entry in it.
 *
 * @param word - A word a lookup gave, or the number of its entry.
 * @param options - `mode`, `"safe"` unless you say `"unfiltered"`; it must be the mode the word was found in.
 * @returns The entry, or null when JMdict has no entry by that number.
 * @example
 * ```ts
 * import { loadEntry } from "@johnmorrisdotca/jisho/entries";
 * import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const words = await loadWords("かみ");
 * const word = wordsOf(words, "かみ")[0];
 * if (word !== undefined) console.log((await loadEntry(word))?.senses.length);
 * ```
 */
export async function loadEntry(
  word: Pick<Word, "id"> | number,
  options: { readonly mode?: WordsMode } = {},
): Promise<Entry | null> {
  const mode = modeOf(options.mode);
  const id = typeof word === "number" ? word : word.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 0)
    throw new TypeError("loadEntry takes a word a lookup gave, or the number of an entry.");
  const key = entryKey(id);
  if (key.length > KEY_WIDTH) return null;
  const [manifest, extra] = await Promise.all([entryPieces(), mode === "unfiltered" ? extraEntryPieces() : undefined]);
  const [plain, whole] = await Promise.all([
    lineIn("entries", manifest, key),
    extra === undefined ? undefined : lineIn("extra-entries", extra, key),
  ]);
  const line = whole ?? plain;
  return line === undefined ? null : readEntry(line);
}
