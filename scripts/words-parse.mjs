// Reads JMdict into the rows of the words tables. Pure functions over the dictionary's text, so a test can hold them to real entries
// and `scripts/build-words.mjs` only has to fetch the file and write what these return. Nothing here reads a file or a network.
//
// One row is one reading of one entry: the reading, the written forms that go with it, flags, and its senses, each with the marks
// JMdict gives it. A row also has the form it takes for children: the same without what carries one of four marks. See
// docs/guides/words.md for the format.

/** JMdict's own "common word" tags, on any written form or reading of an entry. The same five UmaKuma's common table keeps. */
export const COMMON_TAGS = ["news1", "ichi1", "spec1", "spec2", "gai1"];
/** A sense carrying one of these marks is left out in safe mode: vulgar, X-rated, sensitive or derogatory. Kotoba's bar, kept in step. */
export const SAFE_MARKS = ["vulg", "X", "sens", "derog"];
const OUT_IN_SAFE_MODE = new Set(SAFE_MARKS);
/** A row keeps this many senses, and a sense this many glosses: the plain ones first. */
export const SENSES_KEPT = 4;
export const GLOSSES_KEPT = 3;
/** Between the fields of a sense (its marks, then its glosses). A character no JMdict text holds; a row refuses a field that has it. */
export const SENSE_BREAK = "¦";
/**
 * Written forms JMdict files as search-only, irregular or outdated are left out: not spellings anybody means to look up. The same
 * marks on a reading keep it, behind the regular ones, because a game that takes any kana as a guess is owed what it means.
 */
export const SKIPPED_FORM_INFO = new Set(["sK", "iK", "oK", "sk", "ik", "ok"]);
const BAND_SIZE = 500;
/** The rank of a word JMdict puts in no frequency list at all. */
export const UNRANKED = 100_000;

/**
 * JMdict's priority tags, one letter each as a row stores them after "~" in its flags (the nfXX band is its two digits after the
 * letters). A word's tags are those of all its written forms and readings together, as `common` is. A reading JMdict calls
 * irregular has none.
 */
export const PRIORITY_LETTERS = {
  news1: "n",
  news2: "m",
  ichi1: "i",
  ichi2: "j",
  spec1: "s",
  spec2: "t",
  gai1: "g",
  gai2: "h",
};

/** The five kinds of word a conjugation needs to know, as one letter each. */
export const KIND_LETTERS = { g: "godan", i: "ichidan", a: "i-adjective", s: "suru", k: "kuru" };

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
const decode = (text) => text.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity]);
const tags = (body, name) =>
  [...body.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "g"))].map((match) => match[1]);
const code = (text) => text.replace(/^&|;$/g, "");

/** The date of a JMdict file ("2026-11-02"), from its first comment, or null. */
export function releaseOf(xml) {
  return /<!-- JMdict created: (\d{4}-\d{2}-\d{2}) -->/.exec(xml)?.[1] ?? null;
}

/** JMdict's part-of-speech codes as the letters of the kinds a conjugation reads. */
export function kindLetters(codes) {
  const letters = new Set();
  for (const one of codes) {
    if (/^v5/.test(one)) letters.add("g");
    else if (one === "v1" || one === "v1-s") letters.add("i");
    else if (one === "adj-i" || one === "adj-ix") letters.add("a");
    else if (one === "vs" || one === "vs-i" || one === "vs-s") letters.add("s");
    else if (one === "vk") letters.add("k");
  }
  return [...letters].sort().join("");
}

/** One rank from JMdict's priority tags, lower being commoner: the newspaper band if there is one, else the lists' own two grades. */
export function rankOf(priorities) {
  const band = priorities.map((one) => /^nf(\d\d)$/.exec(one)).find(Boolean);
  if (band) return (Number(band[1]) - 1) * BAND_SIZE + BAND_SIZE / 2;
  if (priorities.some((one) => ["news1", "ichi1", "spec1", "gai1"].includes(one))) return 12_000;
  if (priorities.some((one) => ["news2", "ichi2", "spec2", "gai2"].includes(one))) return 24_000;
  return UNRANKED;
}

/** The priority tags of an entry as a row stores them: their letters in one fixed order, then the newspaper band's two digits. */
export function priorityOf(priorities) {
  const letters = Object.entries(PRIORITY_LETTERS)
    .filter(([tag]) => priorities.includes(tag))
    .map(([, letter]) => letter)
    .join("");
  const bands = priorities.map((one) => /^nf(\d\d)$/.exec(one)?.[1]).filter(Boolean);
  return `${letters}${bands.sort()[0] ?? ""}`;
}

/**
 * The glosses of a sense, the one to show first first: a literal rendering, an explanation, a figurative sense or a trademark is
 * kept behind the plain ones, and a gloss that opens with a bracketed note is kept behind one that does not.
 */
export function glossesOf(sense) {
  const glosses = [...sense.matchAll(/<gloss(\s[^>]*)?>([\s\S]*?)<\/gloss>/g)].map((match) => ({
    typed: match[1] !== undefined && /g_type="(lit|expl|fig|tm)"/.test(match[1]),
    text: decode(match[2].trim()),
  }));
  const plain = glosses.filter((gloss) => !gloss.typed && gloss.text !== "");
  const kept = (plain.length > 0 ? plain : glosses).map((gloss) => gloss.text).filter((text) => text !== "");
  const first = kept.find((text) => !text.startsWith("(")) ?? kept[0];
  return first === undefined ? [] : [first, ...kept.filter((text) => text !== first)];
}

/** Every `<entry>` of a JMdict file, as text. */
export function entriesOf(xml) {
  return xml.split("<entry>").slice(1);
}

/**
 * The rows of one entry: one for each reading it has, a reading JMdict calls irregular or outdated last. Each is an object with the
 * reading, the written forms that go with it (best first, none for a word with no kanji), the first senses, each with its
 * glosses (the plain one first) and the marks JMdict gives it (`misc`, `field` and `dial`), the kinds of word, whether JMdict calls
 * it common, whether it is usually written in kana (by its first sense), the rank, and `clean`: the row as safe mode has it,
 * or null when nothing of it is left.
 *
 * A sense JMdict marks vulgar, X-rated, sensitive or derogatory is left out of `clean`, with the written forms that only such a
 * sense applies to (a sense JMdict limits to some forms, with `stagk`, does not carry the others), and the reading that only such
 * a sense applies to (limited with `stagr`) has no `clean` at all, as has a word of which every sense is marked.
 *
 * @returns The rows, or none for an entry with no reading or no sense with a gloss.
 */
export function rowsOfEntry(entry) {
  const forms = tags(entry, "k_ele")
    .map((body) => ({
      text: decode(tags(body, "keb")[0] ?? ""),
      priorities: tags(body, "ke_pri"),
      info: tags(body, "ke_inf").map(code),
    }))
    .filter((form) => form.text !== "" && !form.info.some((one) => SKIPPED_FORM_INFO.has(one)));
  const readings = tags(entry, "r_ele")
    .map((body) => ({
      text: decode(tags(body, "reb")[0] ?? ""),
      priorities: tags(body, "re_pri"),
      info: tags(body, "re_inf").map(code),
      only: tags(body, "re_restr").map(decode),
      noKanji: body.includes("<re_nokanji/>"),
    }))
    .filter((reading) => reading.text !== "")
    .map((reading) => ({ ...reading, irregular: reading.info.some((one) => SKIPPED_FORM_INFO.has(one)) }));
  if (readings.length === 0) return [];

  const senses = tags(entry, "sense")
    .map((body) => {
      const marks = [...new Set(["misc", "field", "dial"].flatMap((name) => tags(body, name).map(code)))];
      return {
        glosses: glossesOf(body).slice(0, GLOSSES_KEPT),
        marks,
        unfit: marks.some((one) => OUT_IN_SAFE_MODE.has(one)),
        pos: tags(body, "pos").map(code),
        usuallyKana: marks.includes("uk"),
        onlyForms: tags(body, "stagk").map(decode),
        onlyReadings: tags(body, "stagr").map(decode),
      };
    })
    .filter((sense) => sense.glosses.length > 0);
  if (senses.length === 0) return [];
  const shown = (list) => list.slice(0, SENSES_KEPT).map(({ marks, glosses }) => ({ marks, glosses }));

  const priorities = [
    ...forms.flatMap((form) => form.priorities),
    ...readings.flatMap((reading) => reading.priorities),
  ];
  const taggedCommon = priorities.some((one) => COMMON_TAGS.includes(one));
  const kinds = kindLetters(senses.flatMap((sense) => sense.pos));
  // The first sense decides how the word is shown: 犬 has a later sense that is usually in kana, and is still 犬.
  const usuallyKana = senses[0]?.usuallyKana ?? false;
  const rank = rankOf(priorities);
  // The forms JMdict tags common come first; the rest keep the dictionary's own order.
  const ordered = [
    ...forms.filter((form) => form.priorities.length > 0),
    ...forms.filter((form) => form.priorities.length === 0),
  ];

  return readings.map((reading) => {
    const written = reading.noKanji
      ? []
      : ordered
          .filter((form) => reading.only.length === 0 || reading.only.includes(form.text))
          .map((form) => form.text);
    const fit = senses.filter(
      (sense) => !sense.unfit && (sense.onlyReadings.length === 0 || sense.onlyReadings.includes(reading.text)),
    );
    const clean =
      fit.length === 0
        ? null
        : {
            forms: written.filter((form) =>
              fit.some((sense) => sense.onlyForms.length === 0 || sense.onlyForms.includes(form)),
            ),
            senses: shown(fit),
          };
    return {
      reading: reading.text,
      forms: written,
      senses: shown(senses),
      clean,
      kinds,
      // An irregular reading is never a common one, and comes after the regular ones that share it.
      common: taggedCommon && !reading.irregular,
      priority: reading.irregular ? "" : priorityOf(priorities),
      usuallyKana,
      rank: reading.irregular ? UNRANKED + 1 : rank,
    };
  });
}

/** Every row of a JMdict file, the commonest first and in the dictionary's order among equals. */
export function rowsOfDictionary(xml) {
  const rows = entriesOf(xml).flatMap((entry, at) => rowsOfEntry(entry).map((row) => ({ ...row, at })));
  return rows.sort((a, b) => a.rank - b.rank || a.at - b.at);
}

/** A kana folded to hiragana: the katakana block moves down, ー and everything else stays. */
export function foldKana(text) {
  return text.replace(/[ァ-ヶ]/g, (one) => String.fromCharCode(one.charCodeAt(0) - 0x60));
}

/**
 * What a table is looked up by. A written form is looked up as NFKC makes it, so that １人 and 1人, ＣＤ and CD, ﾀﾋ and タヒ are
 * one key; a reading is that, folded to hiragana. The lookup (src/words-text.ts) makes the same keys of what it is asked.
 */
export const formKey = (text) => text.normalize("NFKC");
export const readingKey = (text) => foldKana(formKey(text));

const FIELD_BREAK = /[\t\n]/;
const LIST_BREAK = /[\t\n|]/;

/** A sense as one field: its marks joined by commas, then its glosses, apart by SENSE_BREAK. */
function packSense(sense, reading) {
  for (const part of [...sense.marks, ...sense.glosses])
    if (FIELD_BREAK.test(part) || part.includes(SENSE_BREAK) || (/,/.test(part) && sense.marks.includes(part)))
      throw new Error(`A separator in the row for ${reading}: ${part}`);
  return [sense.marks.join(","), ...sense.glosses].join(SENSE_BREAK);
}

/** A row as one line: reading, forms joined by "|", flags, then one field for each sense. */
export function packRow(row) {
  const flags = `${row.kinds}${row.common ? "C" : ""}${row.usuallyKana ? "U" : ""}${row.priority ? `~${row.priority}` : ""}`;
  for (const part of [row.reading, ...row.forms])
    if (LIST_BREAK.test(part)) throw new Error(`A separator in the row for ${row.reading}: ${part}`);
  return [row.reading, row.forms.join("|"), flags, ...row.senses.map((sense) => packSense(sense, row.reading))].join(
    "\t",
  );
}

/** The line of the row as safe mode has it, or null when nothing of it is left: the same line as `packRow` where nothing was left out. */
export function packClean(row) {
  return row.clean === null ? null : packRow({ ...row, ...row.clean });
}
