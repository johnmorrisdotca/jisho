---
title: "ふつうのページとCDN"
section: how-to
order: 8
description: "ビルドなしのページで、jsDelivrやunpkgから単語を引き、漢字の表を読みます。"
---

バンドラーのないページでも、CDNからこのパッケージのESモジュールをそのままimportできます。jsDelivrもunpkgもnpmパッケージのファイルをそのまま配るので、下のアドレスはどれもパッケージの`dist`フォルダにあるファイルです。

## jsDelivrから単語を引く

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

`loadWords`は、その読みを含む辞書のチャンクを取得します（gzipで約25 kB）。`wordsOf`がそこから単語を取り出します。チャンクは`words.js`の隣にあるESモジュールなので、ブラウザは同じCDNから、引くのに必要なものだけを取得します。単語の文字は`textContent`で入れていて、HTMLとしては入れません。

## unpkgから漢字の表を読む

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

表はそれぞれ別のファイルです。このページが取得するのは、関数が入った`index.js`と、2,999字の漢字の表`data/kanji.data.js`だけで、辞書は取得しません。

## 公開する前に

- **バージョンを固定します。** `@johnmorrisdotca/jisho@2/dist/...`のように書くと、新しいメジャーバージョンでページが変わりません。バージョンを書かないと、CDNは最新のものを返します。
- **CDNを許可します。** コンテンツセキュリティポリシーのあるページは、`script-src`にCDNのホストを入れます。
- **データの出典を表示します。** 単語はJMdict、漢字はKANJIDIC2のもので、どちらも電子辞書研究開発グループ（EDRDG）のものです。表示する文は[データの出どころ](data-sources.md)にあります。
- **ビルドするときはバンドラーを使います。** [Viteとwebpackの](bundlers.md)では、パッケージのimportをたどって、チャンクごとにファイルを作ります。
