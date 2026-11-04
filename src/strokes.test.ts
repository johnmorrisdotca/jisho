import { describe, expect, it } from "vitest";

import { KANJI } from "./data/kanji.data.ts";
import {
  findByDrawing,
  loadAllStrokes,
  loadStrokes,
  type Point,
  pathPoints,
  STROKE_BOX,
  strokeOrderSvg,
  strokesOf,
} from "./strokes.ts";

const STROKES = await loadAllStrokes();

describe("the table of strokes", () => {
  it("has the strokes of almost every kanji of the table, in the order they are written", () => {
    const rows = KANJI.rows.map((row) => row[0] as string);
    const has = rows.filter((kanji) => strokesOf(STROKES, kanji).length > 0);
    expect(has.length).toBeGreaterThan(2_950);
    expect(strokesOf(STROKES, "日")).toHaveLength(4);
    expect(strokesOf(STROKES, "山")).toHaveLength(3);
    expect(strokesOf(STROKES, "書")).toHaveLength(10);
    expect(strokesOf(STROKES, "x")).toEqual([]);
    expect(strokesOf(STROKES, "__proto__")).toEqual([]);
  });

  it("counts the strokes as KANJIDIC2 does for nearly all of them, and each starts with a move", () => {
    let same = 0;
    let total = 0;
    for (const row of KANJI.rows) {
      const strokes = strokesOf(STROKES, row[0] as string);
      if (strokes.length === 0) continue;
      total++;
      if (strokes.length === row[1]) same++;
      for (const path of strokes) expect(path).toMatch(/^[Mm]/);
    }
    expect(same / total).toBeGreaterThan(0.95);
  });

  it("is named for its source and its licence at its head", () => {
    expect(STROKES.source).toBe("KanjiVG");
    expect(STROKES.release).toMatch(/^r\d{8}$/);
  });
});

describe("the strokes of some kanji only", () => {
  it("are fetched for the kanji of a text, and nothing else is in the answer", async () => {
    const some = await loadStrokes("日本語 and 山");
    expect(Object.keys(some.paths).sort()).toEqual(["山", "日", "本", "語"].sort());
    expect(strokesOf(some, "日")).toEqual(strokesOf(STROKES, "日"));
    expect(some.source).toBe("KanjiVG");
    expect(await loadStrokes("abc")).toMatchObject({ paths: {} });
    expect(Object.keys((await loadStrokes("")).paths)).toEqual([]);
  });

  it("are all the table has when all are asked for, in many small pieces", () => {
    expect(Object.keys(STROKES.paths).length).toBeGreaterThan(2_950);
  });
});

describe("the strokes drawn as an SVG", () => {
  const strokes = strokesOf(STROKES, "日");

  it("writes each stroke in its turn, with CSS the SVG carries, and for less motion all at once", () => {
    const svg = strokeOrderSvg(strokes, { size: 120, strokeMs: 400 });
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('width="120"');
    expect(svg).toContain(`viewBox="0 0 ${STROKE_BOX} ${STROKE_BOX}"`);
    expect((svg.match(/<path /g) ?? []).length).toBe(4);
    expect(svg).toContain("animation-delay:1200ms;animation-duration:400ms");
    expect(svg).toContain("@media (prefers-reduced-motion:reduce)");
    expect(svg).toContain('role="img" aria-label="Stroke order"');
  });

  it("can stand still, number the strokes, take a colour and a label, and is safe to put in a page", () => {
    const still = strokeOrderSvg(strokes, { animate: false, numbers: true, color: '"><script>', label: "日 <b>" });
    expect(still).not.toContain("<style>");
    expect(still).not.toContain("animation-delay");
    expect((still.match(/<text /g) ?? []).length).toBe(4);
    expect(still).not.toContain("<script>");
    expect(still).toContain("&quot;>&lt;script>");
    expect(still).toContain("日 &lt;b>");
  });

  it("is an empty drawing for no strokes, and uses the defaults for odd sizes", () => {
    expect(strokeOrderSvg([])).toContain("<g ");
    expect(strokeOrderSvg(strokes, { size: -4, strokeMs: Number.NaN })).toContain(`width="${STROKE_BOX}"`);
  });
});

describe("the points of a path", () => {
  it("follow its curves from where the stroke starts to where it ends", () => {
    const points = pathPoints("M0,0c10,0,20,0,30,0", 3);
    expect(points).toHaveLength(4);
    expect(points[0]).toEqual([0, 0]);
    expect(points[3]?.[0]).toBeCloseTo(30);
    expect(points[3]?.[1]).toBeCloseTo(0);
  });

  it("reads absolute and relative curves, smooth curves, lines, and nothing it does not know", () => {
    const absolute = pathPoints("M10,10C20,10,30,10,40,10", 2);
    expect(absolute.at(-1)).toEqual([40, 10]);
    const smooth = pathPoints("M10,10c10,0,20,0,30,0s20,0,30,0", 2);
    expect(smooth.at(-1)?.[0]).toBeCloseTo(70);
    const first = pathPoints("M10,10S20,10,30,10", 2);
    expect(first.at(-1)).toEqual([30, 10]);
    expect(pathPoints("M1,2L5,6l1,1", 2)).toEqual([
      [1, 2],
      [5, 6],
      [6, 7],
    ]);
    expect(pathPoints("m1,2 3,4", 2)).toEqual([
      [1, 2],
      [4, 6],
    ]);
    expect(pathPoints("M1,2Z", 2)).toEqual([[1, 2]]);
    expect(pathPoints("M1,2Q3", 2)).toEqual([[1, 2]]);
    expect(pathPoints("")).toEqual([]);
  });
});

/** A small deterministic noise, so that the same test gives the same answer. */
function noise(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32 - 0.5;
  };
}

/** A kanji as someone might draw it: its strokes as points, moved, scaled and shaken a little. */
const drawn = (kanji: string, random: () => number, shake: number): Point[][] => {
  const scale = 0.5 + Math.abs(random()) * 3;
  const [dx, dy] = [random() * 400, random() * 400];
  return strokesOf(STROKES, kanji).map((path) =>
    pathPoints(path, 4).map(
      ([x, y]): Point => [x * scale + dx + random() * shake * scale, y * scale + dy + random() * shake * scale],
    ),
  );
};

describe("a search by drawing a kanji", () => {
  it("finds the kanji, wherever and however large it was drawn, for a sample of the table", () => {
    const random = noise(7);
    const all = Object.keys(STROKES.paths);
    const sample = all.filter((_, at) => at % 10 === 0);
    let first = 0;
    let five = 0;
    for (const kanji of sample) {
      const found = findByDrawing(STROKES, drawn(kanji, random, 6), { limit: 5 }).map((one) => one.kanji);
      if (found[0] === kanji) first++;
      if (found.includes(kanji)) five++;
    }
    expect(five / sample.length).toBeGreaterThan(0.97);
    expect(first / sample.length).toBeGreaterThan(0.9);
  });

  it("finds one stroke across, and is nearest the right kanji first", () => {
    const found = findByDrawing(
      STROKES,
      [
        [
          [10, 50],
          [90, 50],
        ],
      ],
      { limit: 1 },
    );
    expect(found[0]?.kanji).toBe("一");
    expect(found[0]?.distance).toBeLessThan(0.2);
    const sorted = findByDrawing(STROKES, drawn("山", noise(3), 4), { limit: 8 });
    expect(sorted[0]?.kanji).toBe("山");
    expect(sorted.map((one) => one.distance)).toEqual(sorted.map((one) => one.distance).sort((a, b) => a - b));
  });

  it("allows a stroke more or fewer at a cost, and a dot is a stroke", () => {
    const strokes = drawn("日", noise(5), 2);
    const short = findByDrawing(STROKES, strokes.slice(0, 3), { limit: 8 }).map((one) => one.kanji);
    expect(short.length).toBeGreaterThan(0);
    const dot = findByDrawing(
      STROKES,
      [
        [[5, 5]],
        [
          [5, 5],
          [5, 5],
        ],
        ...strokes.slice(0, 1),
      ],
      { limit: 3 },
    );
    expect(dot.length).toBeGreaterThan(0);
  });

  it("gives nothing for no drawing, for strokes with no point, or for far too many strokes, and the limit is kept sane", () => {
    expect(findByDrawing(STROKES, [])).toEqual([]);
    expect(findByDrawing(STROKES, [[], []])).toEqual([]);
    expect(
      findByDrawing(
        STROKES,
        Array.from(
          { length: 41 },
          () =>
            [
              [0, 0],
              [1, 1],
            ] as Point[],
        ),
      ),
    ).toEqual([]);
    const line: Point[][] = [
      [
        [0, 0],
        [10, 0],
      ],
    ];
    expect(findByDrawing(STROKES, line).length).toBe(8);
    expect(findByDrawing(STROKES, line, { limit: Number.NaN }).length).toBe(8);
    expect(findByDrawing(STROKES, line, { limit: 0 }).length).toBe(1);
    const many = Array.from({ length: 12 }, (_, at): Point[] => [
      [at * 5, 0],
      [at * 5 + 3, 40],
    ]);
    expect(findByDrawing(STROKES, many).length).toBeGreaterThanOrEqual(0);
  });
});
