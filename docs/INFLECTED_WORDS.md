# A word as a sentence writes it

`findInflected` looks a text up as it is written, conjugated or not: 食べなかった finds 食べる, and says how the one comes from the other, `negative, past`. A rule table of the endings (godan, ichidan, する, 来る, い and な adjectives; polite, negative, past, te, conditional, volitional, potential, passive, causative, want-to, looks-like and chains of them) proposes the dictionary forms, and the dictionary keeps only those that are the kind of word the ending needs, so 取った is 取る and never an ichidan 取る. It costs the pieces of the proposals, a few more than a plain lookup.

```ts
import { findInflected } from "@johnmorrisdotca/jisho/words";

for (const text of ["食べなかった", "高くて", "勉強していた"]) {
  const [found] = await findInflected(text);
  console.log(text, found?.word.written, found?.path.join(", ")); // 食べなかった 食べる negative, past
}
```

For many texts, load them with `inflected: true` and read each with `inflectedOf`, which waits for nothing. The rules alone, with no dictionary and no fetch, are `deinflect` at `@johnmorrisdotca/jisho/deinflect` (about 2.1 kB gzipped); they only propose, and what is real is for the dictionary to say.

```ts
import { deinflect } from "@johnmorrisdotca/jisho/deinflect";
import { inflectedOf, loadWords } from "@johnmorrisdotca/jisho/words";

const words = await loadWords(["見ませんでした", "書いている"], { inflected: true });
console.log(inflectedOf(words, "見ませんでした")[0]?.path); // ["polite", "negative", "past"]
console.log(inflectedOf(words, "書いている")[0]?.word.written); // 書く
console.log(deinflect("食べさせられた").map((one) => one.base).includes("食べる")); // true
```
