// The whole entry of JMdict, for the words that have one: every sense with its part of speech, field, dialect and usage marks,
// its cross-references and antonyms, its notes, the languages a loanword comes from, every gloss, and which written forms and
// readings it is limited to; and the marks of the written forms and readings. Pure functions over the dictionary's text, like
// words-parse.mjs, which makes the short rows of the same entries. See docs/guides/entries.md for the format.
import { SAFE_MARKS } from "./words-parse.mjs";

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
const tags = (body, name) =>
  [...body.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "g"))].map((match) => match[1]);
const code = (text) => text.replace(/^&|;$/g, "");
const OUT_IN_SAFE_MODE = new Set(SAFE_MARKS);

/** Between the fields of an entry's line; the fields of a sense; a list in a field; the parts of an item of a list. Characters no JMdict text holds. */
export const ENTRY_BREAK = "\t";
export const SENSE_FIELD = "¦";
export const LIST_BREAK = "|";
export const PART_BREAK = "~";
/** Between the notes of a sense, which are free text and may hold any other mark. */
export const NOTE_BREAK = "\u2028";
const TYPES = { lit: "l", expl: "e", fig: "f", tm: "t" };

/** The sequence number JMdict gives an entry. */
export function idOf(entry) {
  return Number(/<ent_seq>(\d+)<\/ent_seq>/.exec(entry)?.[1] ?? Number.NaN);
}

/** One sense of an entry, whole. */
function senseOf(body) {
  const glosses = [...body.matchAll(/<gloss(\s[^>]*)?>([\s\S]*?)<\/gloss>/g)].map((match) => ({
    text: decode(match[2].trim()),
    type: TYPES[/g_type="(\w+)"/.exec(match[1] ?? "")?.[1]] ?? "",
  }));
  const marks = [...new Set(["misc", "field", "dial"].flatMap((name) => tags(body, name).map(code)))];
  const sources = [...body.matchAll(/<lsource(\s[^>]*)?>([\s\S]*?)<\/lsource>|<lsource(\s[^>]*)?\/>/g)].map((match) => {
    const attributes = match[1] ?? match[3] ?? "";
    return {
      lang: /xml:lang="(\w+)"/.exec(attributes)?.[1] ?? "eng",
      part: /ls_type="part"/.test(attributes),
      wasei: /ls_wasei="y"/.test(attributes),
      text: decode((match[2] ?? "").trim()),
    };
  });
  return {
    pos: tags(body, "pos").map(code),
    marks,
    onlyForms: tags(body, "stagk").map(decode),
    onlyReadings: tags(body, "stagr").map(decode),
    seeAlso: tags(body, "xref").map(decode),
    antonyms: tags(body, "ant").map(decode),
    notes: tags(body, "s_inf").map(decode),
    sources,
    glosses: glosses.filter((gloss) => gloss.text !== ""),
    unfit: marks.some((one) => OUT_IN_SAFE_MODE.has(one)),
  };
}

/**
 * An entry of JMdict, whole: its number, its written forms and readings with their notes, and its senses.
 *
 * @returns The entry, or null for one with no reading or no sense with a gloss.
 */
export function entryOf(entry) {
  const forms = tags(entry, "k_ele")
    .map((body) => ({ text: decode(tags(body, "keb")[0] ?? ""), info: tags(body, "ke_inf").map(code) }))
    .filter((form) => form.text !== "");
  const readings = tags(entry, "r_ele")
    .map((body) => ({
      text: decode(tags(body, "reb")[0] ?? ""),
      info: tags(body, "re_inf").map(code),
      only: tags(body, "re_restr").map(decode),
      noKanji: body.includes("<re_nokanji/>"),
    }))
    .filter((reading) => reading.text !== "");
  const senses = tags(entry, "sense")
    .map((body, at) => ({ ...senseOf(body), number: at + 1 }))
    .filter((sense) => sense.glosses.length > 0);
  const id = idOf(entry);
  if (readings.length === 0 || senses.length === 0 || Number.isNaN(id)) return null;
  return { id, forms, readings, senses };
}

/** A text that is to go in a field, refused if it holds the character that would end its field or its list (`~` only matters before the last part). */
const refuse = (what, text, forbidden = /[\t\n¦|]/) => {
  if (forbidden.test(text)) throw new Error(`A separator in ${what}: ${text}`);
  return text;
};
const TEXT = /[\t\n¦]/;

/** The marks that start an optional field of a sense or the kind of a gloss: private-use characters, which no JMdict text holds. */
export const MARKS = {
  onlyForms: "\uE001",
  onlyReadings: "\uE002",
  seeAlso: "\uE003",
  antonyms: "\uE004",
  notes: "\uE005",
  sources: "\uE006",
  number: "\uE007",
  lit: "\uE010",
  expl: "\uE011",
  fig: "\uE012",
  tm: "\uE013",
};
const KIND_MARK = { l: MARKS.lit, e: MARKS.expl, f: MARKS.fig, t: MARKS.tm };
const NO_MARK = /[\uE000-\uF8FF]/;

/** A sense as one field: its parts of speech, then its marks, then its glosses (a kind of gloss opens with its mark), then each optional field it has. */
const packSense = (sense, at) => {
  const optional = (mark, items, text = TEXT_OR_LIST) =>
    items.length === 0
      ? []
      : [`${mark}${items.map((one) => refuse("a field of a sense", one, text)).join(LIST_BREAK)}`];
  const sources = sense.sources.map(
    (one) =>
      `${refuse("a source language", one.lang)}${one.part ? "p" : ""}${one.wasei ? "w" : ""}${PART_BREAK}${refuse("a source word", one.text)}`,
  );
  const glosses = sense.glosses.map(
    (gloss) => `${KIND_MARK[gloss.type] ?? ""}${refuse("a gloss", noMark(gloss.text), TEXT)}`,
  );
  return [
    sense.pos.join(","),
    sense.marks.join(","),
    ...glosses,
    ...optional(MARKS.onlyForms, sense.onlyForms),
    ...optional(MARKS.onlyReadings, sense.onlyReadings),
    ...optional(MARKS.seeAlso, sense.seeAlso),
    ...optional(MARKS.antonyms, sense.antonyms),
    ...(sense.notes.length === 0
      ? []
      : [`${MARKS.notes}${sense.notes.map((one) => refuse("a note", noMark(one), TEXT)).join(NOTE_BREAK)}`]),
    ...(sources.length === 0 ? [] : [`${MARKS.sources}${sources.join(LIST_BREAK)}`]),
    ...(sense.number === at + 1 ? [] : [`${MARKS.number}${sense.number}`]),
  ].join(SENSE_FIELD);
};
const noMark = (text) => {
  if (NO_MARK.test(text)) throw new Error(`A private-use character in ${text}`);
  return text;
};
const TEXT_OR_LIST = /[\t\n¦|\uE000-\uF8FF]/;

/**
 * An entry as one line: its number in base 36, its written forms (each the form, then its marks), its readings (each the reading,
 * its marks, the written forms it is limited to, and `!` when it has no kanji), then one field for each sense.
 */
export function packEntry(entry) {
  const forms = entry.forms
    .map((form) => `${refuse("a form", form.text)}${form.info.length > 0 ? `${PART_BREAK}${form.info.join(",")}` : ""}`)
    .join(LIST_BREAK);
  const readings = entry.readings
    .map((reading) => {
      const parts = [
        refuse("a reading", reading.text),
        reading.info.join(","),
        reading.only.map((one) => refuse("a limit", one)).join(","),
        reading.noKanji ? "!" : "",
      ];
      while (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
      return parts.join(PART_BREAK);
    })
    .join(LIST_BREAK);
  return [entryKey(entry.id), forms, readings, ...entry.senses.map((sense, at) => packSense(sense, at))].join(
    ENTRY_BREAK,
  );
}

/**
 * The entry as safe mode has it: the senses marked vulgar, X-rated, sensitive or derogatory left out, and with them the written
 * forms and the readings that only such senses apply to. Null when no sense is left.
 */
export function cleanEntry(entry) {
  const senses = entry.senses.filter((sense) => !sense.unfit);
  if (senses.length === 0) return null;
  if (senses.length === entry.senses.length) return entry;
  const fitForm = (text) => senses.some((sense) => sense.onlyForms.length === 0 || sense.onlyForms.includes(text));
  const fitReading = (text) =>
    senses.some((sense) => sense.onlyReadings.length === 0 || sense.onlyReadings.includes(text));
  return {
    ...entry,
    forms: entry.forms.filter((form) => fitForm(form.text)),
    readings: entry.readings.filter((reading) => fitReading(reading.text)),
    senses,
  };
}

/** What an entry is looked up by: its number in base 36, five characters wide, so that the keys sort as the numbers do. */
export const entryKey = (id) => id.toString(36).padStart(5, "0");

/** Every entry of a dictionary, in the order of its sequence numbers. */
export function entriesOfDictionary(entries) {
  return entries
    .map(entryOf)
    .filter((one) => one !== null)
    .sort((a, b) => a.id - b.id);
}
