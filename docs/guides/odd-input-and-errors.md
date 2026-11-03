---
title: "Odd input and pieces that will not load"
section: how-to
order: 3
description: "How a text is made plain before it is looked up, what a lookup does with input that is empty or odd, and what WordsLoadError names."
---

## Odd input, and a piece that will not load

A text is made plain before it is looked up (`normalizeText` does it, and you can too): composed and compatibility forms are folded together by NFKC, so full-width letters and digits are half-width and half-width kana full-width; whitespace is collapsed and a space beside Japanese removed; zero-width and control characters are removed; a dash between kana, or ending kana, is the long vowel mark ー. Hiragana and katakana are folded as before. A written form JMdict writes in full-width characters (１人) is found by either spelling, and shown as JMdict writes it.

Whatever the text is, a lookup does not throw. A text that is empty, is not a string, or is far too long to be a word (over 100 characters) is nothing to load and has no words. `wordsOf` still throws a `RangeError` for a text that was not loaded, because that is a mistake in the caller.

A piece that cannot be fetched is asked for once more, and if that fails too, `loadWords`, `loadCommonWords`, `findByMeaning` and `wordsWithKanji` reject with a `WordsLoadError`. It says which piece (`error.piece` is "the readings piece 12 of 294", `error.kind` and `error.index` say it for a program, `error.cause` is what the fetch rejected with), and nothing is remembered of the failure, so asking again tries again. Lookups at the same moment for the same pieces share one fetch.

```ts
import {loadWords,WordsLoadError} from "@johnmorrisdotca/jisho/words";
try {
  await loadWords("かみ");
} catch (error) {
  if (error instanceof WordsLoadError) console.log(error.kind,error.index);
}
```

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
