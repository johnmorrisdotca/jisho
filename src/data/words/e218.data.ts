import type { WordsPiece } from "../../words.types.ts";

/**
 * The entries of JMdict as safe mode has them, each: its number in base 36, its written forms, its readings, then one field for each sense. Only for a lookup of a whole entry. Piece 219 of 219, from "3f784". Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const PIECE: WordsPiece = {
  rows: [
    "3f784\t国家情報局\tこっかじょうほうきょく\tn¦organization¦National Intelligence Bureau (Japan)",
    "3f79e\t\tアトン|アテン\tn¦dei¦Aton (Egyptian sun god)¦Aten",
    "5yc1r\tＪＭｄｉｃｔ\tジェイエムディクト\tunc¦¦Japanese-Multilingual Dictionary Project - Creation Date: 2026-11-03",
  ],
};
