/**
 * Fetching the pieces of the dictionary: each piece once however many lookups ask for it at the same moment, one retry for a piece
 * that fails, and a typed error that names the piece when it still does. A piece that failed is not remembered, so a later lookup
 * asks again.
 */

import type { PieceSet, WordsPiece } from "./words.types.ts";
import { readingKey } from "./words-text.ts";

/**
 * Which set of pieces a `WordsLoadError` is about: `readings` and `forms` are the dictionary, `extra-readings` and `extra-forms` what
 * safe mode leaves out, `meanings` and `kanji` the indexes (and their `extra-` kin), `entries` and `examples` the whole entries and the example sentences (and their `extra-` kin), `common` the table of common words, and
 * `manifest` the small file that says where the pieces are.
 *
 * @example
 * ```ts
 * import type { WordsPieceKind } from "@johnmorrisdotca/jisho/words";
 *
 * const kind: WordsPieceKind = "readings";
 * console.log(kind);
 * ```
 */
export type WordsPieceKind =
  | "readings"
  | "forms"
  | "extra-readings"
  | "extra-forms"
  | "meanings"
  | "extra-meanings"
  | "kanji"
  | "extra-kanji"
  | "entries"
  | "extra-entries"
  | "examples"
  | "extra-examples"
  | "strokes"
  | "common"
  | "manifest";

/**
 * What a lookup rejects with when a piece of the dictionary cannot be fetched, after one retry: a network that is down, a file the
 * host does not serve, a bundler that left the piece out. It names the piece, so a log says which one, and keeps the reason in
 * `cause`. Nothing else a lookup does rejects with it: a text with no word is an empty answer, and a lookup before loading is a
 * `RangeError`.
 *
 * @param kind - Which set of pieces it was.
 * @param index - The number of the piece in its set, if the set is cut in pieces.
 * @param of - How many pieces the set has.
 * @param cause - What the fetch rejected with.
 * @example
 * ```ts
 * import { loadWords, WordsLoadError } from "@johnmorrisdotca/jisho/words";
 *
 * try {
 *   await loadWords("かみ");
 * } catch (error) {
 *   if (error instanceof WordsLoadError) console.log(error.kind, error.index, error.cause);
 * }
 * ```
 */
export class WordsLoadError extends Error {
  /** Which set of pieces it was. */
  readonly kind: WordsPieceKind;
  /** The number of the piece in its set, counting from 0; absent for a table or manifest that is one file. */
  readonly index: number | undefined;
  /** The piece, in words: `the readings piece 12 of 294`. */
  readonly piece: string;

  constructor(kind: WordsPieceKind, index: number | undefined, of: number | undefined, cause: unknown) {
    const piece = `the ${kind.replace("-", " ")} ${index === undefined ? "file" : `piece ${index}${of === undefined ? "" : ` of ${of}`}`}`;
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`Could not fetch ${piece} of the dictionary (${reason}). Check that the file is served, then ask again.`, {
      cause,
    });
    this.name = "WordsLoadError";
    this.kind = kind;
    this.index = index;
    this.piece = piece;
  }
}

/** How long to wait before the one retry; a test sets it to nothing. */
export const retry = { delayMs: 250 };

const later = (ms: number) => (ms <= 0 ? Promise.resolve() : new Promise<void>((done) => setTimeout(done, ms)));

/** Runs a fetch, and once more if it fails; the second failure is a `WordsLoadError`. */
async function attempt<T>(run: () => Promise<T>, kind: WordsPieceKind, index?: number, of?: number): Promise<T> {
  try {
    return await run();
  } catch {
    await later(retry.delayMs);
    try {
      return await run();
    } catch (cause) {
      throw new WordsLoadError(kind, index, of, cause);
    }
  }
}

/** Fetched and indexed pieces, by the set they belong to and their number, so that a second lookup in the same piece fetches nothing. */
const fetched = new WeakMap<PieceSet, Map<number, Promise<ReadonlyMap<string, readonly string[]>>>>();

/**
 * How many pieces the process keeps, over every set together; the one least recently asked for is let go when one more is fetched.
 * A piece indexed in memory is a few megabytes, and the dictionary has hundreds, so a process that looks up everything would hold
 * them all (49 MB to 266 MB measured). The words already looked up are not affected: they are rows of their own. A test sets it.
 */
export const cacheLimit = { pieces: 64 };

type Held = Map<number, Promise<ReadonlyMap<string, readonly string[]>>>;
/** The pieces kept, the least recently asked for first. */
const recent: { held: Held; at: number }[] = [];

/** Notes that a piece was asked for (a new one, or one kept), and lets go of the least recently asked for beyond the limit. */
function remember(held: Held, at: number): void {
  const was = recent.findIndex((one) => one.held === held && one.at === at);
  if (was !== -1) recent.splice(was, 1);
  recent.push({ held, at });
  while (recent.length > Math.max(1, cacheLimit.pieces)) {
    const oldest = recent.shift();
    oldest?.held.delete(oldest.at);
  }
}

/** Forgets a piece that failed to fetch. */
function forget(held: Held, at: number): void {
  held.delete(at);
  const was = recent.findIndex((one) => one.held === held && one.at === at);
  if (was !== -1) recent.splice(was, 1);
}

/** The lines of a piece, indexed by the key of each. */
function indexLines(lines: readonly string[], keyOfLine: (line: string) => string): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const line of lines) {
    const key = keyOfLine(line);
    const held = index.get(key);
    if (held === undefined) index.set(key, [line]);
    else held.push(line);
  }
  return index;
}

/** How wide an entry's number is as a key: base 36, five characters, so that the keys sort as the numbers do. Mirrors scripts/words-entries.mjs. */
export const ENTRY_KEY_WIDTH = 5;
/** What an entry is looked up by, in the pieces of the whole entries and of the examples. */
export const entryKey = (id: number): string => id.toString(36).padStart(ENTRY_KEY_WIDTH, "0");

/** The key of a row of the dictionary: its reading folded to hiragana. */
export const readingOfRow = (line: string): string => readingKey(line.slice(0, line.indexOf("\t")));
/** The key of a line of an index: what it is the index of. */
export const formOfLine = (line: string): string => line.slice(0, line.indexOf("\t"));

/** The index of the last piece that starts at or before a key. */
export function pieceOf(starts: readonly string[], key: string): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if ((starts[middle] ?? "") <= key) low = middle;
    else high = middle - 1;
  }
  return low;
}

/** A piece, indexed by the key of each of its lines. Concurrent asks share one fetch; a failure is not remembered. */
export function indexed(
  kind: WordsPieceKind,
  set: PieceSet,
  at: number,
  keyOfLine: (line: string) => string,
): Promise<ReadonlyMap<string, readonly string[]>> {
  const held: Held = fetched.get(set) ?? new Map();
  fetched.set(set, held);
  const cached = held.get(at);
  if (cached !== undefined) {
    remember(held, at);
    return cached;
  }
  const load = set.load[at];
  if (load === undefined) return Promise.reject(new RangeError(`The ${kind} piece ${at} does not exist.`));
  const made = attempt(load, kind, at, set.load.length).then((piece: WordsPiece) => indexLines(piece.rows, keyOfLine));
  held.set(at, made);
  remember(held, at);
  made.catch(() => forget(held, at));
  return made;
}

/** The pieces of a set that hold some keys, fetched together, by the number of each. */
export async function piecesFor(
  kind: WordsPieceKind,
  set: PieceSet,
  keys: Iterable<string>,
  keyOfLine: (line: string) => string,
): Promise<Map<number, ReadonlyMap<string, readonly string[]>>> {
  const at = [...new Set([...keys].map((key) => pieceOf(set.starts, key)))];
  return new Map(await Promise.all(at.map(async (one) => [one, await indexed(kind, set, one, keyOfLine)] as const)));
}

/** A small file that is fetched once, by the kind it is: the manifest of what safe mode leaves out, or of the indexes. */
export function once<T>(kind: WordsPieceKind, load: () => Promise<T>): () => Promise<T> {
  let made: Promise<T> | undefined;
  return () => {
    if (made === undefined) {
      const mine = attempt(load, kind);
      made = mine;
      mine.catch(() => {
        if (made === mine) made = undefined;
      });
    }
    return made;
  };
}
