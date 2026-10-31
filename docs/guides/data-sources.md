---
title: "Where the data comes from"
section: explanation
order: 4
description: "The three sources, their terms, and what you must credit."
---

## Three sources, each with its own terms

| Entry point | Made from | Terms |
| --- | --- | --- |
| `grades` | KANJIDIC2, of the Electronic Dictionary Research and Development Group | CC BY-SA 4.0 and the Group's conditions |
| `jlpt` | Jonathan Waller's JLPT Resources, tanos.co.uk | CC BY |
| `kanji` | KANJIDIC2, with Waller's levels | CC BY-SA 4.0 and the Group's conditions; the levels CC BY |
| `look-alike` | Lars Yencken's kanji confusion datasets | CC BY 3.0 |

The full notices are in [NOTICE.md](../../NOTICE.md), and each file's address, date and SHA-256 in [sources.json](../../data-sources/sources.json).

## What you must do

A page that shows the data credits it. A page showing KANJIDIC2's data must say so on that screen, and a project that passes on `grades` or `kanji` passes on the share-alike terms for those tables. Code that merely imports them is not changed by that. NOTICE.md has wording to use.

## The JLPT levels are one person's

The test has published no list of kanji since its present five levels began in 2010. Waller's lists are the ones people use, and they are a reconstruction: a level here says which of his lists holds a kanji, not what the test will ask.

## School grades and the numbers

KANJIDIC2 numbers grades 1 to 6 for elementary school, 8 for the rest of the jōyō kanji, 9 for kanji allowed in names, and 10 for name variants of jōyō kanji. Grade 10 includes compatibility characters that look the same as a common kanji and are a different code point: U+FA45 looks like 海, U+6D77. A text normalized to NFC holds the common one.
