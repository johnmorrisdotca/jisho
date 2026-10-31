---
title: "Find kanji"
section: how-to
order: 2
description: "Lists by grade and level, the kanji in a text, a search, and what can be mistaken for what."
---

## The elementary-school kanji

```ts
import {ELEMENTARY_GRADES,JOYO_GRADES,kanjiOfGrade} from "@johnmorrisdotca/moji";
import {GRADES} from "@johnmorrisdotca/moji/grades";
console.log(ELEMENTARY_GRADES.flatMap((grade)=>kanjiOfGrade(GRADES,grade)).length);
console.log(JOYO_GRADES.flatMap((grade)=>kanjiOfGrade(GRADES,grade)).length);
```

## How hard a piece of text is

`kanjiIn` takes the kanji out of a text, and `levelOf` says which list holds each one.

```ts
import {kanjiIn,levelOf} from "@johnmorrisdotca/moji";
import {JLPT} from "@johnmorrisdotca/moji/jlpt";
console.log(kanjiIn("日本語を勉強します").map((one)=>[one,levelOf(JLPT,one)]));
```

## Search by a reading or a meaning

`searchKanji` takes a kanji, an on or kun reading, or a meaning in English or French. Those that are exactly the word come first, then those that hold it, the commonest first in each.

```ts
import {readKanji,searchKanji} from "@johnmorrisdotca/moji";
import {KANJI} from "@johnmorrisdotca/moji/kanji";
console.log(searchKanji(readKanji(KANJI),"mountain").slice(0,3).map((one)=>one.kanji));
```

## What a kanji can be mistaken for

```ts
import {lookAlikes} from "@johnmorrisdotca/moji";
import {LOOK_ALIKE} from "@johnmorrisdotca/moji/look-alike";
console.log(lookAlikes(LOOK_ALIKE,"土").map((one)=>one.kanji));
console.log(lookAlikes(LOOK_ALIKE,"千",{atLeast:60}).map((one)=>one.kanji));
```

`atLeast` is the lowest score to take, and `max` how many to give back; [how the pairs are measured](look-alike.md) says how to choose them.
