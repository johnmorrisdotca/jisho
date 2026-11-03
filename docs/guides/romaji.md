---
title: "Look words up in romaji"
section: how-to
order: 3
description: "Read Latin letters as modified Hepburn or Kunrei romaji when looking a word up, and turn romaji into kana."
---

## Romaji

Pass `romaji: true` to `loadWords` and `wordsOf`, and a text of Latin letters is read as modified Hepburn or Kunrei. A doubled consonant is っ, `n'` and `nn` are ん, and a macron or circumflex is a long vowel. A reading writes a long vowel more than one way (Tōkyō is とうきょう, a loanword's bar is ー), so every way is looked up, at most eight. It is off unless asked, because `CD` and `AI` are written forms too: a text that is not romaji is looked up as a written form either way.

```ts
import {kanaFromRomaji,loadWords,romajiToKana,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["kami","kōhī"],{romaji:true});
console.log(wordsOf(words,"kami",{romaji:true})[0]?.written);
console.log(wordsOf(words,"kōhī",{romaji:true}).map((one)=>one.reading));
console.log(romajiToKana("shinbun"),kanaFromRomaji("kōhī").slice(0,2));
```

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
