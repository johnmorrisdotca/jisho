---
title: "Look words up"
section: how-to
order: 3
description: "Find a word by its reading or its written form, keep the senses not for children out, and keep the dictionary out of a server's bundle."
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

Each word is a `Word`: `written` is the way to show it, `reading` is how it is read, `forms` are every written form, `meaning` is a short English meaning, `kinds` are letters for the kinds of word it is (g godan, i ichidan, a i-adjective, s suru, k kuru) and `common` says whether JMdict marks it common.

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

## Children play here

By default nothing that is not for children is fetched, and none of it is in what comes back. Every sense JMdict marks vulgar, X-rated, sensitive or derogatory, every written form or reading that only such a sense applies to, and every word of which each sense is marked, is not in the files a lookup fetches. A word with nothing left to say is not found: `wordsOf` gives an empty list and `meaningOf` gives `null`, as for a word JMdict does not have. A host that shows words to people of any age gets the stricter answer without doing anything.

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("ほもびでお");
console.log(wordsOf(words,"ほもびでお"));
const everything=await loadWords("ほもびでお",{forChildren:false});
console.log(wordsOf(everything,"ほもびでお").map((one)=>one.meaning));
```

Pass `{ forChildren: false }` to `loadWords` for a learner who is an adult and wants what JMdict says. That fetches one more file, once, `extra.data`, about 90 kB gzipped, which holds all that was left out, and the words you get are everything JMdict has: the same answers as if nothing had been left out. Words for children and words for everything cannot be added together, so `previous` must be for the same people as the new call.

The marks are the same ones [Kotoba](https://github.com/johnmorrisdotca/kotoba) uses to keep what is not for everyone out of its word lists. They are JMdict's own and are not complete: a sense JMdict has not marked is in the files for children.

The files that hold what was left out, `extra.data` and `common-extra.data`, are in the package and public like the rest of the data. Keeping them out of what a lookup fetches means a browser that did not ask for them never gets them; it does not hide the text from anybody who installs the package or requests the files.

## Which table, and how big

| You want | Use | What is fetched |
| --- | --- | --- |
| The meaning of a guess, a word you meet, a few words | `loadWords` | One piece of about 25 kB gzipped for a reading; for a written form, one piece of about 30 kB for the index and then one of about 25 kB for the rows |
| The same for everything JMdict says | `loadWords(…, { forChildren: false })` | The same, and once one file more of about 90 kB gzipped |
| Many words, all common ones | `loadCommonWords`, or `readCommonWords(COMMON_WORDS)` with `words-common` | One table of about 640 kB gzipped; a lookup then waits for nothing |

The dictionary is 254 pieces of rows, cut by reading, and 71 pieces of an index from each written form to its readings, cut by form. `words` holds where each piece starts, and a lookup finds its piece by comparing the text with those starts. No piece is more than about 100 kB, and none is fetched until a lookup needs it.

The common table holds the 26,039 words JMdict marks common that are fit for children (a form or reading in `news1`, `ichi1`, `spec1`, `spec2` or `gai1`). It answers for any text, and answers only with common words: a reading shared with a rare word finds the common ones alone. `scope` on the words says which kind you have. For everything, `loadCommonWords({ forChildren: false })` fetches `common-extra.data` too, about 10 kB gzipped, which says what to add and change; with `readCommonWords` you pass it yourself as `extra`.

## In a browser

`import("@johnmorrisdotca/jisho/words")` loads only the small part that finds pieces. Each piece is its own module, so a bundler with code splitting (Vite, webpack, Rollup, esbuild with `splitting`) makes each a file of its own and the browser fetches only the ones a lookup reaches. Fetch the words when a page needs them, not when it opens:

```ts no-run
const { loadWords, wordsOf } = await import("@johnmorrisdotca/jisho/words");
```

## On a server

Import `words` only where a lookup is made. A bundler that follows `loadWords` reaches every piece, about 30 MB, so a server that imports it at the top of a page or a route carries all of it. To keep it out of the bundle:

- Mark the package external, so that the server reads it from `node_modules` at run time: `serverExternalPackages: ["@johnmorrisdotca/jisho"]` in Next.js, or `external` in esbuild and webpack.
- Do the lookup in the one route or action that needs it, never on a page's render path that every visit reaches.
- If the host copies only the files a build can trace, make sure `node_modules/@johnmorrisdotca/jisho/dist/data/words` is among them, or look words up in the browser instead.

A server keeps the pieces it has read in memory, so a second lookup in the same piece costs nothing.

## How the words are made

`pnpm words` (`scripts/build-words.mjs`) writes `src/data/words/` from JMdict_e, and a workflow runs it on the 1st of every month, as the EDRDG asks. A row is one reading of one entry, with the written forms that go with it, a meaning of up to two senses cut at a whole gloss inside about 60 characters, and flags. The pieces hold the rows as they are for children, and `extra.data` the whole answer, as JMdict has it, for every reading and written form where that is not the same. [Where the data comes from](data-sources.md) has the licence.

An entry is a row for each reading it has. The meaning shows the plain gloss of a sense first, and a literal rendering, an explanation or a bracketed note behind it. A reading JMdict marks irregular or outdated is kept, so that any kana a game takes as a guess has a meaning, but it comes after the regular readings and is never called common.
