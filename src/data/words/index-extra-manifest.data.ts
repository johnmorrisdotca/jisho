import type { IndexManifest } from "../../words.types.ts";

/**
 * Where the pieces are of the indexes by meaning and by kanji that hold what safe mode leaves out: the first key of each, and how to fetch it. 12 pieces by meaning and 7 by kanji. Only for a lookup that asks for everything. Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const EXTRA_INDEX_MANIFEST: IndexManifest = {
  source: "JMdict",
  release: "2026-11-04",
  meanings: {
    starts: ["", "bask", "cog", "dre", "forci", "imb", "loin ", "nost", "preco", "sect", "supposedl", "virgini"],
    load: [
      () => import("./xm00.data.ts").then((one) => one.PIECE),
      () => import("./xm01.data.ts").then((one) => one.PIECE),
      () => import("./xm02.data.ts").then((one) => one.PIECE),
      () => import("./xm03.data.ts").then((one) => one.PIECE),
      () => import("./xm04.data.ts").then((one) => one.PIECE),
      () => import("./xm05.data.ts").then((one) => one.PIECE),
      () => import("./xm06.data.ts").then((one) => one.PIECE),
      () => import("./xm07.data.ts").then((one) => one.PIECE),
      () => import("./xm08.data.ts").then((one) => one.PIECE),
      () => import("./xm09.data.ts").then((one) => one.PIECE),
      () => import("./xm10.data.ts").then((one) => one.PIECE),
      () => import("./xm11.data.ts").then((one) => one.PIECE),
    ],
  },
  kanji: {
    starts: ["", "唇", "巫", "斬", "濫", "胎", "郎"],
    load: [
      () => import("./xk0.data.ts").then((one) => one.PIECE),
      () => import("./xk1.data.ts").then((one) => one.PIECE),
      () => import("./xk2.data.ts").then((one) => one.PIECE),
      () => import("./xk3.data.ts").then((one) => one.PIECE),
      () => import("./xk4.data.ts").then((one) => one.PIECE),
      () => import("./xk5.data.ts").then((one) => one.PIECE),
      () => import("./xk6.data.ts").then((one) => one.PIECE),
    ],
  },
};
