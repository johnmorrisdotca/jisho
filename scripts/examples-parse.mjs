// The example sentences of JMdict_e_examp, the file EDRDG makes from JMdict and the Tatoeba project's Japanese-English pairs (once
// the Tanaka corpus): each is attached to the sense of an entry it shows. Pure functions over the file's text and over what the
// Tatoeba exports say of each sentence, so a test can hold them to small inputs and `scripts/build-examples.mjs` only has to
// fetch and write. See docs/guides/examples.md for the format.
import { entryKey } from "./words-entries.mjs";

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
const tag = (body, name, extra = "") =>
  [...body.matchAll(new RegExp(`<${name}${extra}[^>]*>([\\s\\S]*?)</${name}>`, "g"))].map((match) =>
    decode(match[1].trim()),
  );

/** Between the examples of an entry, the fields of an example, and around the kana that read a kanji. Characters Tatoeba's text does not hold. */
export const EXAMPLE_FIELD = "¦";
export const RUBY_OPEN = "《";
export const RUBY_CLOSE = "》";
export const RUBY_START = "｜";

/**
 * Every example of a JMdict_e_examp entry: the entry's number, the number of the sense it shows (counting every sense of the entry, as a
 * cross-reference does), the Tatoeba number of the Japanese sentence, the form of the word as the sentence has it, and both sentences.
 */
export function examplesOfEntry(entry) {
  const id = Number(/<ent_seq>(\d+)<\/ent_seq>/.exec(entry)?.[1] ?? Number.NaN);
  if (Number.isNaN(id)) return [];
  const found = [];
  for (const [at, sense] of entry.split("<sense>").slice(1).entries()) {
    for (const example of sense.split("<example>").slice(1)) {
      const japanese = tag(example, "ex_sent", ' xml:lang="jpn"')[0];
      const english = tag(example, "ex_sent", ' xml:lang="eng"')[0];
      const source = /<ex_srce exsrc_type="tat">(\d+)<\/ex_srce>/.exec(example)?.[1];
      if (japanese === undefined || english === undefined || source === undefined || japanese === "" || english === "")
        continue;
      found.push({
        id,
        sense: at + 1,
        source: Number(source),
        headword: tag(example, "ex_text")[0] ?? "",
        japanese,
        english,
      });
    }
  }
  return found;
}

/** The hardest JLPT level among the kanji of a text as a number, 5 (N5) to 1 (N1): 5 for a text with no kanji, and null when a kanji is on no list. */
export function levelOfText(text, levelOfKanji) {
  let hardest = 5;
  for (const character of text.match(/[㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{2FA1F}]/gu) ?? []) {
    const level = levelOfKanji(character);
    if (level === null) return null;
    hardest = Math.min(hardest, Number(level.slice(1)));
  }
  return hardest;
}

/** A sentence with the kanji that have furigana marked ｜kanji《かな》, from the furigana of `readText`; the text itself when there are none. */
export function rubyText(parts) {
  return parts
    .map((part) =>
      part.reading === undefined ? part.text : `${RUBY_START}${part.text}${RUBY_OPEN}${part.reading}${RUBY_CLOSE}`,
    )
    .join("");
}

const refuse = (what, text) => {
  if (text.includes(EXAMPLE_FIELD) || /[\t\n]/.test(text)) throw new Error(`A separator in ${what}: ${text}`);
  return text;
};

/**
 * An example as one field: the sense it shows, the sentence with its ruby, the English, the level (5 to 1, or empty), the Tatoeba number in base 36,
 * the authors of the two sentences, and the form of the word as the sentence has it.
 */
export function packExample(example) {
  return [
    String(example.sense),
    refuse("a sentence", example.ruby),
    refuse("a translation", example.english),
    example.level === null ? "" : String(example.level),
    example.source.toString(36),
    refuse("an author", example.japaneseAuthor ?? ""),
    refuse("an author", example.englishAuthor ?? ""),
    refuse("a headword", example.headword),
  ].join(EXAMPLE_FIELD);
}

/** The examples of one entry as one line: its number in base 36, then each example, apart by tabs. */
export const packExamples = (id, examples) => [entryKey(id), ...examples.map(packExample)].join("\t");
