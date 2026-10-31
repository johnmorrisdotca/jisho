---
title: "はじめに"
section: tutorial
order: 1
description: "パッケージを入れ、学年とレベルを読み、漢字を調べます。"
---

## インストール

```sh
npm install @johnmorrisdotca/moji
```

## リストを読む

表はそれぞれ独立したエントリポイントなので、インポートしてもその表だけが読み込まれます。

```ts
import {gradeOf,kanjiOfLevel} from "@johnmorrisdotca/moji";
import {GRADES} from "@johnmorrisdotca/moji/grades";
import {JLPT} from "@johnmorrisdotca/moji/jlpt";
console.log(gradeOf(GRADES,"語"));
console.log(kanjiOfLevel(JLPT,"N5").length);
```

## 漢字を調べる

`readKanji`は、保存された表を普通の行に変えます。ページで何度も調べるなら、一度だけ`Map`を作って残しておきます。

```ts
import {readKanji} from "@johnmorrisdotca/moji";
import {KANJI} from "@johnmorrisdotca/moji/kanji";
const byKanji=new Map(readKanji(KANJI).map((one)=>[one.kanji,one]));
console.log(byKanji.get("山")?.meanings);
```

## 次に読むもの

[漢字を探す](find-kanji.md)に手順があります。[形の似た漢字の測り方](look-alike.md)にはスコアの意味があり、[データの出どころ](data-sources.md)には出典の示し方があります。
