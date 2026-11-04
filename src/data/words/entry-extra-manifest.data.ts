import type { EntryManifest } from "../../words.types.ts";

/**
 * Where the pieces are of the whole entries that safe mode cuts: the first number of each, and how to fetch it. 6 pieces. Only for a lookup of a whole entry that asks for everything. Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const EXTRA_ENTRY_MANIFEST: EntryManifest = {
  source: "JMdict",
  release: "2026-11-03",
  entries: {
    starts: ["", "0t3", "101", "1a6", "1mc5", "1ozq"],
    load: [
      () => import("./xe0.data.ts").then((one) => one.PIECE),
      () => import("./xe1.data.ts").then((one) => one.PIECE),
      () => import("./xe2.data.ts").then((one) => one.PIECE),
      () => import("./xe3.data.ts").then((one) => one.PIECE),
      () => import("./xe4.data.ts").then((one) => one.PIECE),
      () => import("./xe5.data.ts").then((one) => one.PIECE),
    ],
  },
};
