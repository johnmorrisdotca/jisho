import type { IndexManifest } from "../../words.types.ts";

/**
 * Where the pieces are of the indexes by meaning and by kanji that hold what safe mode leaves out: the first key of each, and how to fetch it. 10 pieces by meaning and 4 by kanji. Only for a lookup that asks for everything. Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const EXTRA_INDEX_MANIFEST: IndexManifest = {
  source: "JMdict",
  release: "2026-11-03",
  meanings: {
    starts: ["", "bot", "dead ", "finding ", "imperial ", "ment", "playing ", "sens", "theatre ", "yo"],
    load: [
      () => import("./xm0.data.ts").then((one) => one.PIECE),
      () => import("./xm1.data.ts").then((one) => one.PIECE),
      () => import("./xm2.data.ts").then((one) => one.PIECE),
      () => import("./xm3.data.ts").then((one) => one.PIECE),
      () => import("./xm4.data.ts").then((one) => one.PIECE),
      () => import("./xm5.data.ts").then((one) => one.PIECE),
      () => import("./xm6.data.ts").then((one) => one.PIECE),
      () => import("./xm7.data.ts").then((one) => one.PIECE),
      () => import("./xm8.data.ts").then((one) => one.PIECE),
      () => import("./xm9.data.ts").then((one) => one.PIECE),
    ],
  },
  kanji: {
    starts: ["", "尻", "灯", "部"],
    load: [
      () => import("./xk0.data.ts").then((one) => one.PIECE),
      () => import("./xk1.data.ts").then((one) => one.PIECE),
      () => import("./xk2.data.ts").then((one) => one.PIECE),
      () => import("./xk3.data.ts").then((one) => one.PIECE),
    ],
  },
};
