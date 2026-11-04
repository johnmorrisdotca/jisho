---
title: "How the look-alike pairs are measured"
section: explanation
order: 3
description: "Two published measures and one made from stroke paths, what a score means, and what they miss."
---

## Three measures

The pairs come from three scores. Two are Lars Yencken's, from his kanji confusion datasets: each scores the 1,945 jōyō kanji of before 2010 against one another, and keeps each kanji's ten nearest. The third is this package's, for what his could not reach.

- **Strokes**, his stroke edit distance: how few stroke edits turn one into the other. It finds the pairs a stroke apart, 田 and 由, 土 and 士, which share no part a dictionary would name.
- **Parts**, the radical measure of Yeh and Li: how much of their parts two kanji share. It finds 読 and 続, and 暑 and 署.
- **Shape**, made here from the stroke paths of KanjiVG (CC BY-SA 3.0) by `scripts/build-shapes.mjs`, in the manner of the strokes measure: each kanji is its strokes in the order they are written, each stroke eight points along its path. Two kanji are lined up stroke to stroke; a stroke that matches costs how far its points are from its partner's, up to 1, and a stroke with no partner costs 1. The score is 100 less that cost as a share of the longer kanji's strokes. A kanji keeps its ten nearest, and a pair is kept when either is among the other's.

## What a score means

A score is out of 100, and is a distance, not a judgement. Read here, each is rounded to a whole number, and the pair takes the highest of the three as its `score`.

This package keeps a pair at 60 or more by strokes, or 70 or more by parts: 7,211 pairs. `lookAlikes` answers from 70 unless asked for less, and at most six. Counted on 2026-10-31 over the raw files, strokes gave 1,842 pairs at 70 and 6,457 at 60. At 60 most kanji have a list rather than a warning, and it also brings pairs nobody would mistake; it also brings the right ones, 千 and 干 among them, so the choice is the caller's.

The shape score is kept only for the pairs those two left out, 2,882 of them, and a pair of Yencken's has `shape` 0 whatever its strokes look like. A pair is kept at 75 or more by shape; where one of its kanji is one Yencken never scored, at 70 or more; and a kanji he never scored that still has no pair keeps its nearest at 62 or more, so that nearly every kanji added in 2010 has something to be warned about. The shape measure is rougher than his: it sees two strokes in different places as different strokes, and it knows nothing of parts, so a kanji with a part moved is not found. The pairs it adds are the ones a stroke or a part apart in the same place, 己 and 巳, 崎 and 埼.

## What it misses

- **A kanji nothing is near**: 9 of the 196 jōyō kanji added in 2010 (臼, 瓦, 乞, 嫉, 遡, 遜, 溺, 藤 and 鬱) and 64 of the 858 kanji for names have no pair. Each kanji keeps only its ten nearest.
- **A pair of two kanji Yencken scored that neither of his measures ranks, and the shape score does not either.** No pair has been added by hand, so that every row can be traced to a published file.
- **A pair's scores can disagree**, and a score of 0 here means "not ranked", not "not alike".

An empty answer from `lookAlikes` therefore does not say a kanji has no look-alike.
