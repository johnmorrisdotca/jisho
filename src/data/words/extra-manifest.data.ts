import type { WordsManifest } from "../../words.types.ts";

/**
 * Where the pieces are that hold what safe mode leaves out: the first key of each, and how to fetch it. 13 pieces of rows by reading and 2 of written forms. 265,954 rows in the dictionary in all. Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
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
    starts: ["", "うせ", "かけいや", "きょうう", "こうざ", "しけら", "じぇー", "せいひが", "だん", "とみ", "はるをひ", "への", "ものづ"],
    load: [
      () => import("./xr00.data.ts").then((one) => one.PIECE),
      () => import("./xr01.data.ts").then((one) => one.PIECE),
      () => import("./xr02.data.ts").then((one) => one.PIECE),
      () => import("./xr03.data.ts").then((one) => one.PIECE),
      () => import("./xr04.data.ts").then((one) => one.PIECE),
      () => import("./xr05.data.ts").then((one) => one.PIECE),
      () => import("./xr06.data.ts").then((one) => one.PIECE),
      () => import("./xr07.data.ts").then((one) => one.PIECE),
      () => import("./xr08.data.ts").then((one) => one.PIECE),
      () => import("./xr09.data.ts").then((one) => one.PIECE),
      () => import("./xr10.data.ts").then((one) => one.PIECE),
      () => import("./xr11.data.ts").then((one) => one.PIECE),
      () => import("./xr12.data.ts").then((one) => one.PIECE),
    ],
  },
  forms: {
    starts: ["", "電気按"],
    load: [
      () => import("./xf0.data.ts").then((one) => one.PIECE),
      () => import("./xf1.data.ts").then((one) => one.PIECE),
    ],
  },
};
