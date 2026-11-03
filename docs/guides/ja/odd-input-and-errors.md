---
title: "変わった入力と、読み込めないチャンク"
section: how-to
order: 3
description: "引く前に文字列がどう整えられるか、空や変わった入力を検索がどう扱うか、`WordsLoadError`が何を示すかを説明します。"
---

## 変わった入力と、読み込めないチャンク

文字列は、引く前に整えられます（`normalizeText`が行うので、自分で使うこともできます）。NFKCで合成形と互換形がそろい、全角の英数字は半角に、半角かなは全角になります。空白は一つにまとめ、日本語の隣の空白は取り除きます。幅のない文字と制御文字は取り除き、かなの間やかなで終わる位置のダッシュは長音符「ー」にします。ひらがなとカタカナのそろえは従来どおりです。JMdictが全角で書いている表記（１人）は、どちらの書き方でも見つかり、JMdictの書き方で表示されます。

どんな文字列でも、検索は例外を投げません。空の文字列、文字列でないもの、単語としては長すぎるもの（100文字超）は、取得するものがなく、単語もありません。ただし、`wordsOf`は、読み込んでいない文字列に対しては、呼び出し側の誤りなので、これまでどおり`RangeError`を投げます。

チャンクを取得できないときは、もう一度だけ取得を試み、それも失敗すると、`loadWords`、`loadCommonWords`、`findByMeaning`、`wordsWithKanji`は`WordsLoadError`で拒否されます。どのチャンクかが分かり（`error.piece`は「the readings piece 12 of 294」のような文字列、`error.kind`と`error.index`はプログラム向け、`error.cause`は取得が拒否された理由）、失敗は記憶されないので、もう一度頼めば、また取得を試みます。同時に行われた、同じチャンクへの検索は、一つの取得を共有します。

```ts
import {loadWords,WordsLoadError} from "@johnmorrisdotca/jisho/words";
try {
  await loadWords("かみ");
} catch (error) {
  if (error instanceof WordsLoadError) console.log(error.kind,error.index);
}
```

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
