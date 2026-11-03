---
title: "How common a word is"
section: how-to
order: 3
description: "Read JMdict's priority tags and the single rank made from them, and put words in the order of commonness."
---

## How common a word is

JMdict tags a word with its priority: `news1` and `news2`, `ichi1` and `ichi2`, `spec1` and `spec2`, `gai1` and `gai2`, and `nf01` to `nf48`, the band of the 24,000 commonest words in a newspaper count. A `Word` has them as `priority`, and `rank` is one number made from them, lower being commoner: the band's middle if there is one (`nf03` is 1,250), else 12,000 for the first grade of any list and 24,000 for the second, else 100,000 for a word with no priority. A lookup already gives the commonest first; `commonestFirst(words)` puts any list in that order, and `priorityTags` and `rankOfTags` are what the rank is made with.

```ts
import {commonestFirst,loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ");
const [first]=commonestFirst(wordsOf(words,"かみ"));
console.log(first?.written,first?.rank,first?.priority);
```

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
