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

## A lookup rejects with a `WordsLoadError`

A piece of the dictionary could not be fetched, even on the second try. `error.piece` says which ("the readings piece 12 of 294"), and `error.cause` is what the fetch rejected with: the network was down, the host does not serve the file, or a bundler left the piece out of the build. Nothing is remembered of the failure, so asking again tries again. [Look words up](words.md) has the details.

## `findByMeaning` does not find a word

It finds a word by the whole words of its glosses, from an index of twenty words for each English term (up to ten whose gloss is exactly the term, then the commonest that hold it), and a word JMdict does not rank by the terms of its first gloss alone. A word that only holds a very common term in its gloss may be beyond the twenty; try a phrase that follows the gloss (`go out`), or the term that is rarer. It does not stem (`walking` does not find "walk") and it is English only.

## A server's bundle got very large

Something imported `@johnmorrisdotca/jisho/words` where a bundler follows it, and the bundler reached every piece of the dictionary, about 48 MB. [Look words up](words.md) says how to keep it out.
