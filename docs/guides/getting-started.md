---
title: "Getting started"
section: tutorial
order: 1
description: "Install the package, look a word up, read a grade and a level, and look a kanji up."
---

## Install

```sh
npm install @johnmorrisdotca/jisho
```

## Read a list

Each table is an entry point of its own, so an import loads only that table.

```ts
import {gradeOf,kanjiOfLevel} from "@johnmorrisdotca/jisho";
import {GRADES} from "@johnmorrisdotca/jisho/grades";
import {JLPT} from "@johnmorrisdotca/jisho/jlpt";
console.log(gradeOf(GRADES,"語"));
console.log(kanjiOfLevel(JLPT,"N5").length);
```

## Look a kanji up

`readKanji` turns the stored table into plain rows. Build a `Map` once and keep it, if a page looks up more than a few.

```ts
import {readKanji} from "@johnmorrisdotca/jisho";
import {KANJI} from "@johnmorrisdotca/jisho/kanji";
const byKanji=new Map(readKanji(KANJI).map((one)=>[one.kanji,one]));
console.log(byKanji.get("山")?.meanings);
```

## Look a word up

Words are fetched in small pieces, only the ones a lookup needs, so `loadWords` waits and `wordsOf` does not.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ");
console.log(wordsOf(words,"かみ")[0]?.meaning);
```

## What to read next

[Look words up](words.md) says how to look a word up by its reading or its written form, how to keep what is not for children out, and how to keep the dictionary out of a server's bundle. [Find kanji](find-kanji.md) has the recipes, [how the look-alike pairs are measured](look-alike.md) says what a score means, and [where the data comes from](data-sources.md) says what you must credit.
