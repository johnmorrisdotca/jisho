---
title: "Getting started"
section: tutorial
order: 1
description: "Install the package, read a grade and a level, and look a kanji up."
---

## Install

```sh
npm install @johnmorrisdotca/moji
```

## Read a list

Each table is an entry point of its own, so an import loads only that table.

```ts
import {gradeOf,kanjiOfLevel} from "@johnmorrisdotca/moji";
import {GRADES} from "@johnmorrisdotca/moji/grades";
import {JLPT} from "@johnmorrisdotca/moji/jlpt";
console.log(gradeOf(GRADES,"語"));
console.log(kanjiOfLevel(JLPT,"N5").length);
```

## Look a kanji up

`readKanji` turns the stored table into plain rows. Build a `Map` once and keep it, if a page looks up more than a few.

```ts
import {readKanji} from "@johnmorrisdotca/moji";
import {KANJI} from "@johnmorrisdotca/moji/kanji";
const byKanji=new Map(readKanji(KANJI).map((one)=>[one.kanji,one]));
console.log(byKanji.get("山")?.meanings);
```

## What to read next

[Find kanji](find-kanji.md) has the recipes, [how the look-alike pairs are measured](look-alike.md) says what a score means, and [where the data comes from](data-sources.md) says what you must credit.
