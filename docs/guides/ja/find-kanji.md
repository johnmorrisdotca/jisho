---
title: "漢字を探す"
section: how-to
order: 2
description: "学年とレベルのリスト、文章の中の漢字、検索、見間違えやすい漢字。"
---

## 小学校で習う漢字

```ts
import {ELEMENTARY_GRADES,JOYO_GRADES,kanjiOfGrade} from "@johnmorrisdotca/moji";
import {GRADES} from "@johnmorrisdotca/moji/grades";
console.log(ELEMENTARY_GRADES.flatMap((grade)=>kanjiOfGrade(GRADES,grade)).length);
console.log(JOYO_GRADES.flatMap((grade)=>kanjiOfGrade(GRADES,grade)).length);
```

## 文章の難しさ

`kanjiIn`は文章から漢字を取り出し、`levelOf`はそれぞれがどのリストにあるかを返します。

```ts
import {kanjiIn,levelOf} from "@johnmorrisdotca/moji";
import {JLPT} from "@johnmorrisdotca/moji/jlpt";
console.log(kanjiIn("日本語を勉強します").map((one)=>[one,levelOf(JLPT,one)]));
```

## 読みや意味で検索する

`searchKanji`には、漢字、音読みや訓読み、英語かフランス語の意味を渡せます。言葉がそのまま一致するものが先に、含むものが後に、それぞれよく使う順に並びます。

```ts
import {readKanji,searchKanji} from "@johnmorrisdotca/moji";
import {KANJI} from "@johnmorrisdotca/moji/kanji";
console.log(searchKanji(readKanji(KANJI),"mountain").slice(0,3).map((one)=>one.kanji));
```

## 見間違えやすい漢字

```ts
import {lookAlikes} from "@johnmorrisdotca/moji";
import {LOOK_ALIKE} from "@johnmorrisdotca/moji/look-alike";
console.log(lookAlikes(LOOK_ALIKE,"土").map((one)=>one.kanji));
console.log(lookAlikes(LOOK_ALIKE,"千",{atLeast:60}).map((one)=>one.kanji));
```

`atLeast`は取り入れる最低のスコア、`max`は返す数の上限です。選び方は[形の似た漢字の測り方](look-alike.md)にあります。
