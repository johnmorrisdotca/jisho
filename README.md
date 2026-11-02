<h1 align="center">Moji <sub>文字</sub> — Kanji data for JavaScript</h1>

<p align="center"><strong>Moji 文字: Kanji data for JavaScript: the school grades, JLPT levels, readings, meanings and look-alike pairs of 2,999 kanji.</strong><br>
Every table is an entry point of its own and is machine output from public sources, each named with its licence: KANJIDIC2, Jonathan Waller's JLPT lists and Lars Yencken's kanji confusion datasets. Typed, with no dependencies, and a demo to try it in.</p>

<p align="center" lang="ja">2,999字の漢字の学年、JLPTレベル、読み、意味、形の似た漢字の組を収めた、型付きで外部依存のないJavaScript向けのデータセットです。</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/moji/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/moji/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/moji"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/moji?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <a href="./NOTICE.md"><img alt="Data keeps its own licences" src="https://img.shields.io/badge/data-CC%20BY--SA%20and%20CC%20BY-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
  <a href="https://johnmorrisdotca.github.io/moji/docs/api/main/index.html"><img alt="0.8 kB minified and gzipped" src="https://img.shields.io/badge/min%2Bgzip-0.8%20kB-2f5d4a"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/moji#provenance"><img alt="Published with npm provenance" src="https://img.shields.io/badge/npm-provenance-2f5d4a"></a>
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/moji/"><strong>Try the demo →</strong></a> · <a href="https://johnmorrisdotca.github.io/moji/docs/">Documentation</a> · <a href="https://johnmorrisdotca.github.io/moji/docs/guides/getting-started.html">Getting started</a> · <a href="https://johnmorrisdotca.github.io/moji/api.html">API reference</a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/hero-desk-light.webp" alt="The demo on a desk: the header with its language chooser, buttons for nine school grades and five JLPT levels with N5 chosen, a search box, a grid of 79 kanji, and the card of 日 with its strokes, grade, level, readings and meanings." width="720">
</picture><br>
<em>On a desk: JLPT N5, with 日 open beside its list.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/hero-phone-light.webp" alt="The same demo on a phone, one column: the header and the buttons for the lists at the top of a narrow page." width="220">
</picture><br>
<em>On a phone.</em>
</td>
</tr>
</table>
<p align="center">Choose a list, tap a kanji, and follow it to the kanji it can be mistaken for.</p>

## In 30 seconds

```sh
npm install @johnmorrisdotca/moji
```

```ts
import { gradeOf, levelOf, lookAlikes } from "@johnmorrisdotca/moji";
import { GRADES } from "@johnmorrisdotca/moji/grades";
import { JLPT } from "@johnmorrisdotca/moji/jlpt";
import { LOOK_ALIKE } from "@johnmorrisdotca/moji/look-alike";

console.log(gradeOf(GRADES, "語")); // 2
console.log(levelOf(JLPT, "語")); // N5
console.log(lookAlikes(LOOK_ALIKE, "土")[0]?.kanji); // the closest look-alike of 土
```

## Who it is for

- **Language learning apps** that order kanji by school year or JLPT level, and want to warn a learner about the pair they are about to confuse.
- **Text tools** that say how hard a piece of Japanese is, from the kanji in it.
- **Games and quizzes** that need a list of kanji with their readings and meanings, and wrong answers that look right.
- **Anybody who needs the data under terms they can read**: every table names its source and its licence, and no row comes from a commercial study service.

## Features

- **[School grades](#the-school-grades)**: 2,999 kanji by grade, 1,026 of them taught in elementary school and 2,136 in all for everyday use.
- **[JLPT levels](#the-jlpt-levels)**: 2,211 kanji on Jonathan Waller's five lists, N5 to N1.
- **[A table of the kanji](#the-table)**: strokes, grade, level, newspaper rank, on and kun readings, and meanings in English and French.
- **[Look-alike pairs](#the-look-alike-pairs)**: 7,211 pairs with two published scores each, by strokes and by parts.
- **Plain functions**: which grade, which level, the kanji in a text, a search by reading or meaning.
- **Each table an entry point**: importing the grades loads 8 KB gzipped, not the table of 146 KB.

### What's in it

<table>
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/school-grade-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/school-grade-desk-light.webp" alt="The 160 kanji of the second school year in a grid, 語 chosen, with its card beside the grid." width="360">
</picture><br>
<sub>A school year: grade 2's 160 kanji.</sub>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/jlpt-level-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/jlpt-level-desk-light.webp" alt="The 367 kanji of JLPT N3 in a grid in the order of Waller's list, 政 chosen, with its card beside the grid." width="360">
</picture><br>
<sub>A JLPT level: N3, in the order of the list.</sub>
</td>
</tr>
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/kanji-card-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/kanji-card-desk-light.webp" alt="The card of 山: three strokes, grade 1, level N5, its rank in newspapers, its readings サン, セン and やま, and its meaning in English and French." width="300">
</picture><br>
<sub>One kanji in full, from the table.</sub>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/look-alike-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/look-alike-desk-light.webp" alt="The card of 土, with a row of buttons for the kanji it looks like, 士 and 工 among them, each leading to that kanji." width="300">
</picture><br>
<sub>What 土 can be mistaken for.</sub>
</td>
</tr>
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/search-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/moji/main/docs/images/search-desk-light.webp" alt="A search for the word water: the grid holds the kanji with that meaning, the commonest first, and 山's card stays beside it." width="360">
</picture><br>
<sub>A search by meaning, the commonest first.</sub>
</td>
<td></td>
</tr>
</table>

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/moji
pnpm add @johnmorrisdotca/moji
yarn add @johnmorrisdotca/moji
```

For a page with no bundler:

```html
<script type="module">
  import { gradeOf } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/moji@0/+esm";
  import { GRADES } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/moji@0/grades/+esm";
  console.log(gradeOf(GRADES, "語"));
</script>
```

### Install under another name

Moji is the Japanese name; the English job is kanji data. npm can install a package under a name of your own:

```sh
npm install kanji-data@npm:@johnmorrisdotca/moji
```

```ts no-check
import { gradeOf } from "kanji-data";
```

### On a server or in a script

Import the tables you read. Nothing here needs a browser or a network.

```ts
import { kanjiOfGrade } from "@johnmorrisdotca/moji";
import { GRADES } from "@johnmorrisdotca/moji/grades";

console.log(kanjiOfGrade(GRADES, 1).slice(0, 5));
```

### In a page, when it is wanted

The table of the kanji is the largest, at 146 KB gzipped, so a page can fetch it when it is first needed:

```ts
import { readKanji } from "@johnmorrisdotca/moji";

const { KANJI } = await import("@johnmorrisdotca/moji/kanji");
console.log(readKanji(KANJI).length); // 2999
```

## Examples

### Every elementary-school kanji

`ELEMENTARY_GRADES` is grades 1 to 6, and `JOYO_GRADES` adds the rest of the everyday kanji.

```ts
import { ELEMENTARY_GRADES, JOYO_GRADES, kanjiOfGrade } from "@johnmorrisdotca/moji";
import { GRADES } from "@johnmorrisdotca/moji/grades";

console.log(ELEMENTARY_GRADES.flatMap((grade) => kanjiOfGrade(GRADES, grade)).length); // 1026
console.log(JOYO_GRADES.flatMap((grade) => kanjiOfGrade(GRADES, grade)).length); // 2136
```

### One JLPT level

A level does not count the levels below it, and is in the order of Waller's list.

```ts
import { kanjiOfLevel } from "@johnmorrisdotca/moji";
import { JLPT } from "@johnmorrisdotca/moji/jlpt";

console.log(kanjiOfLevel(JLPT, "N5").slice(0, 3)); // ["日", "一", "国"]
```

### The levels in a piece of text

`kanjiIn` takes the kanji out of a text, once each.

```ts
import { kanjiIn, levelOf } from "@johnmorrisdotca/moji";
import { JLPT } from "@johnmorrisdotca/moji/jlpt";

console.log(kanjiIn("日本語を勉強します").map((one) => [one, levelOf(JLPT, one)]));
```

### Look a kanji up

Build a `Map` once if a page looks up more than a few.

```ts
import { readKanji } from "@johnmorrisdotca/moji";
import { KANJI } from "@johnmorrisdotca/moji/kanji";

const byKanji = new Map(readKanji(KANJI).map((one) => [one.kanji, one]));
const mountain = byKanji.get("山");
console.log(mountain?.strokes, mountain?.on, mountain?.kun, mountain?.meanings, mountain?.meaningsFr);
```

### Search by a reading or a meaning

A kanji, an on or kun reading, or a meaning in English or French.

```ts
import { readKanji, searchKanji } from "@johnmorrisdotca/moji";
import { KANJI } from "@johnmorrisdotca/moji/kanji";

console.log(searchKanji(readKanji(KANJI), "mountain")[0]?.kanji); // 山
```

### Warn about a look-alike

The score to start from, and how many to take, are yours.

```ts
import { lookAlikes } from "@johnmorrisdotca/moji";
import { LOOK_ALIKE } from "@johnmorrisdotca/moji/look-alike";

console.log(lookAlikes(LOOK_ALIKE, "土", { max: 3 }));
console.log(lookAlikes(LOOK_ALIKE, "千", { atLeast: 60 }).map((one) => one.kanji));
```

### Wrong answers that look right

A quiz can offer the kanji most like the right one, and fall back on the same grade when there are too few.

```ts
import { gradeOf, kanjiOfGrade, lookAlikes } from "@johnmorrisdotca/moji";
import { GRADES } from "@johnmorrisdotca/moji/grades";
import { LOOK_ALIKE } from "@johnmorrisdotca/moji/look-alike";

const right = "未";
const alike = lookAlikes(LOOK_ALIKE, right, { max: 3 }).map((one) => one.kanji);
const grade = gradeOf(GRADES, right);
const fillers = grade === null ? [] : kanjiOfGrade(GRADES, grade).filter((one) => one !== right && !alike.includes(one));
console.log([...alike, ...fillers].slice(0, 3));
```

## The data

### The school grades

| Grade | Kanji | What it is |
| --- | --- | --- |
| 1 | 80 | Elementary school, first year |
| 2 | 160 | Second year |
| 3 | 200 | Third year |
| 4 | 202 | Fourth year |
| 5 | 193 | Fifth year |
| 6 | 191 | Sixth year |
| 8 | 1,110 | The rest of the jōyō kanji, taught in secondary school |
| 9 | 651 | Kanji allowed in names (jinmeiyō) |
| 10 | 212 | Name variants of jōyō kanji |

From KANJIDIC2 of 2026-10-31. There is no grade 7. Grade 10 includes compatibility characters that look like a common kanji and are another code point.

### The JLPT levels

| Level | Kanji |
| --- | --- |
| N5 | 79 |
| N4 | 166 |
| N3 | 367 |
| N2 | 367 |
| N1 | 1,232 |

From Jonathan Waller's [JLPT Resources](http://www.tanos.co.uk/jlpt/), under CC BY. The test itself has published no list of kanji since its five levels began in 2010, so these lists are one person's reconstruction, and a level says which list holds a kanji, not what the test will ask. Each is every kanji of that list and not the levels below it, and all 2,211 have a school grade. Of the 2,136 jōyō kanji, 172 are on no list.

### The table

2,999 rows, one for every kanji with a school grade, read by `readKanji`:

| Field | What it is |
| --- | --- |
| `kanji` | The character |
| `strokes` | How many strokes it is written in |
| `grade` | Its school grade |
| `level` | Its JLPT level, or `null` when no list holds it |
| `frequency` | Its rank among the 2,500 commonest in newspapers, or `null` |
| `on`, `kun` | Its readings: a dot in a kun reading marks where the okurigana begins |
| `meanings`, `meaningsFr` | Its meanings in English and in French; KANJIDIC2 has no French for 939 of them, and no meaning for 25 of grades 9 and 10 |

### The look-alike pairs

7,211 pairs from Lars Yencken's [kanji confusion datasets](https://lars.yencken.org/datasets/kanji-confusion/), under CC BY 3.0, each with two scores out of 100: by how few stroke edits separate two kanji, and by the parts they share. A pair is kept at 60 or more by strokes, or 70 or more by parts, and `lookAlikes` answers from 70 unless told otherwise.

The two measures cover only the 1,945 jōyō kanji of before 2010, and keep only ten for each kanji, so an empty answer does not say a kanji has no look-alike. No pair is added by hand: see [how the pairs are measured](https://johnmorrisdotca.github.io/moji/docs/guides/look-alike.html).

## API

The [API reference](https://johnmorrisdotca.github.io/moji/api.html) lists every export of every entry point, made from the source, and the [documentation](https://johnmorrisdotca.github.io/moji/docs/) gives each its own page.

| Entry point | What it holds |
| --- | --- |
| `@johnmorrisdotca/moji` | The types and the functions that read the tables. No data |
| `@johnmorrisdotca/moji/grades` | `GRADES`: each school grade's kanji |
| `@johnmorrisdotca/moji/jlpt` | `JLPT`: each level's kanji |
| `@johnmorrisdotca/moji/kanji` | `KANJI`: the table, read with `readKanji` |
| `@johnmorrisdotca/moji/look-alike` | `LOOK_ALIKE`: the pairs, read with `lookAlikes` |

### The calls to learn first

| Call | What it does |
| --- | --- |
| `gradeOf(GRADES, kanji)`, `kanjiOfGrade(GRADES, grade)` | The grade of a kanji, and the kanji of a grade |
| `levelOf(JLPT, kanji)`, `kanjiOfLevel(JLPT, level)` | The level of a kanji, and the kanji of a level |
| `readKanji(KANJI)` | The table as plain rows |
| `searchKanji(rows, text)` | The rows that hold a kanji, reading or meaning |
| `lookAlikes(LOOK_ALIKE, kanji, { atLeast, max })` | The kanji most like one kanji |
| `kanjiIn(text)` | The kanji in a piece of text, once each |

## Theming

The package draws nothing, so there is nothing of its own to theme: it hands back data. The demo uses the family's cloth and colours.

## Limits

- 2,999 kanji: those with a school grade in KANJIDIC2. Rarer kanji have no row.
- The JLPT levels are one person's lists, not the test's.
- The look-alike pairs cover the 1,945 jōyō kanji of before 2010: the 196 added in 2010 and nearly all the kanji for names have none.
- No meanings in Japanese: KANJIDIC2 has none. English for almost all, French for two in three.
- No stroke order and no radicals: [Bushu](https://github.com/johnmorrisdotca/bushu) has the parts.

## Accessibility

The package draws nothing. In the demo each list is a group of labelled buttons with its choice said by `aria-pressed`, every kanji is a button of at least 44 pixels, the kanji carry `lang="ja"` so that a screen reader reads them as Japanese, the card and the count are live regions, and the keyboard reaches everything. Nothing moves, so reduced motion changes nothing. A long list scrolls inside its own box.

## Browser and runtime support

It needs Node 22 or later; the tests were run on Node 24, and the demo in Chromium and WebKit at a desk's width and a phone's. The data is plain modules, so it works wherever modules do.

## Languages

The demo and the guides are in English and Japanese; the Japanese has not yet been read by a native reader. The data holds meanings in English and French, because KANJIDIC2 does, and readings in Japanese. A language with no meanings in KANJIDIC2 would need a source with terms that allow it.

## Roadmap

- Look-alike scores for the kanji the two measures do not cover, measured here from a public set of stroke data.
- Nothing from a commercial study service, and no hand-kept pairs: every row stays traceable to a published file.

## Architecture

The main entry holds types and plain functions and no data; each table is an entry point of its own, and `src/data/` is machine output. The [architecture guide](docs/guides/architecture.md) has the source tree.

## The name

Moji (文字, *moji*) is Japanese for a written character: 文, writing, and 字, a character. It is the second half of Kumimoji (組み文字), another of the family.

## Where it comes from, and where it is used

Made from public sources by `scripts/build-data.mjs`, with the address, date and SHA-256 of each in [data-sources/sources.json](data-sources/sources.json):

- **KANJIDIC2**, the property of the Electronic Dictionary Research and Development Group: CC BY-SA 4.0 and the Group's conditions. Fetched again every month.
- **Jonathan Waller's JLPT lists**, [tanos.co.uk](http://www.tanos.co.uk/jlpt/): CC BY. Read on 2026-10-31 from the Internet Archive's copies of 2020, because the site did not answer.
- **Lars Yencken's kanji confusion datasets**: CC BY 3.0.

### Used by

Nothing yet. [Tell us](https://github.com/johnmorrisdotca/moji/issues/new?template=add-my-project.md) if you use it.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Moji is one of thirty-three packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca) or [github.com/spxis](https://github.com/spxis). The code of every one is MIT.

**Games — board**

- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).

**Games — cards & tiles**

- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).

**Games — puzzles**

- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).

**Games — dice & random**

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).

**Language**

- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Moji](https://github.com/johnmorrisdotca/moji) (文字): school grades, JLPT levels, readings and look-alike pairs for 2,999 kanji. [Demo](https://johnmorrisdotca.github.io/moji/). Not on npm yet.
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).

**Geography & data**

- [address-plus](https://github.com/johnmorrisdotca/address-plus) (アドレスプラス): parse and format addresses in the United States, Canada, Japan, Australia, France, Germany and the United Kingdom. [Demo](https://johnmorrisdotca.github.io/address-plus/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Hata](https://github.com/johnmorrisdotca/hata) (旗): country and regional flags as SVG, at their true proportions and keyed by ISO code. [Demo](https://johnmorrisdotca.github.io/hata/).
- [Kuni](https://github.com/johnmorrisdotca/kuni) (国): countries and their regions, with ISO codes and names in English and Japanese. [Demo](https://johnmorrisdotca.github.io/kuni/).

**Sports**

- [Dougu Sports](https://github.com/johnmorrisdotca/dougu-sports) (道具): sports emblems as SVG: trophies, medals, crests, and the ball and gear of every sport, with optional 3D turning. [Demo](https://johnmorrisdotca.github.io/dougu-sports/).
- [Kyogijo Stadiums](https://github.com/johnmorrisdotca/kyogijo-stadiums) (競技場): sports fields, rinks, courts and ballparks drawn to scale as SVG, with each team and the score on them. [Demo](https://johnmorrisdotca.github.io/kyogijo-stadiums/).
- [Senshu Jerseys](https://github.com/johnmorrisdotca/senshu-jerseys) (選手): sports jerseys, sweaters, kits, caps, helmets and retired-number banners as SVG, front and back, with optional 2.5D turning. [Demo](https://johnmorrisdotca.github.io/senshu-jerseys/).
- [Taisen Brackets](https://github.com/johnmorrisdotca/taisen-brackets) (対戦): a sport-agnostic tournament bracket, drawn as SVG, from a list of ties. [Demo](https://johnmorrisdotca.github.io/taisen-brackets/).

**Developer tools**

- [REST in Pieces](https://github.com/spxis/rest-in-pieces) (レスト・イン・ピーシーズ): seeded test data and REST APIs for frontend development, with latency and error drills. [Demo](https://spxis.github.io/rest-in-pieces/).


**This package is Moji.** The demos of all thirty-three share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm install
pnpm check              # lint, types, tests and sizes
pnpm test:readme        # run every example in this README
pnpm data               # write src/data/ again from the sources
pnpm test:demo          # build the demo and the docs, and drive them in a browser
pnpm screenshots:readme # take this README's pictures again
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and ideas go in the [issues](https://github.com/johnmorrisdotca/moji/issues). A wrong grade, reading or level is usually the source's to fix: say which one you think is wrong.

## Changes

See the [changelog](CHANGELOG.md). Nothing has been released yet.

## Licence

The code is under the [MIT licence](LICENSE). The data is under its sources' terms, set out in full in [NOTICE.md](NOTICE.md), which ships in the package: `grades` and `kanji` are CC BY-SA 4.0 with the Electronic Dictionary Research and Development Group's conditions, the JLPT levels are CC BY (Jonathan Waller), and `look-alike` is CC BY 3.0 (Lars Yencken). A page that shows the data credits it, and NOTICE.md has wording to use.
