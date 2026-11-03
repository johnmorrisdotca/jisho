---
title: "どれくらいよく使う語か"
section: how-to
order: 3
description: "JMdictの優先度のタグと、そこから作った一つの数（`rank`）を読み、単語をよく使う順に並べます。"
---

## どれくらいよく使う語か

JMdictは単語に優先度のタグを付けています。`news1`と`news2`、`ichi1`と`ichi2`、`spec1`と`spec2`、`gai1`と`gai2`、そして`nf01`から`nf48`で、これは新聞での頻度による、よく使う2万4千語の区分です。`Word`ではこれが`priority`で、`rank`はそこから作った一つの数で、小さいほどよく使います。区分があればその中央の値（`nf03`は1,250）、なければどの一覧でも第1段階なら12,000、第2段階なら24,000、優先度のない単語は100,000です。検索結果はすでによく使う順です。`commonestFirst(words)`は、どんな一覧もその順に並べます。`priorityTags`と`rankOfTags`は、順位の作り方そのものです。

```ts
import {commonestFirst,loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ");
const [first]=commonestFirst(wordsOf(words,"かみ"));
console.log(first?.written,first?.rank,first?.priority);
```

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
