---
title: "Suggest a word when there is a typo"
section: how-to
order: 3
description: "Find the common words one slip away from what was typed in romaji or kana, for a lookup that found nothing."
---

A lookup is exact: `loadWords("arigatuo")` finds nothing. `suggestWords` answers with the common words whose reading is one slip away from what was typed, so that a page can say "Did you mean ありがとう?".

## Ask for suggestions

```ts
import { suggestWords } from "@johnmorrisdotca/jisho/words";

for (const { word, distance } of await suggestWords("arigatuo")) console.log(word.written, distance);
```

A slip is a letter (or kana) too many, too few, wrong, or two neighbours the wrong way round. A text of romaji is read as romaji and its slips are slips of letters (`nihonngo`, `ohayou gozaimsu`); a text of kana has slips of kana (`にほんこ`). The words come exact first (`distance` 0) and then one slip away (`distance` 1), the commonest first. `limit` is how many, 5 unless given and 20 at most. It takes the same `mode`, `block` and `allow` as a lookup, and in safe mode a word that safe mode leaves out is not suggested.

## What it covers

It reads the table of the common words, 26,039 of them, which it fetches once (about 800 kB gzipped, a second file in unfiltered mode), so it suggests only common words, and only by their reading: a text of kanji suggests nothing, since a kanji is not a slip away from another, and a conjugated form that is not a word of the dictionary (`tabemsu` for 食べます) is not found either; look the dictionary form up with `findInflected` when the exact text finds nothing, and ask for suggestions when that finds nothing too. It is for a lookup that found nothing, not for every lookup.
