---
title: "テキストを読む"
section: how-to
order: 3
description: "日本語のテキストを最長一致で単語に分け、各語にふりがな、意味、JLPTレベル、漢字の学年を付けます。見つからなかったものを一覧にし、学習リストをCSVかTSVで取り出します。"
---

## テキストを単語に分ける

`readText`はテキストを受け取り、その部分を順番どおりに返します。単語にはふりがな、読み、意味、レベルが付きます。どの単語にも当てはまらない日本語は`unknown`、空白、句読点、アルファベット、数字は`other`です。

```ts
import {readText} from "@johnmorrisdotca/jisho/words";
const result=await readText("私は昨日、友達と学校に行きました。");
for (const token of result.tokens) console.log(token.kind,token.text,token.reading,token.level,token.meaning.slice(0,20));
console.log(result.unknown);
```

`ReadToken`には、`text`（書かれたとおり）、`kind`（`word`、`unknown`、`other`）、`word`（辞書の単語）、`form`（テキストの綴りでの辞書形）、`path`（辞書形からどう変化したか。「行きました」は「行く」の`["polite", "past"]`）、`furigana`（テキストを部分に分け、漢字の部分にかなを付けたもの）、`reading`（全体をひらがなで）、`meaning`、`level`、`kanji`、`alternatives`があります。部分をつなげると`result.text`になるので、ページは各語をボタンにしてテキストを描けます。

```ts
import {readText} from "@johnmorrisdotca/jisho/words";
const result=await readText("食べなかった");
const [token]=result.tokens;
console.log(token?.furigana);
console.log(token?.form,token?.path);
console.log(token?.kanji);
```

## 語の選び方

`readText`は、各位置から、辞書に語がある最も長い部分（そのままの形か、語の活用形）を取ります（[活用した形の単語を引く](conjugated-words.md)を参照）。さらに、長いほうの数候補について、その次に来る語の長さも比べるので、「今日はいい天気」は「今日」「は」「いい天気」に分かれ、「今日」「はい」「い天気」にはなりません。辞書にたくさんある珍しい語に引きずられないよう、次の3つの決まりがあります。

- 部分が語として認められるのは、その語がよく使う語であるか、漢字を含むか、4文字以上のときです。かな1〜3文字の珍しい語は認められません。
- カタカナ1文字は語になりません。名前の途中とみなします。
- かなだけの文字列は、ふつうかなで書く語として読みます。「は」は助詞であり、「葉」や「歯」ではありません。

同じ長さの候補では、最もよく使う語を取り、ほかは読みとともに`alternatives`に入ります。漢字があって読みが複数ある語は、JMdictが順位を付けた中で最もよく使う読みになります。漢字1字の語では、これが違う読みになることがあります（「本」は「ほん」より先に「もと」）。そのときは`alternatives`にほかの読みがあります。

## レベル

Jishoには、漢字のJLPTレベルと学年はありますが、単語にはありません。単語の`level`は、含まれる漢字のうち最も難しいレベル（N1はN5より難しい）です。漢字がない語や、Wallerのリストにどの漢字もない語はnullです。`kanji`には、テキストの各漢字の学年（1〜6、中学以降は8、人名用は9と10、表に行がない漢字はnull）とレベルが入ります。

## ふりがな

`furigana`はルビに必要なものです。`reading`がある部分は漢字で、それ以外はかなです。活用した形では、2つの綴りが同じところまでは辞書形の部分をそのまま使います。「食べる」（たべる）からの「食べなかった」は、「食」（た）と「べなかった」です。「来」は語尾に合わせた読み（こない、きます、くれば）になります。`furiganaOf(written, reading)`と`furiganaOfSurface(surface, base, reading)`は、単独でも使えます。

## 見つからなかったもの

どの語にも当てはまらない部分は`result.unknown`に1つずつ並び、`tokens`でも元の位置に残ります。セーフモードでは、モードが除く語も見つからないので、その文字列も並びます。区別するにはフィルターなしで読んでください。名前、新しい語、打ち間違いが、よくある未知の語です。

## 学習リスト

`studyList(result)`は、各語を1回ずつ、出てきた順に、読み、意味、レベル、漢字の学年のうち最も高いもの、テキストに出てきた回数、最初に出てきた形とともに返します。`{ kanjiOnly: true }`にすると、助詞など漢字のない語を除きます。`studyListText(rows, "csv")`は見出し行付きで、必要なものを引用符で囲み、表計算ソフト向けです。`"tsv"`はタブ区切りで見出しなしなので、表計算ソフトへの貼り付けや、暗記カードのソフトへの取り込みに使えます。

```ts
import {readText,studyList,studyListText} from "@johnmorrisdotca/jisho/words";
const result=await readText("私は食べなかった。私は食べた。");
console.log(studyListText(studyList(result,{kanjiOnly:true}),"csv"));
```

## かかる量と限界

Jisho自身のチャンク（それぞれgzip圧縮後で約25 kB）を、部分が必要とするだけ取得します。15文字の最初の文で約30個でした。取得したチャンクは（同時に64個まで）保持されるので、次のテキストでは多くが再利用されます。読むのは`MAX_READ_LENGTH`（5,000）文字までで、切ったときは`truncated`で分かります。文法は持たず、文の最もよい読み方ではなく最も長い語を選ぶので、珍しい長い語が選ばれることがあり、名前は見つからないか小さな語に分かれることがあります。チャンクの取得のほかは、何も保存せず、どこにも送りません。

## 関連

- [活用した形の単語を引く](conjugated-words.md)：対応している語尾。
- [単語を引く](words.md)：土台になる検索と、セーフモード、フィルターなし。
- [漢字を探す](find-kanji.md)：報告される学年とレベル。
