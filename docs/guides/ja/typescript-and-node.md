---
title: "TypeScriptとNode"
section: how-to
order: 11
description: "このパッケージの型を使い、Nodeのサーバーやスクリプトで単語を引きます。"
---

このパッケージは型を同梱していて、Node 22以降と、いまのブラウザで動きます。ESモジュールで、Node 22.12以降なら`require()`もできます。

## 型

```ts
import { gradeOf, type JlptLevel, levelOf, type SchoolGrade } from "@johnmorrisdotca/jisho";
import { GRADES } from "@johnmorrisdotca/jisho/grades";
import { JLPT } from "@johnmorrisdotca/jisho/jlpt";
import { loadWords, type Word, type WordsMode, wordsOf } from "@johnmorrisdotca/jisho/words";

const mode: WordsMode = "safe";
const words = await loadWords("かみ", { mode });
const first: Word | undefined = wordsOf(words, "かみ")[0];
const grade: SchoolGrade | null = gradeOf(GRADES, "語");
const level: JlptLevel | null = levelOf(JLPT, "語");
console.log(first?.written, grade, level);

export function refused(): void {
  // @ts-expect-error "careful" is not a mode
  void loadWords("かみ", { mode: "careful" });
}
```

`Word`、`WordsMode`、`SchoolGrade`、`JlptLevel`が、関数が受け取るものと返すものを表します。存在しないモードは、実行時に驚くのではなく、型エラーになります。最後の関数がその例で、呼び出しの前の行が、TypeScriptに「ここでエラーになる」と伝えるものです。`"moduleResolution"`が`"bundler"`、`"node16"`、`"nodenext"`のとき、どのエントリポイントにも型があります。

## Nodeで

```js
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const words = await loadWords("かみ");
for (const one of wordsOf(words, "かみ").slice(0, 3)) console.log(one.written, one.meaning);
```

Nodeはインストールされたパッケージからチャンクを読むので、スクリプトやサーバーにバンドラーは要りません。最初に読んだチャンクは次の検索のために覚えておきます（最大64チャンク）。キャッシュの仕組みと検索の費用は[単語を引く](words.md)にあります。
