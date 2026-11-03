---
title: "Example sentences"
section: how-to
order: 3
description: "Fetch the sentences that show a word, each linked to the sense it shows, with furigana, English, a JLPT level and the credit each one must carry."
---

`loadExamples` gives the example sentences of a word. Each is linked to the sense of the word it shows, and comes with its furigana, its English, the JLPT level of its kanji and who wrote it. They are in an entry point of their own, `@johnmorrisdotca/jisho/examples`, so a page that only looks words up never carries them.

## Fetch the examples of a word

```ts
import { exampleCredit, loadExamples } from "@johnmorrisdotca/jisho/examples";
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const word = wordsOf(await loadWords("犬"), "犬")[0];
for (const one of word === undefined ? [] : await loadExamples(word)) {
  console.log(one.japanese, one.english, one.level);
  console.log(exampleCredit(one));
}
```

`loadExamples` takes a word a lookup gave, or the number of its entry, and gives an empty list for a word with no example. One piece of about 20 kB gzipped is fetched for a word, and kept for the next word in it. `{ sense: 2 }` keeps the examples of one sense, by the number `Entry.senses[].number` gives it. The answer is frozen.

## What an example holds

| Field | What it is |
| --- | --- |
| `sense` | The number of the sense it shows, as `loadEntry` numbers them. |
| `japanese` | The sentence as Tatoeba has it. |
| `furigana` | The sentence in pieces, each kanji piece with its reading, which put together are `japanese`. One piece when none is known. |
| `english` | The English translation. |
| `level` | The hardest JLPT level among its kanji (`N5` for a sentence with none), or `null` when a kanji in it is on no list. |
| `headword` | The word as the sentence has it, which may be conjugated. |
| `credit` | The Tatoeba number of the sentence, and the names of the authors of the Japanese and of the English where Tatoeba names them. |

A sentence with full-width digits or letters has no furigana: its text is made plain to be read, and the furigana would no longer fit what is shown.

## Credit each sentence

The sentences are Tatoeba's, under CC BY 2.0 FR, and a page that shows one has to credit its author. `exampleCredit(example)` makes the line: `Tatoeba #162365, Japanese by alice, English by bob (CC BY 2.0 FR)`. A sentence taken over from the Tanaka Corpus has no user to name, and is still Tatoeba's, so the line then names only the sentence. Link the number to `https://tatoeba.org/sentences/show/<number>` where you can.

## Safe by default

`loadExamples(word)` is in safe mode. It leaves out an example of a sense JMdict marks vulgar, X-rated, sensitive or derogatory, a sentence that the file also links to such a sense of another word, and a sentence in which safe mode does not find the words unfiltered mode finds. Nothing that holds them is fetched. `loadExamples(word, { mode: "unfiltered" })` gives every example, from one more piece. Jisho keeps no list of words of its own, so a sentence that is rude only in its English, with words JMdict does not mark, is among the default ones. A page for children should check what it shows.

## Where the furigana and the levels come from

The links from a sense to a sentence are the EDRDG's (JMdict_e_examp). The furigana are made by this package's own `readText` and the levels from the JLPT lists of the kanji; they have the limits `readText` has (it takes the longest word, not the best reading), and no native reader has checked them.

## What it costs

The examples are 145 pieces of about 20 kB gzipped for 28,813 words, and one more for the words whose list safe mode cuts. Together they make the package 2.9 MB larger to download.
