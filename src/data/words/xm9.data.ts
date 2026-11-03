import type { WordsPiece } from "../../words.types.ts";

/**
 * Terms of the English meanings, whole as JMdict has them, for each term whose words are not the same in safe mode. Only for a lookup that asks for everything, each: the key, then the readings of the words that have it joined by "|", the commonest first. Piece 10 of 10, from "yo". Written by `scripts/build-words.mjs` from JMdict, never edited by hand.
 *
 * JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG), used under the Creative
 * Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html.
 * This table is derived from it and is under the same licence.
 */
export const PIECE: WordsPiece = {
  rows: [
    "yokel\tひゃくしょう|いも|イモ",
    "you\tじぶん|なに|ナニ|なにか|なんか|じつは|おかあさん|おとうさん|ぼく|ボク|かたがた|よかったら|おのれ|われ|しょくん|ほしい|おまえ|おまい|おつ|オツ",
    "you bastard\tこいつ|こやつ",
    "you mean\tなにか|なんか",
    "you trying\tなにか|なんか",
    "young hoodlum\tチンピラ|ちんぴら",
    "younger sister's\tおとうと|てい|ぎてい",
    "youngster\tわかもの|わかもん|こぞう|わかぞう|じゃくねんしゃ|じゃくねんもの|ヤングスター|ヤングスタ",
    "your name\tこうめい|こうみょう",
    "zainichi\tざいにち",
    "zainichi korean\tざいにち",
    "zen\tくふう|ふとん|ぜん|ぜんでら|かゆ|しゅく|ざぜん|ぜんしゅう|いっかつ|ぜんそう|ぶつでん|いしんでんしん|ぜんもんどう|たくはつ|こむそう|さんぜん|てんしん|てんじん|しっぺい|しっぺ",
    "zen temples\tかゆ|しゅく",
    "ōmi\tおうみどろぼういせこじき|おうみ|おおみやり|おうみりょう",
  ],
};
