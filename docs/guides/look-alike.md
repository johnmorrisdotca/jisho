---
title: "How the look-alike pairs are measured"
section: explanation
order: 3
description: "Two published measures, what a score means, and what they miss."
---

## Two measures

The pairs are Lars Yencken's, from the two measures in his kanji confusion datasets. Each scores the 1,945 jōyō kanji of before 2010 against one another, and keeps each kanji's ten nearest.

- **Strokes**, his stroke edit distance: how few stroke edits turn one into the other. It finds the pairs a stroke apart, 田 and 由, 土 and 士, which share no part a dictionary would name.
- **Parts**, the radical measure of Yeh and Li: how much of their parts two kanji share. It finds 読 and 続, and 暑 and 署.

## What a score means

A score is out of 100, and is a distance, not a judgement. Read here, each is rounded to a whole number, and the pair takes the higher of the two as its `score`.

This package keeps a pair at 60 or more by strokes, or 70 or more by parts: 7,211 pairs. `lookAlikes` answers from 70 unless asked for less, and at most six. Counted on 2026-10-31 over the raw files, strokes gave 1,842 pairs at 70 and 6,457 at 60. At 60 most kanji have a list rather than a warning, and it also brings pairs nobody would mistake; it also brings the right ones, 千 and 干 among them, so the choice is the caller's.

## What it misses

- **Any kanji added to the jōyō list in 2010** has no pair, because neither measure scored it: 埼 is one, so 崎 and 埼 are not here.
- **A pair neither measure ranks**, such as 己 and 巳. A measure keeps only each kanji's ten nearest. No pair has been added by hand, so that every row can be traced to a published file.
- **A pair's two scores can disagree**, and a score of 0 here means "not ranked", not "not alike".

An empty answer from `lookAlikes` therefore does not say a kanji has no look-alike.
