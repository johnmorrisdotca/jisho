---
title: "The whole entry of a word"
section: how-to
order: 3
description: "Fetch every sense of a word with its part of speech, field, dialect, cross-references, antonyms, notes and loanword sources, and the marks of its written forms and readings."
---

A word from `loadWords` is a short row: up to four senses, three glosses each. `loadEntry` fetches the whole entry of JMdict for a word, in an entry point of its own, `@johnmorrisdotca/jisho/entries`, so that a page that only looks words up never carries it.

## Fetch an entry

```ts
import { loadEntry } from "@johnmorrisdotca/jisho/entries";
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const words = await loadWords("かみ");
const word = wordsOf(words, "かみ")[0];
const entry = word === undefined ? null : await loadEntry(word);
for (const sense of entry?.senses ?? []) console.log(sense.pos.join(","), sense.glosses.map((gloss) => gloss.text).join("; "));
```

A `Word` has `id`, the number JMdict gives its entry, and `loadEntry` takes the word or the number. One piece of about 40 kB gzipped is fetched for an entry, and kept for the next entry in it. The answer is `null` when JMdict has no entry by that number. Every object in an entry is frozen.

## What an entry holds

| Field | What it is |
| --- | --- |
| `id` | The number JMdict gives the entry. |
| `forms` | The written forms, each with its marks (`ateji`, `rK`, `iK`…). |
| `readings` | The readings, each with its marks, the written forms it goes with (`onlyForms`) and `noKanji`. |
| `senses[].number` | The number JMdict gives the sense, counting from 1. It is the number a cross-reference means, and it stays the same when safe mode leaves out a sense before it. |
| `senses[].pos` | The parts of speech, as JMdict's codes (`n`, `v5r`, `vt`, `adj-i`…). |
| `senses[].marks` | Usage, field and dialect codes, the same marks a row's sense has. |
| `senses[].glosses` | Every gloss, each with its `kind` when JMdict says: `lit`, `expl`, `fig` or `tm`. |
| `senses[].onlyForms`, `onlyReadings` | The written forms or readings the sense is limited to. |
| `senses[].seeAlso`, `antonyms` | Cross-references, as JMdict writes them. |
| `senses[].notes` | Notes on the sense, such as "usu. in the negative". |
| `senses[].sources` | The languages a loanword comes from, each with the word, and whether it is partial or a word made in Japan (`wasei`). |

## Cross-references

JMdict writes a reference as the word, its reading and the number of the sense, apart by `・`, each of them optional. `referenceOf` reads one:

```ts
import { referenceOf } from "@johnmorrisdotca/jisho/entries";

console.log(referenceOf("天神・6")); // { written: "天神", reading: undefined, sense: 6 }
console.log(referenceOf("神・かみ・1").reading); // かみ
```

Look the `written` of a reference up with `loadWords` to follow it.

## Safe by default

`loadEntry(word)` is in safe mode: a sense JMdict marks vulgar, X-rated, sensitive or derogatory is not in the entry, nor the written forms and readings that only such a sense applies to, and an entry of which every sense is marked is not there at all. Nothing that holds them is fetched. `loadEntry(word, { mode: "unfiltered" })` gives the entry whole, from one more piece. Use the mode the word was found in.

```ts
import { loadEntry } from "@johnmorrisdotca/jisho/entries";

const safe = await loadEntry(1_094_860);
const whole = await loadEntry(1_094_860, { mode: "unfiltered" });
console.log(safe?.senses.length, whole?.senses.length);
```

## What it costs

The entries are 220 pieces of about 40 kB gzipped, and 3 more for the entries safe mode cuts, which only an unfiltered lookup fetches. Together they make the package 9.7 MB larger to download (13.8 to 23.6 MB; 26.4 MB with the [example sentences](example-sentences.md)). A page that imports `words` and never `entries` fetches and bundles nothing more than it did, except that every row now carries its entry's number: the rows are 24 pieces more (294 to 318) of the same size, 1 MB more gzipped in all.

## Not here: other languages

JMdict has glosses in German, French, Russian, Spanish, Dutch, Hungarian, Swedish and Slovenian. They are not in this package. The EDRDG licence puts only the Japanese and English parts of JMdict under CC BY-SA 4.0; section 2 of its statement says the translations in other languages "are covered by separate copyright held by the compilers of that material". Jisho uses no file whose terms it has not been able to read.
