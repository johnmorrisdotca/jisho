---
title: "Look up a conjugated word"
section: how-to
order: 3
description: "Find 食べました as 食べる by pairing Hikidashi's dictionaryForms with the kinds of word Jisho reports."
---

## A word as a sentence writes it

Jisho looks up what the dictionary lists, and has no conjugation of its own: 食べました finds nothing, 食べる does. [Hikidashi](https://github.com/johnmorrisdotca/hikidashi)'s `dictionaryForms` proposes the dictionary forms a written word could come from, each with the kind of word it would have to be, and a `Word`'s `kinds` says what kind JMdict says it is, so the two together give the word. Hikidashi is not a dependency of Jisho.

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

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
