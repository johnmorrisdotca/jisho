---
title: "iframeで埋め込む"
section: how-to
order: 12
description: "読み、意味、漢字の単語を、iframe一つ、スクリプトなしで、どのページにも置けます。"
---

デモサイトには、枠に入れて使うためのページ`embed.html`があります。アドレスに書かれたものを描き、自分のファイル以外は取得しません。そのため、あなたの側にスクリプトも、ビルドも、パッケージも要りません。デモの[「自分のページに入れる」](https://johnmorrisdotca.github.io/jisho/ja/#embed-title)は、ファミリー共通の埋め込みパネルです。引くもの (読みか単語、英語の意味、漢字)、表示する数、単語の範囲を選ぶと、下のiframeと、同じ検索のHTML、ESモジュール、React、Vue、Angular、Svelte用のコードを書いてくれます。コードの横には埋め込みページそのものが出ます。

iframeはこうです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jisho in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/jisho/embed.html?word=%E3%81%8B%E3%81%BF&limit=3&lang=en"
      title="The words read かみ"
      width="360"
      height="420"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

ページは、端末が暗い色を求めなければ明るい色で、`theme=dark`か`theme=light`で決められます。ヘッダーも操作部品もなく、答えとデータの出典だけが載っています。

## アドレスに書けること

| アドレス | 内容 |
| --- | --- |
| `word=かみ` | 読みまたは表記が`かみ`の単語。かな、ローマ字、漢字で書けます。活用した文字は、もとの語を探します（`食べなかった`は食べる）。 |
| `meaning=water` | 英語の意味に`water`を含む、よく使う単語。 |
| `kanji=山` | 漢字1字のカード。画数、学年、JLPTレベル、読み、意味。 |
| `with=山` | その漢字で書く、よく使う単語。 |
| `limit=5` | 単語の数（1から20）。初期値は5です。 |
| `mode=unfiltered` | JMdictにあるすべての語義。初期値は`safe`です。 |
| `lang=ja` | ラベルを日本語にします。初期値は英語です。 |
| `theme=dark` | 色。書かなければ端末の設定に従います。 |

2つ以上書くと、ページはそれぞれを描きます（漢字のカードが先です）。アドレスの日本語はパーセントエンコードします（`%E3%81%8B%E3%81%BF`が「かみ」）。アドレスを打つときはブラウザがしてくれ、コードでは`encodeURIComponent`でできます。

## 初期値は安全

アドレスに`mode=unfiltered`と書かない限り、埋め込みはセーフモードです。セーフモードでは、JMdictが下品、性的、配慮が必要、侮辱的と記した語義や、英訳が性や売春にふれる語義を含むファイルを取得しません。子ども向けのページでは`mode`を書かず、訪れた人にも選ばせないでください。

## 公開する前に

- **枠の大きさを決めます。** 360×420なら単語が3つ入ります。それより多いと、枠の中でスクロールします。
- **枠を許可します。** コンテンツセキュリティポリシーのあるサイトは、`frame-src`に`https://johnmorrisdotca.github.io`を入れます。
- **自分のコピーを置くこともできます。** デモサイトに頼りたくないときは、デモの`embed.html`、`embed.js`、`embed.css`、`family.css`と`dist`フォルダを、同じ場所に並べて公開します。
