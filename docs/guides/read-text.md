---
title: "Read a text"
section: how-to
order: 3
description: "Cut Japanese text into words by the longest match, with furigana, meaning, JLPT level and kanji grades for each, list what is not found, and take the words away as a study list in CSV or TSV."
---

## Cut a text into words

`readText` takes a text and gives back its pieces, in order. A word comes with its furigana, its reading, its meaning and its levels; Japanese that no word fits is `unknown`; spaces, punctuation, Latin letters and digits are `other`.

```ts
import {readText} from "@johnmorrisdotca/jisho/words";
const result=await readText("私は昨日、友達と学校に行きました。");
for (const token of result.tokens) console.log(token.kind,token.text,token.reading,token.level,token.meaning.slice(0,20));
console.log(result.unknown);
```

A `ReadToken` has `text` (as written), `kind` (`word`, `unknown` or `other`), `word` (the dictionary word), `form` (the dictionary form as the text spells it) and `path` (how the text comes from it: 行きました is 行く, `["polite", "past"]`), `furigana` (the text in pieces, each kanji piece with its kana), `reading` (the whole text in hiragana), `meaning`, `level`, `kanji` and `alternatives`. The pieces put together are `result.text`, so a page can draw the text with each word as a button.

```ts
import {readText} from "@johnmorrisdotca/jisho/words";
const result=await readText("食べなかった");
const [token]=result.tokens;
console.log(token?.furigana);
console.log(token?.form,token?.path);
console.log(token?.kanji);
```

## How the words are chosen

From each place, `readText` takes the longest stretch that the dictionary has a word for, either as it stands or as a conjugated form of one (see [look up a conjugated word](conjugated-words.md)). It then weighs the few longest stretches against the word that would follow each, so that 今日はいい天気 is 今日, は and いい天気, not 今日, はい and い天気. Three rules keep the dictionary's many rare words from taking over:

- A stretch counts when its word is common, or it has a kanji, or it is four characters or longer. A rare word of one to three kana does not count.
- A single katakana is never a word: it is the middle of a name.
- A text of kana alone is read as the word that is usually written in kana, so は is the particle and not 葉 (leaf) or 歯 (tooth).

Among equal stretches the commonest word is taken and the others are in `alternatives`, with their readings. A word with a kanji and several readings gets the commonest one JMdict ranks, which for a single kanji can be the wrong one (本 is もと before ほん): `alternatives` has the others.

## The levels

Jisho has JLPT levels and school grades for kanji, and none for words. A word's `level` is the hardest level among its kanji (N1 is harder than N5), and null when it has no kanji or none is on Waller's lists. `kanji` lists each kanji in the text with its grade (1 to 6, 8 for secondary school, 9 and 10 for names, null for a kanji without a row) and its level.

## Furigana

`furigana` is what a page needs for ruby text: pieces whose `reading` is set are kanji, and the rest is kana. For a conjugated form the pieces of the dictionary form hold as far as the two spellings agree: 食べなかった from 食べる (たべる) is 食 (た) and べなかった. 来 takes the reading its ending asks for (こない, きます, くれば). `furiganaOf(written, reading)` and `furiganaOfSurface(surface, base, reading)` do the same on their own.

## What is not found

A stretch no word fits is listed in `result.unknown`, once each, and kept in place in `tokens`. In safe mode a word the mode leaves out is not found either, so its text is listed: read unfiltered to tell the two apart. Names, new words and typos are the usual unknowns.

## A study list

`studyList(result)` gives each word once, in order, with its reading, meaning, level, the highest school grade among its kanji, how often the text has it and the form it first came in. `{ kanjiOnly: true }` leaves out the words with no kanji, such as particles. `studyListText(rows, "csv")` has a header line and quotes what needs it, for a spreadsheet; `"tsv"` has tabs and no header, to paste into a spreadsheet or import into a flashcard program.

```ts
import {readText,studyList,studyListText} from "@johnmorrisdotca/jisho/words";
const result=await readText("私は食べなかった。私は食べた。");
console.log(studyListText(studyList(result,{kanjiOnly:true}),"csv"));
```

## What it costs, and its limits

It fetches Jisho's own pieces, about 25 kB gzipped each, as the stretches need them: a first sentence of fifteen characters took about 30 of them, and a piece that has been fetched is kept (up to 64 at a time), so the next text mostly reuses them. It reads up to `MAX_READ_LENGTH` (5,000) characters and says when it cut the text (`truncated`). It has no grammar: it chooses the longest word, not the best reading of the sentence, so a rare long word can win, and a name may be not found or cut into small words. Nothing about it is stored or sent anywhere but the fetches of the pieces.

## See also

- [Look up a conjugated word](conjugated-words.md): the endings it understands.
- [Look words up](words.md): the lookup it is built on, and safe and unfiltered modes.
- [Find kanji](find-kanji.md): the grades and levels it reports.
