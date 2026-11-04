---
title: "Stroke order, and finding a kanji by drawing it"
section: how-to
order: 3
description: "Draw the stroke order of a kanji as an SVG that writes itself, and find a kanji by drawing its strokes."
---

`@johnmorrisdotca/jisho/strokes` has the stroke order of 2,967 kanji, from KanjiVG: each kanji's strokes in the order they are written, as the SVG path KanjiVG draws each with. It draws them as an SVG that writes itself stroke by stroke, and it finds a kanji from strokes drawn on a pad.

## Fetch the strokes and draw them

```ts
import { loadStrokes, strokeOrderSvg, strokesOf } from "@johnmorrisdotca/jisho/strokes";

const table = await loadStrokes("日");
const strokes = strokesOf(table, "日");
console.log(strokes.length); // 4
const svg = strokeOrderSvg(strokes, { size: 160, numbers: true });
console.log(svg.startsWith("<svg"));
```

`loadStrokes` fetches the pieces that hold the kanji of a text, each of about 20 kB gzipped, and `strokesOf` reads one kanji's paths out of what it gave: one path for each stroke, in the order they are written, in a square of 109 by 109. `strokeOrderSvg` returns SVG text a page can put in an element or a server can send. With `animate` (on unless `false`) each stroke is written in its turn, by CSS the SVG carries, so it needs no script; a reader whose device asks for less motion sees every stroke at once. `numbers: true` writes each stroke's number at its start; `size`, `color`, `label` and `strokeMs` (how long a stroke takes, 500 ms unless given) say the rest.

A page that shows the drawing has to credit KanjiVG: *Stroke order from KanjiVG (Ulrich Apel and contributors, CC BY-SA 3.0, http://kanjivg.tagaini.net).* The data is under CC BY-SA 3.0 and keeps that licence; [Where the data comes from](data-sources.md) says more.

## Find a kanji by drawing it

```ts
import { findByDrawing, loadAllStrokes } from "@johnmorrisdotca/jisho/strokes";

const table = await loadAllStrokes();
const drawn = [
  [[10, 50], [90, 50]],
  [[50, 10], [50, 90]],
] as const;
console.log(findByDrawing(table, drawn, { limit: 3 }).map((match) => match.kanji)); // ["十", ...]
```

`findByDrawing` takes the strokes as they were drawn: each a list of `[x, y]` points in any units (a canvas's pixels), in the order they were drawn, from `pointermove` events, say. It gives the nearest kanji first, each with a `distance` (0 is the same stroke for stroke, and about 0.1 a careful hand). The size and the place of the drawing do not matter. The strokes are compared one by one in the order drawn, so the kanji has to be drawn **with the right strokes, in the order they are written**; one stroke more or fewer is allowed at a cost, two when the kanji has ten or more. It is not handwriting recognition: a stroke order that is not the usual one, or joined strokes, will not find the kanji. On KanjiVG's own strokes drawn at random sizes and places with noise, the right kanji is the first answer for 98 in 100 and among the first five for all.

`loadAllStrokes` fetches all 57 pieces, about 1.1 MB gzipped; the demo does it when someone first draws, and the drawing pad there is a good pattern to copy. A kanji of the table that KanjiVG has no file for (32 old forms) is not found.

## What it costs

The strokes are 57 pieces of about 20 kB gzipped and make the package 2.2 MB larger to download. The entry point's code is about 4 kB gzipped; nothing is fetched until `loadStrokes` or `loadAllStrokes` is called.
