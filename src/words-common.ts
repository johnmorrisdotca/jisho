/** The common words as one table, for a page that looks up many words, all of them common. */

import type { PackedPatch, PackedWords, WordRow, Words, WordsOptions } from "./words.types.ts";
import { checkLists, modeOf } from "./words-filter.ts";
import { commonExtra, commonTable } from "./words-pieces.ts";
import { readRow } from "./words-rows.ts";
import { formKey, readingKey } from "./words-text.ts";

/** The rows of the common words once a patch has been laid over them: every row as JMdict has it. */
function patchedRows(rows: readonly string[], patch: PackedPatch): string[] {
  const edits = new Map(
    patch.edits.map((edit) => {
      const [at = "", kind = "", ...line] = edit.split("\t");
      return [Number(at), { kind, line: line.join("\t") }] as const;
    }),
  );
  const inserted = [...edits.values()].filter((edit) => edit.kind === "i").length;
  const out: string[] = [];
  let from = 0;
  for (let at = 0; at < rows.length + inserted; at++) {
    const edit = edits.get(at);
    if (edit === undefined) out.push(rows[from++] ?? "");
    else {
      out.push(edit.line);
      if (edit.kind === "r") from++;
    }
  }
  return out;
}

/**
 * The common words as a table the caller already has, read into words: a lookup by reading or written form with no waiting.
 * Only the common words are in it, so a reading shared with a rare word finds the common ones alone.
 *
 * The table holds only what safe mode keeps. To have everything, pass `mode: "unfiltered"` and `extra`, the table that says what
 * to add and change (`COMMON_EXTRA`, from `@johnmorrisdotca/jisho/words-common-extra`); without it that is a mistake and throws.
 *
 * @param table - `COMMON_WORDS`, from `@johnmorrisdotca/jisho/words-common`.
 * @param options - The mode (safe unless you say otherwise), the consumer's lists, and for unfiltered the `extra` table.
 * @returns The words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { readCommonWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 * import { COMMON_WORDS } from "@johnmorrisdotca/jisho/words-common";
 *
 * console.log(wordsOf(readCommonWords(COMMON_WORDS), "紙")[0]?.meaning); // paper
 * ```
 */
export function readCommonWords(
  table: PackedWords,
  options: WordsOptions & { readonly extra?: PackedPatch } = {},
): Words {
  const mode = modeOf(options.mode);
  checkLists(options);
  if (mode === "unfiltered" && options.extra === undefined)
    throw new TypeError("Unfiltered needs the table of what to add: pass extra, COMMON_EXTRA from words-common-extra.");
  const lines = mode === "safe" || options.extra === undefined ? table.rows : patchedRows(table.rows, options.extra);
  const entries = new Map<string, WordRow[]>();
  const add = (key: string, row: WordRow) => {
    const held = entries.get(key);
    if (held === undefined) entries.set(key, [row]);
    else if (!held.includes(row)) held.push(row);
  };
  for (const line of lines) {
    const row = readRow(line);
    add(readingKey(row.reading), row);
    for (const form of row.forms) add(formKey(form), row);
  }
  for (const held of entries.values()) Object.freeze(held);
  return { release: table.release, scope: "common", mode, block: options.block, allow: options.allow, entries };
}

/**
 * The common words, fetched in one piece: about 26,000 rows and some 800 kB gzipped, for a page that looks up many words, all of
 * them common. In safe mode that is one file. Unfiltered it is that and one more, of what to add and change. Anything that is not
 * common is `loadWords`. A file that cannot be fetched rejects with a `WordsLoadError`.
 *
 * @param options - The mode (safe unless you say otherwise) and the consumer's lists.
 * @returns The common words, ready for `wordsOf`.
 * @example
 * ```ts
 * import { loadCommonWords, wordsOf } from "@johnmorrisdotca/jisho/words";
 *
 * console.log(wordsOf(await loadCommonWords(), "かみ").map((one) => one.written)); // ["紙", "神", ...]
 * ```
 */
export async function loadCommonWords(options: WordsOptions = {}): Promise<Words> {
  const mode = modeOf(options.mode);
  checkLists(options);
  const [table, extra] = await Promise.all([commonTable(), mode === "safe" ? undefined : commonExtra()]);
  return readCommonWords(table, { ...options, mode, extra });
}
