---
title: "Architecture"
section: explanation
order: 7
description: "How the source is laid out, and why."
---

## Architecture

The main entry holds types and plain functions and no data. Each table is an entry point of its own, so a page pays only for what it imports. `src/data/` is machine output, written by `scripts/build-data.mjs`, and `src/data/words/` by `scripts/build-words.mjs`. The words are the one table cut into pieces: `words-load.ts` finds the piece a lookup needs and `words-pieces.ts` fetches it, once however many lookups ask at the same moment, with one retry and a typed error. The indexes that find words by meaning and by kanji are pieces of their own, which `words-search.ts` fetches only when one of those lookups is made.

```text
src/
├── index.ts   the types, and the functions that read the kanji tables
├── entries.ts the entries entry point: loadEntry, readEntry and referenceOf, which are not in words, so a page that looks words up never carries the whole entries
├── words.ts   the words entry point: what it exports, from the files below
├── words.types.ts  the shapes of the tables and of the words
├── words-text.ts   a text made plain (NFKC, spaces, invisible characters, the long vowel mark), and the English terms of a meaning
├── words-rows.ts   a row read into a word, with its priority tags and rank
├── words-pieces.ts fetching a piece once, retrying it, and the error that names it
├── words-manifests.ts the small files that say where the pieces are: the only places that name a file of data, so that `entries` carries none of the words
├── words-load.ts   loadWords: the pieces of the dictionary some texts are in
├── words-lookup.ts reading what was loaded: wordsOf, meaningOf, isLoaded, allWords
├── words-common.ts the common words as one table
├── words-search.ts words by what they mean, and by a kanji in them
├── words-filter.ts  the small tools for what a lookup returned
├── examples.ts the examples entry point: loadExamples, exampleCredit and furiganaOfExample, which are not in words, so a page that looks words up never carries the sentences
├── words-examples.ts loadExamples: the example sentences of a word, each linked to the sense it shows, fetched in a piece of their own
├── strokes.ts  the strokes entry point: loadStrokes, strokeOrderSvg (the stroke order, written out) and findByDrawing (a kanji found by drawing it)
├── words-suggest.ts suggestWords: the common words one slip from what was typed, for a lookup that found nothing
├── words-entry.ts  loadEntry: the whole entry of a word, with every sense and what JMdict says of it, fetched in a piece of its own
├── words-inflected.ts findInflected and inflectedOf: a conjugated text, found by the dictionary form it comes from
├── reader.ts     readText: a text cut into words by the longest match, with furigana, meanings and levels
├── furigana.ts   which kana read which kanji of a word, and of a conjugated form of it
├── study-list.ts the words of a text that was read, once each, as rows and as CSV or TSV
├── deinflect.ts  the rule table of endings: the dictionary forms a conjugated word could come from, and the path. No data
├── romaji.ts  romaji into hiragana, Hepburn and Kunrei
├── version.ts the package's version
└── data/      the tables, each its own entry point
    ├── grades.data.ts      the school grades
    ├── jlpt.data.ts        the JLPT levels
    ├── kanji.data.ts       readings, meanings, strokes and ranks
    ├── look-alike.data.ts  the pairs that look alike
    ├── strokes/            the stroke order of the kanji, written by a script
    │   ├── stroke-manifest.data.ts  where each piece of the strokes starts, and how to fetch it
    │   └── t00.data.ts …     pieces of the strokes, by kanji, from KanjiVG
    ├── examples/           the example sentences, written by a script
    │   ├── example-manifest.data.ts  where each piece of the examples starts, and how to fetch it
    │   ├── example-extra-manifest.data.ts  the same for the lists safe mode cuts, fetched only unfiltered
    │   ├── s000.data.ts …    pieces of the examples, by the number of the entry in JMdict
    │   └── xs0.data.ts …     the whole lists of the entries whose examples safe mode cuts, fetched only unfiltered
    └── words/              the words, written by a script
        ├── common.data.ts    the common words safe mode keeps, in one table
        ├── common-extra.data.ts  what to add to them to have every common word
        ├── manifest.data.ts  where each piece starts, and how to fetch it
        ├── extra-manifest.data.ts  the same for the pieces of what safe mode leaves out
        ├── index-manifest.data.ts  where the pieces of the indexes by meaning and by kanji start
        ├── index-extra-manifest.data.ts  the same for what safe mode leaves out of those indexes
        ├── r000.data.ts …    pieces of rows, by reading
        ├── f00.data.ts …     pieces of the index from each written form to its readings
        ├── m000.data.ts …    pieces of the index from each English term to the readings of the words that have it
        ├── k00.data.ts …     pieces of the index from each kanji to the readings of the words written with it
        ├── entry-manifest.data.ts  where each piece of the whole entries starts, and how to fetch it
        ├── entry-extra-manifest.data.ts  the same for the whole entries safe mode cuts, fetched only unfiltered
        ├── e000.data.ts …    pieces of the whole entries, by their number in JMdict
        ├── xe0.data.ts …     the whole entries that have a sense safe mode leaves out, fetched only unfiltered
        ├── xr0.data.ts …     pieces of what safe mode leaves out, by reading, fetched only unfiltered
        ├── xf0.data.ts …     the same for the index of written forms
        ├── xm0.data.ts …     the same for the index by meaning
        └── xk0.data.ts …     the same for the index by kanji
```text
src/
├── index.ts   the types, and the functions that read the kanji tables
├── words.ts   looking words up, in pieces fetched as needed
├── words-filter.ts  the small tools for what a lookup returned
├── version.ts the package's version
└── data/      the tables, each its own entry point
    ├── grades.data.ts      the school grades
    ├── jlpt.data.ts        the JLPT levels
    ├── kanji.data.ts       readings, meanings, strokes and ranks
    ├── look-alike.data.ts  the pairs that look alike
    └── words/              the words, written by a script
        ├── common.data.ts    the common words safe mode keeps, in one table
        ├── common-extra.data.ts  what to add to them to have every common word
        ├── manifest.data.ts  where each piece starts, and how to fetch it
        ├── extra-manifest.data.ts  the same for the pieces of what safe mode leaves out
        ├── r000.data.ts …    pieces of rows, by reading
        ├── f00.data.ts …     pieces of the index from each written form to its readings
        ├── xr0.data.ts …     pieces of what safe mode leaves out, by reading, fetched only unfiltered
        └── xf0.data.ts …     the same for the index of written forms
```
