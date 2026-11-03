---
title: "Vite and webpack"
section: how-to
order: 9
description: "Use the package in a Vite or webpack project, and what the build holds."
---

The package is ES modules with types and no dependency. Install it, import it, and there is nothing to configure.

```sh
npm install @johnmorrisdotca/jisho
```

Each piece of the dictionary is its own module, which `loadWords` imports when a lookup needs it. A bundler with code splitting makes each a file of its own, so the build holds the whole dictionary (640 files, about 42 MB in a Vite build) and a page fetches only the pieces it looks up. If you would rather not carry the files, [Look words up](words.md) says how to keep them out of a server's bundle.

## Vite

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jisho with Vite</title>
  </head>
  <body>
    <ul id="words" lang="ja"></ul>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

```ts no-run
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

async function show(text: string): Promise<void> {
  const words = await loadWords(text);
  const items = wordsOf(words, text)
    .slice(0, 5)
    .map((one) => Object.assign(document.createElement("li"), { textContent: `${one.written} ${one.meaning}` }));
  document.querySelector("#words")!.replaceChildren(...items);
}

void show("かみ");
```

Vite reports that some chunks are larger than 500 kB, which is true of a piece of the dictionary and is not a problem: a page fetches one or two of them, about 25 kB gzipped each, and not the others.

## webpack

```js no-check
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js", chunkFilename: "[name].js" },
};
```

```js no-check
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

async function show(text) {
  const words = await loadWords(text);
  const list = document.createElement("ul");
  list.id = "words";
  list.lang = "ja";
  for (const one of wordsOf(words, text).slice(0, 5)) {
    const item = document.createElement("li");
    item.textContent = `${one.written} ${one.meaning}`;
    list.append(item);
  }
  document.body.append(list);
}

void show("かみ");
```

webpack 5 needs no loader for the package. `chunkFilename` names the pieces so that they sit next to the entry.

## What reached the bundle

The entry the page loads is about 55 kB minified (16 kB gzipped) and the manifest that says where the pieces are 20 kB (4 kB gzipped); the rest is fetched as a lookup reaches it. [Look words up](words.md) gives what each kind of lookup costs.
