---
title: "Look words up"
section: how-to
order: 3
description: "Find a word by its reading, its written form, its English meaning, a kanji in it or romaji, choose safe or unfiltered, apply your own lists and marks, handle a piece that fails to load, and keep the dictionary out of a server's bundle."
---

## Look a word up

`loadWords` fetches what JMdict holds for the texts you give it, and nothing else. `wordsOf` then reads them with no waiting.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["かみ","紙"]);
console.log(wordsOf(words,"かみ").slice(0,3).map((one)=>`${one.written} ${one.meaning}`));
console.log(wordsOf(words,"紙")[0]?.reading);
```

A text of kana alone is a reading, and hiragana and katakana find the same words: `カミ` finds what `かみ` does. Any other text is a written form. A reading shared by several words gives them commonest first, each with its written form: かみ is 紙 (paper), 神 (god) and 髪 (hair), then the rarer ones.

Each word is a `Word`: `written` is the way to show it, `reading` is how it is read, `forms` are every written form, `meaning` is a short English meaning made from its `senses`, each with the `marks` JMdict gives it and its `glosses`, `kinds` are letters for the kinds of word it is (g godan, i ichidan, a i-adjective, s suru, k kuru) and `common` says whether JMdict marks it common, `priority` lists the priority tags JMdict gives it and `rank` is one number made from them (see [how common a word is](word-rank.md)).

A text with no word answers with an empty list, and `meaningOf` answers with `null`. Nothing is ever made up in their place.

```ts
import {loadWords,meaningOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["紙","ぬぬぬぬぬ"]);
console.log(meaningOf(words,"紙"));
console.log(meaningOf(words,"ぬぬぬぬぬ"));
```

`wordsOf` throws for a text you did not load, instead of answering with no words: an empty answer would say the dictionary has none. `isLoaded(words, text)` says whether it will answer.

## Add to what you have loaded

A game asks about one guess at a time. Pass the words you have as `previous`, and what is already there is kept and not fetched again.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const first=await loadWords("かみ");
const second=await loadWords("いぬ",{previous:first});
console.log(wordsOf(second,"かみ").length>0,wordsOf(second,"いぬ").length>0);
```

## Safe, or unfiltered

A lookup is in **safe** mode unless it says `mode: "unfiltered"`. Safe leaves out every sense JMdict marks vulgar (`vulg`), X-rated (`X`), sensitive (`sens`) or derogatory (`derog`), every written form or reading that only such a sense gives, and every word of which each sense is marked. It fetches only files that hold none of that, so it fetches less. A word with nothing left to say is not found: `wordsOf` gives an empty list and `meaningOf` gives `null`, as for a word JMdict does not have. Unfiltered is everything JMdict has.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("ほもびでお");
console.log(wordsOf(words,"ほもびでお"));
const everything=await loadWords("ほもびでお",{mode:"unfiltered"});
console.log(wordsOf(everything,"ほもびでお").map((one)=>one.meaning));
```

Unfiltered fetches, besides the piece a lookup needs, the piece of what safe mode leaves out for the same keys: about 19 kB gzipped more for a reading, once, and a small manifest. Words in safe mode and words unfiltered cannot be added together, so `previous` must be in the same mode as the new call.

The marks safe mode uses are the same ones [Kotoba](https://github.com/johnmorrisdotca/kotoba) uses to keep what is not for everyone out of its word lists, and `SAFE_MARKS` exports them for reference. They are JMdict's own and are not complete: a sense JMdict has not marked is in safe mode. The pieces that hold what safe mode leaves out are in the package and public like the rest of the data. Keeping them out of a safe lookup means a browser that did not ask for them never gets them; it does not hide the text from anybody who installs the package or requests the files.

## Your own lists

Jisho keeps no list of words of its own. A consumer brings its own, and passes it on top of either mode. `block` names readings and written forms to leave out, and `allow` the only ones to keep. A list names a word by its reading or by one of its written forms, kana in either kind folded to hiragana, so a reading that several words share names all of them. Each is applied only when passed, and an empty `allow` keeps nothing.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ",{block:["神"]});
console.log(wordsOf(words,"かみ").map((one)=>one.written).slice(0,3));
const only=await loadWords("かみ",{allow:["紙","髪"]});
console.log(wordsOf(only,"かみ").map((one)=>one.written));
```

## Marks, and tools for what a lookup returned

Every sense carries the marks JMdict gives it. A mark is a code: a usage (`vulg`, `col`, `sl`, `arch`, `obs`, `uk`…), a field (`food`, `med`…) or a dialect (`ksb`…). Four small pure functions work on the words a lookup returned, and apply nothing unless you call them.

| Function | What it does |
| --- | --- |
| `hasMarks(word, marks)` | Whether any sense of the word carries any of the marks |
| `withoutMarks(words, marks)` | The words with the senses carrying any of the marks left out, a word left with none dropped, and the meaning made again |
| `withoutWords(words, list)` | The words with those named on a list left out |
| `onlyWords(words, list)` | Only the words named on a list |

```ts
import {loadWords,withoutMarks,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ",{mode:"unfiltered"});
console.log(withoutMarks(wordsOf(words,"かみ"),["arch","obs"]).map((one)=>one.meaning).slice(0,3));
```

## More ways to find words

Each of these has a guide of its own:

- [Find words by meaning](find-by-meaning.md)
- [Find words by a kanji](words-by-kanji.md)
- [Look words up in romaji](romaji.md)
- [How common a word is](word-rank.md)
- [Look up a conjugated word](conjugated-words.md)
- [Odd input and pieces that will not load](odd-input-and-errors.md)

## Which table, and how big

| You want | Use | What is fetched |
| --- | --- | --- |
| The meaning of a guess, a word you meet, a few words | `loadWords` | One piece of about 25 kB gzipped for a reading; for a written form, one piece of about 30 kB for the index and then one of about 25 kB for the rows |
| The same for everything JMdict says | `loadWords(…, { mode: "unfiltered" })` | The same, and one more piece of about 19 kB for a reading |
| Many words, all common ones | `loadCommonWords`, or `readCommonWords(COMMON_WORDS)` with `words-common` | One table of about 820 kB gzipped; a lookup then waits for nothing |
| Words by English meaning | `findByMeaning` | The index piece for the term, about 15 kB gzipped, and one piece of the dictionary for each word found: about 160 kB gzipped for 10 words of `water`, up to about 250 kB for 10 of `walk` |
| Words with a kanji | `wordsWithKanji` | The same: the index piece for the kanji, and a piece for each word, about 190 kB gzipped for 10 words of 山 |
| Romaji | `loadWords(…, { romaji: true })` | The same as the kana it reads as; a long vowel can read as more than one, so a few pieces more |

The dictionary is 294 pieces of rows, cut by reading, and 71 pieces of an index from each written form to its readings, cut by form. `words` holds where each piece starts, and a lookup finds its piece by comparing the text with those starts. No piece is more than about 100 kB, and none is fetched until a lookup needs it.

The common table holds the 26,039 words JMdict marks common that safe mode keeps (a form or reading in `news1`, `ichi1`, `spec1`, `spec2` or `gai1`). It answers for any text, and answers only with common words: a reading shared with a rare word finds the common ones alone. `scope` on the words says which kind you have. Unfiltered, `loadCommonWords({ mode: "unfiltered" })` fetches `common-extra.data` too, about 22 kB gzipped, which says what to add and change; with `readCommonWords` you pass it yourself as `extra`.

## In a browser

`import("@johnmorrisdotca/jisho/words")` loads only the small part that finds pieces. Each piece is its own module, so a bundler with code splitting (Vite, webpack, Rollup, esbuild with `splitting`) makes each a file of its own and the browser fetches only the ones a lookup reaches. Fetch the words when a page needs them, not when it opens:

```ts no-run
const { loadWords, wordsOf } = await import("@johnmorrisdotca/jisho/words");
```

## On a server

Import `words` only where a lookup is made. A bundler that follows `loadWords` reaches every piece, about 48 MB, so a server that imports it at the top of a page or a route carries all of it. To keep it out of the bundle:

- Mark the package external, so that the server reads it from `node_modules` at run time: `serverExternalPackages: ["@johnmorrisdotca/jisho"]` in Next.js, or `external` in esbuild and webpack.
- Do the lookup in the one route or action that needs it, never on a page's render path that every visit reaches.
- If the host copies only the files a build can trace, make sure `node_modules/@johnmorrisdotca/jisho/dist/data/words` is among them, or look words up in the browser instead.

A server keeps the pieces it has read in memory, up to 64 of them (the one asked for longest ago is let go), so a second lookup in the same piece costs nothing. The words you loaded are yours and stay.

## What it costs

Measured on 2026-11-03 against 2.0.0, in Node 24 on one Mac. The kana guess is the same file as before; the pieces of the indexes are fetched only by the lookups above.

| | 2.0.0 | 2.1.0 |
| --- | --- | --- |
| The main entry, `@johnmorrisdotca/jisho`, minified and gzipped | 0.8 kB | 0.8 kB |
| A kana guess (`loadWords("かみ")`): pieces fetched, gzipped | 1 piece, 25 kB | 1 piece, 25 kB |
| A written form (`loadWords("紙")`) | 2 pieces, 56 kB | 2 pieces, 56 kB |
| `wordsOf` for かみ (nine words), after loading | 1.0 µs | 1.4 µs |
| `wordsOf` for 紙 (two words), after loading | 0.19 µs | 0.33 µs |
| `readCommonWords(COMMON_WORDS)`, 26,039 rows | 64 to 72 ms | 73 to 80 ms |
| `normalizeText("ｶﾐ ")` | not there | 2 µs; 0.3 µs for a text already plain |
| The words entry with every piece bundled, minified and gzipped | 9.97 MB | 13.74 MB |
| The JavaScript of the pieces in the package, unpacked | 34.9 MB | 48.0 MB |
| The package to download from npm | 10.2 MB | 13.9 MB |

The added time per lookup is the text being made plain, a few tenths of a microsecond. The added size is the indexes: 173 pieces by meaning and 50 by kanji, and 14 for what safe mode leaves out.

## How the words are made

`pnpm words` (`scripts/build-words.mjs`) writes `src/data/words/` from JMdict_e, and a workflow runs it on the 1st of every month, as the EDRDG asks. A row is one reading of one entry, with the written forms that go with it, its first four senses, each with its marks and up to three glosses, and flags; the meaning is made from the senses when a word is read, up to two of them cut at a whole gloss inside about 60 characters. The pieces hold the rows as safe mode has them, and the extra pieces the whole answer, as JMdict has it, for every reading and written form where that is not the same. [Where the data comes from](data-sources.md) has the licence.

An entry is a row for each reading it has. The meaning shows the plain gloss of a sense first, and a literal rendering, an explanation or a bracketed note behind it. A reading JMdict marks irregular or outdated is kept, so that any kana a game takes as a guess has a meaning, but it comes after the regular readings and is never called common.
