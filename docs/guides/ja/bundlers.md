---
title: "Viteとwebpack"
section: how-to
order: 9
description: "Viteやwebpackのプロジェクトでこのパッケージを使い、ビルドに何が入るかを説明します。"
---

このパッケージはESモジュールで、型が付いていて、外部依存はありません。インストールしてimportするだけで、設定は要りません。

```sh
npm install @johnmorrisdotca/jisho
```

辞書のチャンクはそれぞれ別のモジュールで、`loadWords`が必要なときにimportします。コード分割のできるバンドラーは、チャンクごとに別のファイルを作ります。そのためビルドには辞書がすべて入り（Viteのビルドで640ファイル、約42 MB）、ページが取得するのは引いたチャンクだけです。ファイルを持ちたくないときは、[単語を引く](words.md)に、サーバーのバンドルから外す方法があります。

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

Viteは「500 kBより大きいチャンクがあります」と警告しますが、辞書のチャンクについては本当のことで、問題ではありません。ページが取得するのは1つか2つ（それぞれgzipで約25 kB）で、残りは取得しません。

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

webpack 5では、このパッケージのためのローダーは要りません。`chunkFilename`でチャンクに名前を付け、入口の隣に置きます。

## バンドルに入るもの

ページが読み込む入口は、圧縮前で約55 kB（gzipで16 kB）、チャンクの場所を書いたマニフェストは20 kB（gzipで4 kB）です。残りは、引くたびに必要な分だけ取得します。引き方ごとの費用は[単語を引く](words.md)にあります。
