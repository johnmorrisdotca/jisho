---
title: "Troubleshooting and questions"
section: troubleshooting
order: 5
description: "Why a kanji has no level, no grade or no look-alike."
---

## A kanji has no grade

`gradeOf` answers null for a kanji outside the jōyō and jinmeiyō lists. Nothing is wrong: `readKanji` holds only the 2,999 with a grade, so such a kanji has no row either.

## A kanji has no level

`levelOf` answers null for a kanji on none of Waller's lists. 172 jōyō kanji are on none of them; that says nothing about how hard one is.

## A kanji has no look-alike

The measures cover the 1,945 jōyō kanji of before 2010, and each kept only ten for each kanji: see [how the pairs are measured](look-alike.md).

## A common kanji is said to have no meaning

You may have a compatibility character, which looks the same and is a different code point, and which KANJIDIC2 gives no meaning. `"海".normalize("NFC")` gives the common one.
