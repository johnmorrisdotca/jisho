---
title: "Architecture"
section: explanation
order: 7
description: "How the source is laid out, and why."
---

## Architecture

The main entry holds types and plain functions and no data. Each table is an entry point of its own, so a page pays only for what it imports. `src/data/` is machine output, written by `scripts/build-data.mjs`, and `src/data/words/` by `scripts/build-words.mjs`. The words are the one table cut into pieces: `words.ts` finds the piece a lookup needs and fetches it.

```text
src/
├── index.ts   the types, and the functions that read the kanji tables
├── words.ts   looking words up, in pieces fetched as needed
├── version.ts the package's version
└── data/      the tables, each its own entry point
    ├── grades.data.ts      the school grades
    ├── jlpt.data.ts        the JLPT levels
    ├── kanji.data.ts       readings, meanings, strokes and ranks
    ├── look-alike.data.ts  the pairs that look alike
    └── words/              the words, written by a script
        ├── common.data.ts    the common words fit for children, in one table
        ├── common-extra.data.ts  what to add to them to have every common word
        ├── extra.data.ts     everything the pieces leave out, fetched only when asked for
        ├── manifest.data.ts  where each piece starts, and how to fetch it
        ├── r000.data.ts …    pieces of rows, by reading
        └── f00.data.ts …     pieces of the index from each written form to its readings
```
