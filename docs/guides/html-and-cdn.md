---
title: "A plain page and a CDN"
section: how-to
order: 8
description: "Look words up on a page with no build step, from jsDelivr or unpkg, and read the kanji table from a CDN."
---

A page with no bundler can import the package's ES modules straight from a CDN. jsDelivr and unpkg both serve the files of the npm package as they are, so every address below is a file in the package's `dist` folder.

## Look words up, from jsDelivr

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jisho from jsDelivr</title>
  </head>
  <body>
    <ul id="words" lang="ja"></ul>
    <script type="module">
      import { loadWords, wordsOf } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jisho/dist/words.js";

      const words = await loadWords("かみ");
      const items = wordsOf(words, "かみ")
        .slice(0, 5)
        .map((one) => Object.assign(document.createElement("li"), { textContent: `${one.written} ${one.meaning}` }));
      document.querySelector("#words").replaceChildren(...items);
    </script>
  </body>
</html>
```

`loadWords` fetches the piece of the dictionary that holds the reading, about 25 kB gzipped, and `wordsOf` reads the words out of it. The pieces are ES modules next to `words.js`, so the browser fetches each from the same CDN and only the ones a lookup needs. The text of a word is set with `textContent`, never as HTML.

## Read the kanji table, from unpkg

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>The kanji table from unpkg</title>
  </head>
  <body>
    <p id="kanji" lang="ja"></p>
    <script type="module">
      import { readKanji } from "https://unpkg.com/@johnmorrisdotca/jisho/dist/index.js";
      import { KANJI } from "https://unpkg.com/@johnmorrisdotca/jisho/dist/data/kanji.data.js";

      const mountain = readKanji(KANJI).find((one) => one.kanji === "山");
      document.querySelector("#kanji").textContent = `${mountain.kanji}: ${mountain.strokes} strokes, ${mountain.meanings.join(", ")}`;
    </script>
  </body>
</html>
```

Each table is a file of its own: this page fetches `index.js`, which holds the functions, and `data/kanji.data.js`, the table of 2,999 kanji, and nothing from the dictionary.

## Before you ship

- **Pin a version.** Write `@johnmorrisdotca/jisho@2/dist/...` so that a new major version never changes your page. Without a version, the CDN gives the latest.
- **Allow the CDN.** A page with a content security policy lists the CDN's host in `script-src`.
- **Credit the data.** The words are JMdict's and the kanji are KANJIDIC2's, both of the Electronic Dictionary Research and Development Group; [Where the data comes from](data-sources.md) has the line to show.
- **In a build, use a bundler.** [Vite and webpack](bundlers.md) follow the package's imports and give each piece a file of its own.
