// Writes data-sources/look-alike/shape-pairs.tsv: pairs of kanji whose strokes are drawn alike, scored from KanjiVG's stroke paths, for the
// kanji Lars Yencken's two measures never scored (the 196 added to the jōyō list in 2010 and the kanji for names) and for the pairs they
// ranked too low. Nothing is typed by hand: every row is machine output of the stroke paths in src/data/strokes/ (KanjiVG, CC BY-SA 3.0).
//
//   node scripts/build-shapes.mjs
//
// The measure is a stroke edit distance, in the manner of Yencken's own: each kanji is its strokes in the order they are written, each
// stroke eight points along its path in KanjiVG's square of 109 by 109. Two kanji are aligned stroke to stroke; a stroke that matches costs
// the mean distance between its points (a stroke 40 units off or more costs 1), a stroke with no partner costs 1. The score is 100 less
// the cost as a share of the longer kanji's strokes. A pair is written here when it scores 62 or more and one is among the other's ten nearest; scripts/build-data.mjs says which it keeps.
import { readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { pathPoints } from "../src/strokes.ts";

const POINTS = 8;
/** A stroke this far off (in units of KanjiVG's 109) is as costly as a missing one. */
const FAR = 40;
const KEEP = 62;
const NEAREST = 10;
/** Kanji with more or fewer strokes than this are not compared: they cannot look alike. */
const MOST_APART = 3;
const OUT = "data-sources/look-alike/shape-pairs.tsv";

async function strokePaths() {
  const paths = new Map();
  for (const name of readdirSync("src/data/strokes").filter((one) => /^t\d+\.data\.ts$/.test(one))) {
    const { PIECE } = await import(pathToFileURL(`src/data/strokes/${name}`).href);
    for (const line of PIECE.rows) {
      const at = line.indexOf("\t");
      paths.set(line.slice(0, at), line.slice(at + 1));
    }
  }
  return paths;
}

/** A stroke as `POINTS` points evenly spaced along its length, x then y. */
function resampled(points) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  const out = new Float64Array(POINTS * 2);
  let at = 1;
  for (let k = 0; k < POINTS; k++) {
    if (points.length < 2 || total === 0) {
      out.set(points[0], k * 2);
      continue;
    }
    const want = (total * k) / (POINTS - 1);
    while (at < points.length - 1 && lengths[at] < want) at++;
    const [from, to] = [points[at - 1], points[at]];
    const span = lengths[at] - lengths[at - 1];
    const along = span === 0 ? 0 : (want - lengths[at - 1]) / span;
    out[k * 2] = from[0] + (to[0] - from[0]) * along;
    out[k * 2 + 1] = from[1] + (to[1] - from[1]) * along;
  }
  return out;
}

const strokeCost = (a, b) => {
  let sum = 0;
  for (let k = 0; k < POINTS; k++) sum += Math.hypot(a[k * 2] - b[k * 2], a[k * 2 + 1] - b[k * 2 + 1]);
  return Math.min(1, sum / POINTS / FAR);
};

function score(a, b) {
  let before = Float64Array.from({ length: b.length + 1 }, (_one, j) => j);
  let row = new Float64Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(before[j] + 1, row[j - 1] + 1, before[j - 1] + strokeCost(a[i - 1], b[j - 1]));
    }
    [before, row] = [row, before];
  }
  return Math.round(100 * (1 - before[b.length] / Math.max(a.length, b.length)));
}

const paths = await strokePaths();
const kanji = [...paths.keys()].sort();
const shapes = kanji.map((one) =>
  paths
    .get(one)
    .split("|")
    .map((path) => resampled(pathPoints(path, 8))),
);
const nearest = kanji.map(() => []);
const scored = [];
for (let i = 0; i < kanji.length; i++) {
  for (let j = i + 1; j < kanji.length; j++) {
    if (Math.abs(shapes[i].length - shapes[j].length) > MOST_APART) continue;
    const value = score(shapes[i], shapes[j]);
    if (value < KEEP) continue;
    scored.push([i, j, value]);
    nearest[i].push([value, j]);
    nearest[j].push([value, i]);
  }
}
const topTen = nearest.map(
  (list) =>
    new Set(
      list
        .sort((a, b) => b[0] - a[0] || a[1] - b[1])
        .slice(0, NEAREST)
        .map(([, other]) => other),
    ),
);
const rows = scored
  .filter(([i, j]) => topTen[i].has(j) || topTen[j].has(i))
  .map(([i, j, value]) => `${kanji[i]}${kanji[j]}\t${value}`)
  .sort();
writeFileSync(OUT, `${rows.join("\n")}\n`);
console.log(
  `${kanji.length} kanji drawn, ${rows.length} pairs of ${KEEP} or more, each among the other's ${NEAREST} nearest`,
);
