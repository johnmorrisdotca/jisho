/**
 * The small files that say where the pieces are, each fetched once and only when a lookup needs it. They are the only places that
 * name a file of data, so that an entry point that does not need them (`entries`) does not carry what they name.
 */

import type { IndexManifest, WordsManifest } from "./words.types.ts";
import { once } from "./words-pieces.ts";

/** The pieces of what safe mode leaves out: their manifest is fetched only when a lookup asks for everything. */
export const extras: () => Promise<WordsManifest> = once("manifest", () =>
  import("./data/words/extra-manifest.data.ts").then((one) => one.EXTRA_MANIFEST),
);

/** The pieces of the indexes by meaning and by kanji: fetched only when one of those lookups is made. */
export const indexes: () => Promise<IndexManifest> = once("manifest", () =>
  import("./data/words/index-manifest.data.ts").then((one) => one.INDEX_MANIFEST),
);

/** The pieces of the indexes that hold what safe mode leaves out: fetched only when one of those lookups asks for everything. */
export const extraIndexes: () => Promise<IndexManifest> = once("manifest", () =>
  import("./data/words/index-extra-manifest.data.ts").then((one) => one.EXTRA_INDEX_MANIFEST),
);

/** The table of the common words, fetched once for the life of the process. */
export const commonTable = once("common", () => import("./data/words/common.data.ts").then((one) => one.COMMON_WORDS));
/** What to add to the common words for unfiltered mode. */
export const commonExtra = once("common", () =>
  import("./data/words/common-extra.data.ts").then((one) => one.COMMON_EXTRA),
);
