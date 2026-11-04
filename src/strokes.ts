/**
 * The stroke order of a kanji: the strokes in the order they are written, each as the SVG path KanjiVG draws it with in a square of
 * 109 by 109, drawn as an SVG that writes itself stroke by stroke, and a search by drawing a kanji that compares the strokes as they were
 * drawn with these. The strokes are made from KanjiVG (CC BY-SA 3.0) and are in pieces of about 20 kB gzipped, each holding some kanji, which
 * `loadStrokes` fetches for the kanji it is asked about and `loadAllStrokes` for all of them, as a search by drawing needs.
 */

import type { EntryManifest } from "./words.types.ts";
import { indexed, once, pieceOf } from "./words-pieces.ts";

/**
 * The table of the strokes as the data file holds it: where it was made from, the release, and for each kanji its paths, apart by "|".
 *
 * @example
 * ```ts
 * import type { PackedStrokes } from "@johnmorrisdotca/jisho/strokes";
 *
 * const table: PackedStrokes = { source: "KanjiVG", release: "r20260714", paths: { 一: "M10,54c10,0,80,0,90,0" } };
 * console.log(Object.keys(table.paths));
 * ```
 */
export type PackedStrokes = {
  readonly source: string;
  readonly release: string;
  readonly paths: Readonly<Record<string, string>>;
};

/** The pieces of the strokes: their manifest is fetched only when the strokes are asked for. */
const strokePieces: () => Promise<EntryManifest> = once("manifest", () =>
  import("./data/strokes/stroke-manifest.data.ts").then((one) => one.STROKES_MANIFEST),
);

const kanjiOfLine = (line: string) => line.slice(0, line.indexOf("\t"));

/** The lines of the pieces that hold some kanji (all of them for none given) as a table. */
async function tableOf(kanji: readonly string[] | undefined): Promise<PackedStrokes> {
  const manifest = await strokePieces();
  const set = manifest.entries;
  const at =
    kanji === undefined
      ? set.load.map((_, index) => index)
      : [...new Set(kanji.map((one) => pieceOf(set.starts, one)))];
  const pieces = await Promise.all(at.map((index) => indexed("strokes", set, index, kanjiOfLine)));
  const paths: Record<string, string> = {};
  for (const piece of pieces)
    for (const [key, lines] of piece) {
      const line = lines[0] ?? "";
      if (kanji === undefined || kanji.includes(key)) paths[key] = line.slice(line.indexOf("\t") + 1);
    }
  return { source: manifest.source, release: manifest.release, paths };
}

/**
 * The strokes of the kanji in a text, fetched: one piece of about 20 kB gzipped for each place they are in. Anything that is not a kanji the
 * table has is left out of the answer.
 *
 * @param text - A kanji, or a text with some.
 * @returns A table to give `strokesOf`, `strokeOrderSvg` and `findByDrawing`, with those kanji in it.
 * @example
 * ```ts
 * import { loadStrokes, strokesOf } from "@johnmorrisdotca/jisho/strokes";
 *
 * console.log(strokesOf(await loadStrokes("日本"), "日").length); // 4
 * ```
 */
export function loadStrokes(text: string): Promise<PackedStrokes> {
  return tableOf([...new Set([...text])]);
}

/**
 * The strokes of every kanji the table has, about 1.1 MB gzipped in 57 pieces, as a search by drawing needs them.
 *
 * @returns The table.
 * @example
 * ```ts
 * import { loadAllStrokes } from "@johnmorrisdotca/jisho/strokes";
 *
 * console.log(Object.keys((await loadAllStrokes()).paths).length); // about 2,967
 * ```
 */
export function loadAllStrokes(): Promise<PackedStrokes> {
  return tableOf(undefined);
}

/**
 * A point of a drawing or of a stroke: x then y, in the units of whoever drew it.
 *
 * @example
 * ```ts
 * import type { Point } from "@johnmorrisdotca/jisho/strokes";
 *
 * const start: Point = [10, 50];
 * console.log(start[0]);
 * ```
 */
export type Point = readonly [number, number];

/**
 * The side of the square KanjiVG draws in.
 *
 * @example
 * ```ts
 * import { STROKE_BOX } from "@johnmorrisdotca/jisho/strokes";
 *
 * console.log(STROKE_BOX); // 109
 * ```
 */
export const STROKE_BOX = 109;

/**
 * The strokes of a kanji in the order they are written, each as an SVG path.
 *
 * @param table - What `loadStrokes` or `loadAllStrokes` gave.
 * @param kanji - One kanji.
 * @returns The paths, one for each stroke; none for a kanji the table has no strokes for.
 * @example
 * ```ts
 * import { loadStrokes, strokesOf } from "@johnmorrisdotca/jisho/strokes";
 *
 * console.log(strokesOf(await loadStrokes("日"), "日").length); // 4
 * ```
 */
export function strokesOf(table: PackedStrokes, kanji: string): readonly string[] {
  const packed = Object.hasOwn(table.paths, kanji) ? table.paths[kanji] : undefined;
  return packed === undefined ? [] : packed.split("|");
}

/**
 * How a drawing of the strokes looks and moves.
 *
 * @example
 * ```ts
 * import type { StrokeOrderOptions } from "@johnmorrisdotca/jisho/strokes";
 *
 * const options: StrokeOrderOptions = { size: 200, numbers: true, strokeMs: 400 };
 * console.log(options.size);
 * ```
 */
export type StrokeOrderOptions = {
  /** The width and height in pixels. 109 unless given. */
  readonly size?: number;
  /** Write the strokes one after the other. On unless `false`; a reader who asks for less motion sees them all at once. */
  readonly animate?: boolean;
  /** Draw each stroke's number at its start. Off unless `true`. */
  readonly numbers?: boolean;
  /** How long one stroke takes to write, in milliseconds. 500 unless given. */
  readonly strokeMs?: number;
  /** The colour of the strokes, as CSS has it. `currentColor` unless given. */
  readonly color?: string;
  /** What the drawing says to a screen reader. "Stroke order" unless given. */
  readonly label?: string;
};

const escapeAttribute = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The first point of a path: where the stroke starts, for its number. */
function startOf(path: string): Point {
  const found = /^[Mm]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(path);
  return [Number(found?.[1] ?? 0), Number(found?.[2] ?? 0)];
}

/**
 * The strokes as an SVG, text a page can put in an element or a server can send: each stroke is a path, and with `animate` each is written
 * in its turn with CSS that the SVG carries, so that it needs no script and works where an `<img>` does not. A reader whose device asks for less motion is
 * shown every stroke at once.
 *
 * @param strokes - The paths of the strokes in order, from `strokesOf`.
 * @param options - Size, motion, numbers, colour and label.
 * @returns The SVG; an empty drawing for no strokes.
 * @example
 * ```ts
 * import { loadStrokes, strokeOrderSvg, strokesOf } from "@johnmorrisdotca/jisho/strokes";
 *
 * const svg = strokeOrderSvg(strokesOf(await loadStrokes("日"), "日"), { size: 120 });
 * console.log(svg.startsWith("<svg")); // true
 * ```
 */
export function strokeOrderSvg(strokes: readonly string[], options: StrokeOrderOptions = {}): string {
  const size = Number.isFinite(options.size) && (options.size ?? 0) > 0 ? Number(options.size) : STROKE_BOX;
  const ms = Number.isFinite(options.strokeMs) && (options.strokeMs ?? 0) > 0 ? Number(options.strokeMs) : 500;
  const animate = options.animate !== false;
  const color = escapeAttribute(options.color ?? "currentColor");
  const label = escapeAttribute(options.label ?? "Stroke order");
  const paths = strokes
    .map((stroke, at) => {
      const delay = at * ms;
      const style = animate ? ` style="animation-delay:${delay}ms;animation-duration:${ms}ms"` : "";
      return `<path class="s" pathLength="1" d="${escapeAttribute(stroke)}"${style}/>`;
    })
    .join("");
  const numbers = options.numbers
    ? strokes
        .map((stroke, at) => {
          const [x, y] = startOf(stroke);
          return `<text x="${x - 4}" y="${y - 2}" font-size="8" fill="#b5452c" stroke="none">${at + 1}</text>`;
        })
        .join("")
    : "";
  const css = animate
    ? `.s{stroke-dasharray:1;stroke-dashoffset:1;animation:w both linear}@keyframes w{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@media (prefers-reduced-motion:reduce){.s{animation:none;stroke-dashoffset:0}}`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STROKE_BOX} ${STROKE_BOX}" width="${size}" height="${size}" role="img" aria-label="${label}">${css === "" ? "" : `<style>${css}</style>`}<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${paths}</g>${numbers}</svg>`;
}

/**
 * Points along a path: its curves cut into `steps` straight pieces each. Reads what KanjiVG writes: `M`, `C` and `S`, absolute and relative.
 *
 * @param path - An SVG path of a stroke.
 * @param steps - How many pieces each curve is cut into. 6 unless given.
 * @returns The points, from where the stroke starts to where it ends.
 * @example
 * ```ts
 * import { pathPoints } from "@johnmorrisdotca/jisho/strokes";
 *
 * console.log(pathPoints("M0,0c10,0,20,0,30,0", 3).length); // 4
 * ```
 */
export function pathPoints(path: string, steps = 6): Point[] {
  const tokens = path.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const points: Point[] = [];
  let command = "";
  let x = 0;
  let y = 0;
  let control: Point | undefined;
  let at = 0;
  const next = () => Number(tokens[at++]);
  while (at < tokens.length) {
    const token = tokens[at] ?? "";
    if (/[A-Za-z]/.test(token)) {
      command = token;
      at++;
      if (/[Zz]/.test(command)) continue;
    }
    const relative = command === command.toLowerCase();
    const [dx, dy] = relative ? [x, y] : [0, 0];
    if (command === "M" || command === "m") {
      x = dx + next();
      y = dy + next();
      points.push([x, y]);
      control = undefined;
      command = relative ? "l" : "L";
    } else if (command === "L" || command === "l") {
      x = dx + next();
      y = dy + next();
      points.push([x, y]);
      control = undefined;
    } else if (command === "C" || command === "c" || command === "S" || command === "s") {
      const smooth = command === "S" || command === "s";
      const first: Point = smooth
        ? control === undefined
          ? [x, y]
          : [2 * x - control[0], 2 * y - control[1]]
        : [dx + next(), dy + next()];
      const second: Point = [dx + next(), dy + next()];
      const end: Point = [dx + next(), dy + next()];
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        const u = 1 - t;
        const [a, b, c, d] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
        points.push([
          a * x + b * first[0] + c * second[0] + d * end[0],
          a * y + b * first[1] + c * second[1] + d * end[1],
        ]);
      }
      x = end[0];
      y = end[1];
      control = second;
    } else {
      at++;
    }
  }
  return points;
}

/** A stroke as `count` points along its length, evenly spaced; a dot is its point `count` times. */
function resample(points: readonly Point[], count: number): Point[] {
  const first = points[0] ?? [0, 0];
  if (points.length < 2) return Array.from({ length: count }, () => first);
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    lengths.push((lengths[i - 1] ?? 0) + Math.hypot(bx - ax, by - ay));
  }
  const total = lengths[lengths.length - 1] ?? 0;
  if (total === 0) return Array.from({ length: count }, () => first);
  const out: Point[] = [];
  let at = 1;
  for (let k = 0; k < count; k++) {
    const want = (total * k) / (count - 1);
    while (at < points.length - 1 && (lengths[at] ?? 0) < want) at++;
    const [ax, ay] = points[at - 1] as Point;
    const [bx, by] = points[at] as Point;
    const span = (lengths[at] ?? 0) - (lengths[at - 1] ?? 0);
    const t = span === 0 ? 0 : (want - (lengths[at - 1] ?? 0)) / span;
    out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
  }
  return out;
}

/** The strokes moved and scaled to fit one box, the longer side being 1, so that the size and place of a drawing do not matter. */
function normalised(strokes: readonly (readonly Point[])[]): Point[][] {
  let [minX, minY, maxX, maxY] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];
  for (const stroke of strokes)
    for (const [x, y] of stroke)
      [minX, minY, maxX, maxY] = [Math.min(minX, x), Math.min(minY, y), Math.max(maxX, x), Math.max(maxY, y)];
  const side = Math.max(maxX - minX, maxY - minY) || 1;
  const [cx, cy] = [(minX + maxX) / 2, (minY + maxY) / 2];
  return strokes.map((stroke) => stroke.map(([x, y]): Point => [(x - cx) / side + 0.5, (y - cy) / side + 0.5]));
}

const SAMPLES = 10;
const samples = new WeakMap<PackedStrokes, Map<string, Point[][]>>();

/** The strokes of a kanji as normalised, resampled points, made once for each. */
function shapeOf(table: PackedStrokes, kanji: string): Point[][] {
  let held = samples.get(table);
  if (held === undefined) {
    held = new Map();
    samples.set(table, held);
  }
  let shape = held.get(kanji);
  if (shape === undefined) {
    shape = normalised(strokesOf(table, kanji).map((path) => resample(pathPoints(path), SAMPLES)));
    held.set(kanji, shape);
  }
  return shape;
}

/**
 * What `findByDrawing` gives for a kanji: the kanji, and how far its strokes are from the drawn ones (0 is the same, and about 0.1 a careful hand).
 *
 * @example
 * ```ts
 * import type { DrawingMatch } from "@johnmorrisdotca/jisho/strokes";
 *
 * const match: DrawingMatch = { kanji: "一", distance: 0.05 };
 * console.log(match.kanji);
 * ```
 */
export type DrawingMatch = { readonly kanji: string; readonly distance: number };

/**
 * The kanji whose strokes are nearest to what was drawn, nearest first. The strokes are compared one by one, in the order they were
 * drawn, so a kanji has to be drawn with the right number of strokes (one more or fewer is allowed, at a cost) and in the order it is
 * written. The size and the place of the drawing do not matter; the lengths and directions of the strokes do. It reads the table as it is
 * and fetches nothing.
 *
 * @param table - What `loadStrokes` or `loadAllStrokes` gave.
 * @param drawn - The strokes, each a list of points in any units (a canvas's pixels, say), in the order they were drawn. A stroke of one point is a dot.
 * @param options - `limit`, how many to give: 8 unless given.
 * @returns The nearest kanji, with their distances; none for a drawing with no stroke.
 * @example
 * ```ts
 * import { findByDrawing, loadAllStrokes } from "@johnmorrisdotca/jisho/strokes";
 *
 * const drawn = [[[10, 50], [90, 50]]] as const; // one straight line across
 * console.log(findByDrawing(await loadAllStrokes(), drawn, { limit: 1 })[0]?.kanji); // 一
 * ```
 */
export function findByDrawing(
  table: PackedStrokes,
  drawn: readonly (readonly Point[])[],
  options: { readonly limit?: number } = {},
): DrawingMatch[] {
  const strokes = drawn.filter((stroke) => stroke.length > 0);
  if (strokes.length === 0 || strokes.length > 40) return [];
  const asked = normalised(strokes.map((stroke) => resample(stroke, SAMPLES)));
  const limit = Number.isFinite(options.limit) ? Math.max(1, Math.floor(options.limit ?? 8)) : 8;
  const slack = strokes.length >= 10 ? 2 : 1;
  const found: DrawingMatch[] = [];
  for (const kanji of Object.keys(table.paths)) {
    const count = (table.paths[kanji] ?? "").split("|").length;
    if (Math.abs(count - strokes.length) > slack) continue;
    const shape = shapeOf(table, kanji);
    let total = 0;
    for (let i = 0; i < Math.min(shape.length, asked.length); i++) {
      const a = shape[i] as Point[];
      const b = asked[i] as Point[];
      let sum = 0;
      for (let k = 0; k < SAMPLES; k++)
        sum += Math.hypot((a[k] as Point)[0] - (b[k] as Point)[0], (a[k] as Point)[1] - (b[k] as Point)[1]);
      total += sum / SAMPLES;
    }
    const missing = Math.abs(shape.length - asked.length);
    found.push({ kanji, distance: (total + missing * 0.4) / Math.max(shape.length, asked.length) });
  }
  return found.sort((a, b) => a.distance - b.distance).slice(0, limit);
}
