---
title: "Find words by a kanji"
section: how-to
order: 3
description: "Find the commonest words written with a kanji, and link each word to the kanji table to show its grade, level, readings and meanings."
---

## Find words by a kanji

`wordsWithKanji` finds the commonest words written with a kanji, each shown by the written form that holds it, and `kanjiOfWord` links a word to the kanji table, so that a word can show its kanji with their grade, level, readings and meanings. The index holds the commonest sixty words for each kanji.

```ts
import {readKanji} from "@johnmorrisdotca/jisho";
import {KANJI} from "@johnmorrisdotca/jisho/kanji";
import {kanjiOfWord,wordsWithKanji} from "@johnmorrisdotca/jisho/words";
const table=readKanji(KANJI);
for (const word of await wordsWithKanji("山",{limit:3}))
  console.log(word.written,word.meaning,kanjiOfWord(word,table).map((one)=>`${one.kanji} ${one.level}`));
```

A text with no kanji in it finds nothing. If it has several, the first is used.

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
