import type { EntryManifest } from "../../words.types.ts";

/**
 * Where the pieces are of the example lists that safe mode cuts: the first number of each, and how to fetch it. 2 pieces. Only for a lookup that asks for everything. Written by `scripts/build-examples.mjs`, never edited by hand.
 *
 * The sentences are from the Tatoeba project (https://tatoeba.org), under the Creative Commons Attribution 2.0 France licence (CC BY 2.0 FR,
 * https://creativecommons.org/licenses/by/2.0/fr/), each with its author's name. The links from a sense of a word to the sentences that show it are
 * JMdict_e_examp's, of the Electronic Dictionary Research and Development Group, under the Creative Commons Attribution-ShareAlike 4.0 licence
 * and the Group's conditions: https://www.edrdg.org/edrdg/licence.html. This table is derived from them.
 */
export const EXTRA_EXAMPLE_MANIFEST: EntryManifest = {
  source: "JMdict_e_examp and Tatoeba",
  release: "2026-11-03",
  entries: {
    starts: ["", "0x9r"],
    load: [
      () => import("./xs0.data.ts").then((one) => one.PIECE),
      () => import("./xs1.data.ts").then((one) => one.PIECE),
    ],
  },
};
