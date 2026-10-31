---
title: "Architecture"
section: explanation
order: 7
description: "How the source is laid out, and why."
---

## Architecture

The main entry holds types and plain functions and no data. Each table is an entry point of its own, so a page pays only for what it imports. `src/data/` is machine output, written by `scripts/build-data.mjs`.

```text
src/
├── index.ts   the types, and the functions that read the tables
├── version.ts the package's version
└── data/      the tables, each its own entry point
    ├── grades.data.ts      the school grades
    ├── jlpt.data.ts        the JLPT levels
    ├── kanji.data.ts       readings, meanings, strokes and ranks
    └── look-alike.data.ts  the pairs that look alike
```
