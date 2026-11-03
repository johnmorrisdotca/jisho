---
title: "Find words by meaning"
section: how-to
order: 3
description: "Find the commonest Japanese words whose English meaning holds a word or phrase, with findByMeaning, or search words you already have with searchMeanings."
---

## Find words by what they mean

`findByMeaning` finds the commonest words whose English meaning holds the whole word or phrase you give it. A gloss that holds `water` matches; `watermelon` does not. Words that every gloss has (`to`, `the`, `a`, `of`) are left out of the text, so `walk` finds "to walk".

```ts
import {findByMeaning} from "@johnmorrisdotca/jisho/words";
const found=await findByMeaning("water",{limit:5});
console.log(found.map((one)=>`${one.written} ${one.meaning}`));
console.log((await findByMeaning("go out",{limit:3})).map((one)=>one.written));
```

The words whose gloss is exactly the text come first (a word whose first gloss it is, such as 飲む for `drink`, before one that has it later), then the commonest. It takes the `mode`, `block` and `allow` that `loadWords` takes. The index holds, for each English term, the readings of twenty words that have it: up to ten whose gloss is exactly the term, then the commonest that merely hold it; every word JMdict ranks has all of its terms and every pair of terms that follow each other in a gloss (so a phrase finds its words), and a word it does not rank, which is most of the dictionary, only the terms of its first gloss. So a very common term reaches only the commonest words, there is no stemming (`walking` does not find "walk"), and `limit` (10 unless you say, and never more than 20) is also the most pieces of the dictionary it fetches, one for each word.

`searchMeanings(words, text)` is the same search over words you already have, with nothing fetched. It is the way to search the common table:

```ts
import {loadCommonWords,searchMeanings} from "@johnmorrisdotca/jisho/words";
const common=await loadCommonWords();
console.log(searchMeanings(common,"paper").slice(0,3).map((one)=>one.written));
```

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
