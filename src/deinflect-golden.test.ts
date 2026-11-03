// The golden set: forms written out from the conjugation rules, one verb or adjective to a row and one form to a column, the way a
// conjugation chart sets them out. None of it is output of the code under test, and none of it has yet been read by a native
// speaker, so every entry carries the note saying so.
import { describe, expect, it } from "vitest";
import { type DeinflectKind, deinflect } from "./deinflect.ts";

const NOTE = "Written from the conjugation rules by the maintainers' tooling; a native reader should check it.";

type Golden = { form: string; base: string; kind: DeinflectKind; path: string[]; note: string };

/** A chart: each row is a dictionary form and the forms that follow, in the column order, apart by spaces. */
function chart(kind: DeinflectKind, columns: string[][], rows: string[]): Golden[] {
  return rows.flatMap((row) => {
    const [base = "", ...forms] = row.split(" ");
    expect(forms.length, `${base} has a form for each of the ${columns.length} columns`).toBe(columns.length);
    return forms.map((form, at) => ({ form, base, kind, path: columns[at] ?? [], note: NOTE }));
  });
}

const single = (form: string, base: string, kind: DeinflectKind, ...path: string[]): Golden => ({
  form,
  base,
  kind,
  path,
  note: NOTE,
});

const GODAN_COLUMNS = [
  ["polite"],
  ["polite", "past"],
  ["polite", "negative"],
  ["negative"],
  ["negative", "past"],
  ["te"],
  ["past"],
  ["potential"],
  ["passive"],
  ["causative"],
  ["causative", "passive"],
  ["volitional"],
  ["ba-conditional"],
  ["want to"],
  ["tara-conditional"],
];
const GODAN = chart("g", GODAN_COLUMNS, [
  "書く 書きます 書きました 書きません 書かない 書かなかった 書いて 書いた 書ける 書かれる 書かせる 書かせられる 書こう 書けば 書きたい 書いたら",
  "泳ぐ 泳ぎます 泳ぎました 泳ぎません 泳がない 泳がなかった 泳いで 泳いだ 泳げる 泳がれる 泳がせる 泳がせられる 泳ごう 泳げば 泳ぎたい 泳いだら",
  "話す 話します 話しました 話しません 話さない 話さなかった 話して 話した 話せる 話される 話させる 話させられる 話そう 話せば 話したい 話したら",
  "待つ 待ちます 待ちました 待ちません 待たない 待たなかった 待って 待った 待てる 待たれる 待たせる 待たせられる 待とう 待てば 待ちたい 待ったら",
  "死ぬ 死にます 死にました 死にません 死なない 死ななかった 死んで 死んだ 死ねる 死なれる 死なせる 死なせられる 死のう 死ねば 死にたい 死んだら",
  "遊ぶ 遊びます 遊びました 遊びません 遊ばない 遊ばなかった 遊んで 遊んだ 遊べる 遊ばれる 遊ばせる 遊ばせられる 遊ぼう 遊べば 遊びたい 遊んだら",
  "読む 読みます 読みました 読みません 読まない 読まなかった 読んで 読んだ 読める 読まれる 読ませる 読ませられる 読もう 読めば 読みたい 読んだら",
  "帰る 帰ります 帰りました 帰りません 帰らない 帰らなかった 帰って 帰った 帰れる 帰られる 帰らせる 帰らせられる 帰ろう 帰れば 帰りたい 帰ったら",
  "買う 買います 買いました 買いません 買わない 買わなかった 買って 買った 買える 買われる 買わせる 買わせられる 買おう 買えば 買いたい 買ったら",
  "行く 行きます 行きました 行きません 行かない 行かなかった 行って 行った 行ける 行かれる 行かせる 行かせられる 行こう 行けば 行きたい 行ったら",
]);

const ICHIDAN_COLUMNS = [
  ["polite"],
  ["polite", "past"],
  ["polite", "negative"],
  ["negative"],
  ["negative", "past"],
  ["te"],
  ["past"],
  ["potential or passive"],
  ["potential"],
  ["causative"],
  ["causative", "passive"],
  ["volitional"],
  ["ba-conditional"],
  ["want to"],
  ["tara-conditional"],
];
const ICHIDAN = chart("i", ICHIDAN_COLUMNS, [
  "食べる 食べます 食べました 食べません 食べない 食べなかった 食べて 食べた 食べられる 食べれる 食べさせる 食べさせられる 食べよう 食べれば 食べたい 食べたら",
  "見る 見ます 見ました 見ません 見ない 見なかった 見て 見た 見られる 見れる 見させる 見させられる 見よう 見れば 見たい 見たら",
  "起きる 起きます 起きました 起きません 起きない 起きなかった 起きて 起きた 起きられる 起きれる 起きさせる 起きさせられる 起きよう 起きれば 起きたい 起きたら",
  "忘れる 忘れます 忘れました 忘れません 忘れない 忘れなかった 忘れて 忘れた 忘れられる 忘れれる 忘れさせる 忘れさせられる 忘れよう 忘れれば 忘れたい 忘れたら",
]);

const ADJECTIVE_COLUMNS = [
  ["past"],
  ["negative"],
  ["te"],
  ["adverbial"],
  ["ba-conditional"],
  ["tara-conditional"],
  ["negative", "past"],
  ["polite"],
  ["past", "polite"],
  ["looks like"],
  ["too much"],
];
const ADJECTIVE = chart("a", ADJECTIVE_COLUMNS, [
  "高い 高かった 高くない 高くて 高く 高ければ 高かったら 高くなかった 高いです 高かったです 高そう 高すぎる",
  "新しい 新しかった 新しくない 新しくて 新しく 新しければ 新しかったら 新しくなかった 新しいです 新しかったです 新しそう 新しすぎる",
  "美味しい 美味しかった 美味しくない 美味しくて 美味しく 美味しければ 美味しかったら 美味しくなかった 美味しいです 美味しかったです 美味しそう 美味しすぎる",
]);
const ADJECTIVE_YOI = chart(
  "a",
  ADJECTIVE_COLUMNS.filter((_, at) => at !== 9),
  ["良い 良かった 良くない 良くて 良く 良ければ 良かったら 良くなかった 良いです 良かったです 良すぎる"],
);

const NA_COLUMNS = [
  ["plain"],
  ["past"],
  ["polite"],
  ["polite", "past"],
  ["negative"],
  ["negative", "past"],
  ["polite", "negative"],
  ["negative"],
  ["tara-conditional"],
];
const NA = chart("n", NA_COLUMNS, [
  "静か 静かだ 静かだった 静かです 静かでした 静かではない 静かではなかった 静かではありません 静かじゃない 静かだったら",
  "好き 好きだ 好きだった 好きです 好きでした 好きではない 好きではなかった 好きではありません 好きじゃない 好きだったら",
  "元気 元気だ 元気だった 元気です 元気でした 元気ではない 元気ではなかった 元気ではありません 元気じゃない 元気だったら",
]);

const SURU_COLUMNS = [
  ["polite"],
  ["polite", "past"],
  ["polite", "negative"],
  ["negative"],
  ["negative", "past"],
  ["te"],
  ["past"],
  ["passive"],
  ["causative"],
  ["causative", "passive"],
  ["volitional"],
  ["ba-conditional"],
  ["want to"],
  ["tara-conditional"],
];
const SURU = [
  ...chart("s", SURU_COLUMNS, [
    "する します しました しません しない しなかった して した される させる させられる しよう すれば したい したら",
  ]),
  single("愛します", "愛する", "s", "polite"),
  single("愛しました", "愛する", "s", "polite", "past"),
  single("愛しません", "愛する", "s", "polite", "negative"),
  single("愛して", "愛する", "s", "te"),
  single("愛した", "愛する", "s", "past"),
  single("愛したい", "愛する", "s", "want to"),
  single("愛したら", "愛する", "s", "tara-conditional"),
  ...chart("s", SURU_COLUMNS, [
    "勉強 勉強します 勉強しました 勉強しません 勉強しない 勉強しなかった 勉強して 勉強した 勉強される 勉強させる 勉強させられる 勉強しよう 勉強すれば 勉強したい 勉強したら",
  ]),
];

const KURU_COLUMNS = [
  ["polite"],
  ["polite", "past"],
  ["polite", "negative"],
  ["negative"],
  ["negative", "past"],
  ["te"],
  ["past"],
  ["potential or passive"],
  ["causative"],
  ["volitional"],
  ["ba-conditional"],
  ["want to"],
];
const KURU = [
  ...chart("k", KURU_COLUMNS, [
    "来る 来ます 来ました 来ません 来ない 来なかった 来て 来た 来られる 来させる 来よう 来れば 来たい",
    "くる きます きました きません こない こなかった きて きた こられる こさせる こよう くれば きたい",
  ]),
];

const CHAINS = [
  single("食べたくなかった", "食べる", "i", "want to", "negative", "past"),
  single("食べさせられたくなかった", "食べる", "i", "causative", "passive", "want to", "negative", "past"),
  single("食べられなかった", "食べる", "i", "potential or passive", "negative", "past"),
  single("食べさせたい", "食べる", "i", "causative", "want to"),
  single("食べやすかった", "食べる", "i", "easy to", "past"),
  single("食べすぎた", "食べる", "i", "too much", "past"),
  single("食べそう", "食べる", "i", "looks like"),
  single("食べなさそう", "食べる", "i", "negative", "looks like"),
  single("食べなさい", "食べる", "i", "polite command"),
  single("食べないです", "食べる", "i", "negative", "polite"),
  single("食べなかったです", "食べる", "i", "negative", "past", "polite"),
  single("食べていた", "食べる", "i", "te", "continuous", "past"),
  single("食べてしまった", "食べる", "i", "te", "completed", "past"),
  single("食べちゃった", "食べる", "i", "te", "completed", "past"),
  single("食べてみる", "食べる", "i", "te", "try"),
  single("食べてください", "食べる", "i", "te", "request"),
  single("食べてくれる", "食べる", "i", "te", "given to me"),
  single("食べてあげた", "食べる", "i", "te", "given to another", "past"),
  single("書いている", "書く", "g", "te", "continuous"),
  single("書いてる", "書く", "g", "te", "continuous"),
  single("書いていた", "書く", "g", "te", "continuous", "past"),
  single("書いていない", "書く", "g", "te", "continuous", "negative"),
  single("書かせたくない", "書く", "g", "causative", "want to", "negative"),
  single("書きながら", "書く", "g", "while"),
  single("読みにくい", "読む", "g", "hard to"),
  single("読ませられた", "読む", "g", "causative", "passive", "past"),
  single("読んでおく", "読む", "g", "te", "prepared"),
  single("読んどく", "読む", "g", "te", "prepared"),
  single("飲んじゃった", "飲む", "g", "te", "completed", "past"),
  single("買ってもらった", "買う", "g", "te", "received", "past"),
  single("行かなければ", "行く", "g", "negative", "ba-conditional"),
  single("行かなくて", "行く", "g", "negative", "te"),
  single("行っている", "行く", "g", "te", "continuous"),
  single("いって", "いく", "g", "te"),
  single("いった", "いく", "g", "past"),
  single("見てみる", "見る", "i", "te", "try"),
  single("見ていく", "見る", "i", "te", "go on"),
  single("見てください", "見る", "i", "te", "request"),
  single("来ている", "来る", "k", "te", "continuous"),
  single("勉強していない", "勉強", "s", "te", "continuous", "negative"),
  single("勉強していた", "勉強", "s", "te", "continuous", "past"),
  single("高くなかったら", "高い", "a", "negative", "tara-conditional"),
  single("高くなくて", "高い", "a", "negative", "te"),
  single("高くなかったです", "高い", "a", "negative", "past", "polite"),
  single("高くありません", "高い", "a", "negative", "polite"),
  single("高くありませんでした", "高い", "a", "negative", "past", "polite"),
  single("高かったり", "高い", "a", "tari"),
  single("静かだったら", "静か", "n", "tara-conditional"),
  single("食べたり", "食べる", "i", "tari"),
  single("書いたり", "書く", "g", "tari"),
  single("食べました", "食べる", "i", "polite", "past"),
  single("食べませんでした", "食べる", "i", "polite", "negative", "past"),
  single("食べましょう", "食べる", "i", "polite", "volitional"),
  single("書きませんでした", "書く", "g", "polite", "negative", "past"),
  single("書きましょう", "書く", "g", "polite", "volitional"),
  single("持ってきた", "持ってくる", "k", "past"),
];

export const GOLDEN: readonly Golden[] = [
  ...GODAN,
  ...ICHIDAN,
  ...ADJECTIVE,
  ...ADJECTIVE_YOI,
  ...NA,
  ...SURU,
  ...KURU,
  ...CHAINS,
];

describe("the golden set of conjugated forms", () => {
  it("holds over three hundred forms, each with the note that a native reader should check it", () => {
    expect(GOLDEN.length).toBeGreaterThanOrEqual(300);
    expect(GOLDEN.every((one) => one.note.includes("native reader"))).toBe(true);
  });

  it("is proposed in full: every form gives its dictionary form, its kind and its path", () => {
    const missed = GOLDEN.filter(
      (one) =>
        !deinflect(one.form).some(
          (found) =>
            found.base === one.base && found.kind === one.kind && found.path.join(", ") === one.path.join(", "),
        ),
    ).map((one) => `${one.form} -> ${one.base} (${one.kind}) [${one.path.join(", ")}]`);
    expect(missed).toEqual([]);
  });
});
