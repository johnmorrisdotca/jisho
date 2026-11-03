---
title: "はじめに"
section: tutorial
order: 1
description: "パッケージを入れ、単語を引き、学年とレベルを読み、漢字を調べます。"
---

## インストール

```sh
npm install @johnmorrisdotca/jisho
```

## リストを読む

表はそれぞれ独立したエントリポイントなので、インポートしてもその表だけが読み込まれます。

```ts
import {gradeOf,kanjiOfLevel} from "@johnmorrisdotca/jisho";
import {GRADES} from "@johnmorrisdotca/jisho/grades";
import {JLPT} from "@johnmorrisdotca/jisho/jlpt";
console.log(gradeOf(GRADES,"語"));
console.log(kanjiOfLevel(JLPT,"N5").length);
```

## 漢字を調べる

`readKanji`は、保存された表を普通の行に変えます。ページで何度も調べるなら、一度だけ`Map`を作って残しておきます。

```ts
import {readKanji} from "@johnmorrisdotca/jisho";
import {KANJI} from "@johnmorrisdotca/jisho/kanji";
const byKanji=new Map(readKanji(KANJI).map((one)=>[one.kanji,one]));
console.log(byKanji.get("山")?.meanings);
```

## 単語を引く

単語は小さなチャンクに分かれていて、引くときに必要なものだけを取得します。そのため`loadWords`は非同期で`await`が必要ですが、`wordsOf`はすぐに答えます。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ");
console.log(wordsOf(words,"かみ")[0]?.meaning);
```

## 次に読むもの

[単語を引く](words.md)には、読みや表記で単語を引く方法、セーフモードとフィルターなしを選ぶ方法、自分のリストを渡す方法、サーバーのバンドルにこの辞書を入れない方法があります。単語は、[英語の意味](find-by-meaning.md)、[含まれる漢字](words-by-kanji.md)、[ローマ字](romaji.md)からも探せます。[どれくらいよく使う語か](word-rank.md)、[活用した形の単語を引く](conjugated-words.md)、[変わった入力と、読み込めないチャンク](odd-input-and-errors.md)にも、それぞれガイドがあります。[漢字を探す](find-kanji.md)に手順があります。[形の似た漢字の測り方](look-alike.md)にはスコアの意味があり、[データの出どころ](data-sources.md)には出典の示し方があります。
