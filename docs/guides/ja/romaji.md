---
title: "ローマ字で単語を引く"
section: how-to
order: 3
description: "単語を引くときにラテン文字を修正ヘボン式や訓令式のローマ字として読み、ローマ字をかなに変えます。"
---

## ローマ字

`loadWords`と`wordsOf`に`romaji: true`を渡すと、ラテン文字の文字列を修正ヘボン式（または訓令式）のローマ字として読みます。子音の重なりは「っ」、`n'`と`nn`は「ん」、長音記号（マクロン）やサーカムフレックスは長音です。長音は読みの中で何通りにも書かれる（Tōkyōは「とうきょう」、外来語の長音符は「ー」）ので、考えられる書き方をすべて引き、最大八通りです。`CD`や`AI`も表記なので、指定しない限りローマ字としては読みません。ローマ字でない文字列は、指定の有無にかかわらず表記として引かれます。

```ts
import {kanaFromRomaji,loadWords,romajiToKana,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["kami","kōhī"],{romaji:true});
console.log(wordsOf(words,"kami",{romaji:true})[0]?.written);
console.log(wordsOf(words,"kōhī",{romaji:true}).map((one)=>one.reading));
console.log(romajiToKana("shinbun"),kanaFromRomaji("kōhī").slice(0,2));
```

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
