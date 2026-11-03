import type { WordsManifest } from "../../words.types.ts";

/**
 * Where the pieces are that hold what safe mode leaves out: the first key of each, and how to fetch it. 9 pieces of rows by reading and 1 of written forms. 265,954 rows in the dictionary in all. Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const EXTRA_MANIFEST: WordsManifest = {
  source: "JMdict",
  release: "2026-11-03",
  rowCount: 265954,
  readings: {
    starts: ["", "おまん", "きりじ", "さんご", "じゅ", "ちぇっ", "にょぞ", "へな", "れいは"],
    load: [
      () => import("./xr0.data.ts").then((one) => one.PIECE),
      () => import("./xr1.data.ts").then((one) => one.PIECE),
      () => import("./xr2.data.ts").then((one) => one.PIECE),
      () => import("./xr3.data.ts").then((one) => one.PIECE),
      () => import("./xr4.data.ts").then((one) => one.PIECE),
      () => import("./xr5.data.ts").then((one) => one.PIECE),
      () => import("./xr6.data.ts").then((one) => one.PIECE),
      () => import("./xr7.data.ts").then((one) => one.PIECE),
      () => import("./xr8.data.ts").then((one) => one.PIECE),
    ],
  },
  forms: {
    starts: [""],
    load: [
      () => import("./xf0.data.ts").then((one) => one.PIECE),
    ],
  },
};
