// What the rows of the dictionary are sorted into: the default tables, which hold only what safe mode keeps, and the extra
// ones, which hold everything those leave out. Pure functions over the rows `words-parse.mjs` makes, so a test can hold them to
// small dictionaries and `build-words.mjs` only has to cut them into files.
//
// The rule that decides everything here: nothing that safe mode leaves out is in a default table. A word of which every sense is
// marked is not in one at all; a sense, a written form or a reading that is marked is not either. What is left out goes in the
// extra tables, which a host fetches only in unfiltered mode.
import { foldKana, packClean, packRow } from "./words-parse.mjs";

/** Readings that are not all kana (a middle dot is kana here, as it is in loanwords): they are looked up like a written form. */
export const KANA_TEXT = /^[ぁ-ゖゝ-ゟァ-ヺ・-ヿ]+$/;

/** For each written form (and each reading that is not kana alone, which is asked for like one), its readings, the commonest word's first. */
function formIndex(pairs) {
  const readingsOf = new Map();
  const add = (form, reading) => {
    const held = readingsOf.get(form) ?? [];
    if (!held.includes(reading)) held.push(reading);
    readingsOf.set(form, held);
  };
  for (const [reading, forms] of pairs) {
    for (const form of forms) add(form, reading);
    if (!KANA_TEXT.test(reading)) add(reading, reading);
  }
  return readingsOf;
}

/** The lines of each key, in the order the lines come in. */
function byKey(entries) {
  const held = new Map();
  for (const [key, line] of entries) held.set(key, [...(held.get(key) ?? []), line]);
  return held;
}

const same = (a, b) => a.length === b.length && a.every((one, at) => one === b[at]);

/**
 * The tables of a list of rows, commonest first.
 *
 * @returns
 *   `common` and `commonPatch`: the common words safe mode keeps, and what to do to them to have every common word as JMdict has it;
 *   `readings`: the default rows as [key, line] sorted by key (the reading folded to hiragana), and `extraReadings` the lines
 *     for each key whose answer is not the same for everything, in full;
 *   `forms`: the default index as [form, line] sorted by form, and `extraForms` the same for each form whose readings differ;
 *   `counts`.
 */
export function tablesOf(rows) {
  const full = rows.map(packRow);
  const clean = rows.map(packClean);

  // The common words, and the patch that turns them back into everything: "n", "r" (replace what is there) or "i" (insert), the line.
  const common = [];
  const commonPatch = [];
  let n = 0;
  for (const [at, row] of rows.entries()) {
    if (!row.common) continue;
    const line = clean[at];
    if (line !== null) common.push(line);
    if (line !== full[at]) commonPatch.push(`${n}\t${line === null ? "i" : "r"}\t${full[at]}`);
    n++;
  }

  // The rows by reading, folded to hiragana, in the order of the dictionary within one.
  const order = rows
    .map((_row, at) => at)
    .sort((a, b) => {
      const [x, y] = [foldKana(rows[a].reading), foldKana(rows[b].reading)];
      return x < y ? -1 : x > y ? 1 : a - b;
    });
  const readings = order.filter((at) => clean[at] !== null).map((at) => [foldKana(rows[at].reading), clean[at]]);
  const fullByReading = byKey(order.map((at) => [foldKana(rows[at].reading), full[at]]));
  const cleanByReading = byKey(readings);
  const extraReadings = [...fullByReading]
    .filter(([key, lines]) => !same(lines, cleanByReading.get(key) ?? []))
    .flatMap(([key, lines]) => lines.map((line) => [key, line]));

  // The index of written forms.
  const fullIndex = formIndex(rows.map((row) => [row.reading, row.forms]));
  const cleanIndex = formIndex(rows.filter((row) => row.clean !== null).map((row) => [row.reading, row.clean.forms]));
  const lineOf = (form, held) => [form, `${form}\t${held.join("|")}`];
  const forms = [...cleanIndex].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([form, held]) => lineOf(form, held));
  const extraForms = [...fullIndex]
    .filter(([form, held]) => !same(held, cleanIndex.get(form) ?? []))
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([form, held]) => lineOf(form, held));

  return {
    common,
    commonPatch,
    readings,
    extraReadings,
    forms,
    extraForms,
    counts: {
      rows: rows.length,
      cleanRows: readings.length,
      common: common.length,
      commonAll: rows.filter((row) => row.common).length,
    },
  };
}

/** What a patch makes of the default common rows: every common row as JMdict has it. Mirrors the reader in src/words.ts. */
export function patched(common, patch) {
  const insertions = patch.filter((one) => one.split("\t")[1] === "i").length;
  const edits = new Map(
    patch.map((one) => {
      const [at, kind, ...line] = one.split("\t");
      return [Number(at), [kind, line.join("\t")]];
    }),
  );
  const out = [];
  let from = 0;
  for (let at = 0; at < common.length + insertions; at++) {
    const edit = edits.get(at);
    if (edit === undefined) out.push(common[from++]);
    else {
      out.push(edit[1]);
      if (edit[0] === "r") from++;
    }
  }
  return out;
}
