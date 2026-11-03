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
├── words.ts   the words entry point: what it exports, from the files below
├── words.types.ts  the shapes of the tables and of the words
├── words-text.ts   a text made plain (NFKC, spaces, invisible characters, the long vowel mark), and the English terms of a meaning
├── words-rows.ts   a row read into a word, with its priority tags and rank
├── words-pieces.ts fetching a piece once, retrying it, and the error that names it
├── words-load.ts   loadWords: the pieces of the dictionary some texts are in
├── words-lookup.ts reading what was loaded: wordsOf, meaningOf, isLoaded, allWords
├── words-common.ts the common words as one table
├── words-search.ts words by what they mean, and by a kanji in them
├── words-filter.ts  the small tools for what a lookup returned
├── words-inflected.ts findInflected and inflectedOf: a conjugated text, found by the dictionary form it comes from
├── deinflect.ts  the rule table of endings: the dictionary forms a conjugated word could come from, and the path. No data
├── romaji.ts  romaji into hiragana, Hepburn and Kunrei
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
        ├── index-manifest.data.ts  where the pieces of the indexes by meaning and by kanji start
        ├── index-extra-manifest.data.ts  the same for what safe mode leaves out of those indexes
        ├── r000.data.ts …    pieces of rows, by reading
        ├── f00.data.ts …     pieces of the index from each written form to its readings
        ├── m000.data.ts …    pieces of the index from each English term to the readings of the words that have it
        ├── k00.data.ts …     pieces of the index from each kanji to the readings of the words written with it
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
