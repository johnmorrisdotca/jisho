---
title: "漢字から単語を探す"
section: how-to
order: 3
description: "ある漢字で書かれるよく使う単語を探し、各単語を漢字の表につないで、含まれる漢字の学年、レベル、読み、意味を表示します。"
---

## 漢字から単語を探す

`wordsWithKanji`は、ある漢字で書かれるよく使う単語を探し、その漢字を含む表記で表示します。`kanjiOfWord`は単語を漢字の表につなぎ、単語に含まれる漢字の学年、レベル、読み、意味を表示できるようにします。索引には、漢字ごとによく使う単語60語が入っています。

```ts
import {readKanji} from "@johnmorrisdotca/jisho";
import {KANJI} from "@johnmorrisdotca/jisho/kanji";
import {kanjiOfWord,wordsWithKanji} from "@johnmorrisdotca/jisho/words";
const table=readKanji(KANJI);
for (const word of await wordsWithKanji("山",{limit:3}))
  console.log(word.written,word.meaning,kanjiOfWord(word,table).map((one)=>`${one.kanji} ${one.level}`));
```

漢字を含まない文字列では何も見つかりません。漢字が複数あれば、最初の一字を使います。

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
