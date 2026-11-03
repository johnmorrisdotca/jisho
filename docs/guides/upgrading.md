---
title: "Upgrading"
section: upgrading
order: 6
description: "What changes between versions, and what a data refresh does."
---

## From 2.0.0 to 2.1.0

Nothing you call changes, and everything 2.0.0 gave is kept. A `Word` has two more fields, `rank` and `priority`, and a text is made plain before it is looked up (`ｶﾐ`, a stray space or an invisible character find what `カミ` does), so a lookup that threw or found nothing for such a text now finds the word. A piece that cannot be fetched rejects with a `WordsLoadError` where it rejected with whatever the bundler or the browser threw. New: `findByMeaning`, `wordsWithKanji`, `kanjiOfWord`, `searchMeanings`, `romajiToKana`, `kanaFromRomaji`, `normalizeText`, `commonestFirst`, `priorityTags`, `rankOfTags` and the `romaji` option. The package is 3.7 MB larger to download (10.2 to 13.9 MB) for the new indexes, which only the new lookups fetch.

## Before 2.0.0

`forChildren` became `mode`: see the changelog.

## A data refresh

The EDRDG asks that a package using its files keeps them current, so KANJIDIC2 and JMdict are each fetched every month, and a change is a patch release. A reading, a meaning or a word may change in a patch, and a word JMdict adds or drops is added or dropped; the grades, levels and pair scores come from files that rarely do.
