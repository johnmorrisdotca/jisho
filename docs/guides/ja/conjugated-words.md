---
title: "活用した形の単語を引く"
section: how-to
order: 3
description: "Hikidashiの`dictionaryForms`とJishoが示す語の種類を組み合わせて、「食べました」から「食べる」を見つけます。"
---

## 文の中の形のままの単語

Jisho自身は、辞書に載っているものを引くだけで、活用の処理を持ちません。「食べました」では何も見つからず、「食べる」なら見つかります。[Hikidashi](https://github.com/johnmorrisdotca/hikidashi)の`dictionaryForms`は、書かれた語の元になりうる辞書形を、それぞれがどの種類の語でなければならないかとともに挙げます。`Word`の`kinds`はJMdictがその単語を何の種類としているかを示すので、両方を合わせると単語が分かります。HikidashiはJishoの依存先ではありません。

```ts
import {dictionaryForms} from "@johnmorrisdotca/hikidashi/deinflect";
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const LETTER={godan:"g",ichidan:"i",iAdjective:"a",suru:"s",kuru:"k"} as const;
async function dictionaryWords(written:string){
  const proposals=dictionaryForms(written);
  const words=await loadWords([written,...proposals.map((one)=>one.base)]);
  return [
    ...wordsOf(words,written),
    ...proposals.flatMap((one)=>wordsOf(words,one.base).filter((word)=>word.kinds.includes(LETTER[one.wordClass]))),
  ];
}
console.log((await dictionaryWords("食べました"))[0]?.written);
console.log((await dictionaryWords("行きます"))[0]?.written);
```

## 関連

- [単語を引く](words.md)：これらの土台になる検索、セーフモードとフィルターなし、自分のリスト。
- [困ったときと質問](troubleshooting.md)
