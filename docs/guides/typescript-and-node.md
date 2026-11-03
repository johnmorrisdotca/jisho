---
title: "TypeScript and Node"
section: how-to
order: 11
description: "Use the package's types, and look words up in Node on a server or in a script."
---

The package ships its own types and runs on Node 22 or later and in any current browser. It is ES modules; Node 22.12 or later can also `require()` it.

## Types

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

`Word`, `WordsMode`, `SchoolGrade` and `JlptLevel` describe what the functions take and give. A mode that does not exist is a type error, not a surprise at run time; the last function shows that, and the line before the call is the error TypeScript is told to expect. With `"moduleResolution": "bundler"`, `"node16"` or `"nodenext"`, every entry point has its types.

## In Node

```js
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const words = await loadWords("かみ");
for (const one of wordsOf(words, "かみ").slice(0, 3)) console.log(one.written, one.meaning);
```

Node reads the pieces from the installed package, so a script or a server needs no bundler. The words in the first piece are cached for the next lookup, up to 64 pieces; [Look words up](words.md) says how the cache works and what a lookup costs.
