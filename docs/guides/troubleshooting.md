---
title: "Troubleshooting and questions"
section: troubleshooting
order: 5
description: "Why a kanji has no level, no grade or no look-alike, and why a word has no meaning."
---

## A kanji has no grade

`gradeOf` answers null for a kanji outside the jōyō and jinmeiyō lists. Nothing is wrong: `readKanji` holds only the 2,999 with a grade, so such a kanji has no row either.

## A kanji has no level

`levelOf` answers null for a kanji on none of Waller's lists. 172 jōyō kanji are on none of them; that says nothing about how hard one is.

## A kanji has no look-alike

The measures cover the 1,945 jōyō kanji of before 2010, and each kept only ten for each kanji: see [how the pairs are measured](look-alike.md).

## A common kanji is said to have no meaning

You may have a compatibility character, which looks the same and is a different code point, and which KANJIDIC2 gives no meaning. `"海".normalize("NFC")` gives the common one.

## A word has no meaning

`meaningOf` answers null and `wordsOf` an empty list when JMdict has no word for the text, and also when every sense it has is one JMdict marks vulgar, X-rated, sensitive or derogatory, because words are in safe mode unless you pass `mode: "unfiltered"`, and safe mode does not fetch what it leaves out. Nothing is wrong. Look the text up unfiltered to tell the two apart.

## `wordsOf` says a text was not loaded

It throws for a text that `loadWords` was not asked for, instead of answering with no words, which would say the dictionary has none. Load it first, or pass the words you have as `previous` to `loadWords` and add to them. The common table, from `loadCommonWords`, answers for every text.

## A server's bundle got very large

Something imported `@johnmorrisdotca/jisho/words` where a bundler follows it, and the bundler reached every piece of the dictionary, about 30 MB. [Look words up](words.md) says how to keep it out.
