---
title: "意味から単語を探す"
section: how-to
order: 3
description: "英語の語や語句を意味に含む、よく使う日本語の単語を`findByMeaning`で探し、すでに持っている単語は`searchMeanings`で探します。"
---

## 意味から単語を探す

`findByMeaning`は、渡した英語の語や語句を意味にそっくり含む、よく使う単語を探します。訳語に`water`という語があれば一致し、`watermelon`は一致しません。`to`、`the`、`a`、`of`のように、どの訳語にも出てくる語は検索文から除くので、`walk`は「to walk」を見つけます。

```ts
import {findByMeaning} from "@johnmorrisdotca/jisho/words";
const found=await findByMeaning("water",{limit:5});
console.log(found.map((one)=>`${one.written} ${one.meaning}`));
console.log((await findByMeaning("go out",{limit:3})).map((one)=>one.written));
```

訳語がちょうどその語句である単語が先に来て、そのあとによく使う順に並びます。`loadWords`と同じ`mode`、`block`、`allow`を受け取ります。索引には、英語の語ごとに、それを含むよく使う単語20語の読みが入っています。JMdictが順位を付けている単語は、訳語に含まれるすべての語と、訳語の中で続く二語の組のすべてで見つかるので、語句でも単語が見つかります。順位のない単語は、辞書のほとんどがそうですが、最初の訳語の語でしか見つかりません。そのため、とてもよく使われる英語の語では、よく使う単語にしか届かず、語形の変化も考慮しません（`walking`で「walk」は見つかりません）。`limit`（指定がなければ10で、20を超えません）は、取得する辞書のチャンクの最大数でもあり、単語一つにつきチャンク一つです。

`searchMeanings(words, text)`は、すでに持っている単語に対する同じ検索で、何も取得しません。よく使う語の表を検索するのに使えます。

```ts
import {loadCommonWords,searchMeanings} from "@johnmorrisdotca/jisho/words";
const common=await loadCommonWords();
console.log(searchMeanings(common,"paper").slice(0,3).map((one)=>one.written));
```

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
