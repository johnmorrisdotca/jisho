/**
 * The example sentences of a word, each linked to the sense it shows: the Japanese with its furigana, the English, the JLPT level of its
 * kanji and its credit. They are in pieces of their own, one fetched for a word, from an entry point of their own so that a page
 * that does not ask for them never carries them.
 */

import type { FuriganaPart } from "./furigana.ts";
import type { JlptLevel } from "./index.ts";
import type { EntryManifest, Example, ExampleCredit, Word, WordsMode } from "./words.types.ts";
import { modeOf } from "./words-filter.ts";
import { ENTRY_KEY_WIDTH, entryKey, indexed, once, pieceOf, type WordsPieceKind } from "./words-pieces.ts";

const exampleManifest: () => Promise<EntryManifest> = once("manifest", () =>
  import("./data/examples/example-manifest.data.ts").then((one) => one.EXAMPLE_MANIFEST),
);
const extraExampleManifest: () => Promise<EntryManifest> = once("manifest", () =>
  import("./data/examples/example-extra-manifest.data.ts").then((one) => one.EXTRA_EXAMPLE_MANIFEST),
);

const RUBY = /｜([^《]+)《([^》]+)》/g;

/**
 * A sentence stored with its furigana marked ｜kanji《かな》 as pieces: the text and the kana over the kanji.
 *
 * @param text - A sentence as the data stores it.
 * @returns The pieces, which put together are the sentence; the whole sentence in one piece when it has no furigana.
 * @example
 * ```ts
 * import { furiganaOfExample } from "@johnmorrisdotca/jisho/examples";
 *
 * console.log(furiganaOfExample("｜私《わたし》は｜走《はし》る")); // [{ text: "私", reading: "わたし" }, { text: "は" }, ...]
 * ```
 */
export function furiganaOfExample(text: string): FuriganaPart[] {
  const parts: FuriganaPart[] = [];
  let from = 0;
  for (const match of text.matchAll(RUBY)) {
    if (match.index > from) parts.push({ text: text.slice(from, match.index) });
    parts.push({ text: match[1] ?? "", reading: match[2] ?? "" });
    from = match.index + match[0].length;
  }
  if (from < text.length || parts.length === 0) parts.push({ text: text.slice(from) });
  return parts;
}

/**
 * The examples of an entry as stored: its number in base 36, then each example, apart by tabs. An example is its sense, the sentence with
 * its furigana, the English, the level (5 to 1, or empty), the Tatoeba number in base 36, the two authors and the form of the word
 * in the sentence, apart by "¦".
 *
 * @param line - One string of an example piece.
 * @returns The examples of the line, frozen, the number of the entry they are of first.
 * @example
 * ```ts
 * import { readExamples } from "@johnmorrisdotca/jisho/examples";
 *
 * const line = "0000z\t1¦｜私《わたし》は走る¦I run.¦5¦3fk¦alice¦bob¦走る";
 * console.log(readExamples(line).examples[0]?.english); // I run.
 * ```
 */
export function readExamples(line: string): { readonly id: number; readonly examples: readonly Example[] } {
  const [key = "", ...fields] = line.split("\t");
  return Object.freeze({
    id: Number.parseInt(key, 36),
    examples: Object.freeze(
      fields.map((field) => {
        const [
          sense = "",
          ruby = "",
          english = "",
          level = "",
          source = "",
          japanese = "",
          translator = "",
          headword = "",
        ] = field.split("¦");
        const credit: ExampleCredit = Object.freeze({
          id: Number.parseInt(source, 36),
          japanese: japanese === "" ? null : japanese,
          english: translator === "" ? null : translator,
        });
        return Object.freeze({
          sense: Number(sense),
          japanese: ruby.replace(RUBY, "$1"),
          furigana: Object.freeze(furiganaOfExample(ruby)),
          english,
          level: level === "" ? null : (`N${level}` as JlptLevel),
          headword,
          credit,
        });
      }),
    ),
  });
}

async function lineIn(kind: WordsPieceKind, manifest: EntryManifest, key: string): Promise<string | undefined> {
  const piece = await indexed(kind, manifest.entries, pieceOf(manifest.entries.starts, key), (line) =>
    line.slice(0, line.indexOf("\t")),
  );
  return piece.get(key)?.[0];
}

/**
 * The example sentences of a word, each with the number of the sense of the word it shows (`Entry.senses[].number`), its furigana, its English,
 * the JLPT level of its kanji, the word as the sentence has it, and its credit. An empty list for a word with no example. In safe mode, the
 * default, an example of a sense JMdict marks vulgar, X-rated, sensitive or derogatory is left out, and so is a sentence in which safe mode
 * does not find the words that unfiltered mode does, and nothing that holds them is fetched; `"unfiltered"` gives every example, from one more
 * piece. One piece of about 20 kB gzipped is fetched for a word.
 *
 * @param word - A word a lookup gave, or the number of its entry.
 * @param options - `mode`, `"safe"` unless you say `"unfiltered"`, and `sense`, to keep the examples of one sense (the number of `Entry.senses[].number`).
 * @returns The examples, in the order of their senses; none when the word has none.
 * @example
 * ```ts
 * import { loadExamples } from "@johnmorrisdotca/jisho/examples";
 * import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * const word = wordsOf(await loadWords("犬"), "犬")[0];
 * if (word !== undefined) console.log((await loadExamples(word))[0]?.english);
 * ```
 */
export async function loadExamples(
  word: Pick<Word, "id"> | number,
  options: { readonly mode?: WordsMode; readonly sense?: number } = {},
): Promise<readonly Example[]> {
  const mode = modeOf(options.mode);
  const id = typeof word === "number" ? word : word.id;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 0)
    throw new TypeError("loadExamples takes a word a lookup gave, or the number of an entry.");
  const key = entryKey(id);
  if (key.length > ENTRY_KEY_WIDTH) return [];
  const [manifest, extra] = await Promise.all([
    exampleManifest(),
    mode === "unfiltered" ? extraExampleManifest() : undefined,
  ]);
  const [plain, whole] = await Promise.all([
    lineIn("examples", manifest, key),
    extra === undefined ? undefined : lineIn("extra-examples", extra, key),
  ]);
  const line = whole ?? plain;
  const examples = line === undefined ? [] : readExamples(line).examples;
  return options.sense === undefined ? examples : examples.filter((one) => one.sense === options.sense);
}

/**
 * The credit an example carries, as a line to show with it: the Tatoeba sentence, the authors of the Japanese and of the English, and the licence.
 *
 * @param example - An example.
 * @returns A line such as "Tatoeba #162365, Japanese by alice, English by bob (CC BY 2.0 FR)".
 * @example
 * ```ts
 * import { exampleCredit, readExamples } from "@johnmorrisdotca/jisho/examples";
 *
 * const [one] = readExamples("0000z\t1¦走る¦I run.¦¦3fk¦alice¦bob¦走る").examples;
 * console.log(one === undefined ? "" : exampleCredit(one)); // Tatoeba #4448, Japanese by alice, English by bob (CC BY 2.0 FR)
 * ```
 */
export function exampleCredit(example: Pick<Example, "credit">): string {
  const { id, japanese, english } = example.credit;
  const by = [
    japanese === null ? "" : `Japanese by ${japanese}`,
    english === null ? "" : `English by ${english}`,
  ].filter((part) => part !== "");
  return `Tatoeba #${id}${by.length === 0 ? "" : `, ${by.join(", ")}`} (CC BY 2.0 FR)`;
}
