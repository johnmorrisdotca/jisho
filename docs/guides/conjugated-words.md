---
title: "Look up a conjugated word"
section: how-to
order: 3
description: "Find 食べなかった as 食べる, with the path negative, past: the built-in rules, the kinds of word they check, what they cover, and what they do not."
---

## A word as a sentence writes it

A sentence writes its verbs and adjectives conjugated: 食べなかった, 高くて, 勉強していた. A dictionary lists 食べる, 高い and 勉強. `findInflected` looks the text up as it is written and as every dictionary form it could come from, and says how the one comes from the other.

```ts
import {findInflected} from "@johnmorrisdotca/jisho/words";
for (const text of ["食べなかった","高くて","勉強していた"]){
  const [found]=await findInflected(text);
  console.log(text,found?.word.written,found?.path.join(", "));
}
```

`path` is what was done to the dictionary form to make the text, innermost first: 食べなかった is 食べる made negative (食べない) and then past. A text that is a word as it stands has the empty path and comes first.

## How it works

A table of endings, written out from a few dozen templates, walks the endings off one at a time, outermost first, as a learner does: 食べなかった is the past of 食べない, which is the negative of 食べる. That proposes forms, some of which are no word (食べなかう). The dictionary then decides, by the kind of word each proposal would have to be: `kinds` of a `Word` says whether JMdict calls it godan (`g`), ichidan (`i`), an い adjective (`a`), a な adjective (`n`), a する verb (`s`) or 来る (`k`). So 取った is 取る, a godan verb, and never an ichidan 取る; 食べた is not 食べ's godan kin.

The rules are plain data and code, with no fetch, in about 2 kB gzipped. They are also an entry point on their own, for a page that has another dictionary:

```ts
import {deinflect} from "@johnmorrisdotca/jisho/deinflect";
console.log(deinflect("食べなかった").filter((one)=>one.base==="食べる"));
```

## Many texts at once

Load the texts with `inflected: true`, which also loads the dictionary forms each could come from, and read each with `inflectedOf`. It waits for nothing, and it throws, rather than answer as if the dictionary had none, for a text you loaded without `inflected: true`.

```ts
import {inflectedOf,loadWords} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["見ませんでした","書いている"],{inflected:true});
console.log(inflectedOf(words,"見ませんでした")[0]?.path);
console.log(inflectedOf(words,"書いている")[0]?.word.written);
```

`inflectedOf` works on the table of common words with nothing more loaded, so a page that already has `loadCommonWords` can read conjugated forms of the common words with no fetch.

## What it costs

A plain lookup costs one or two pieces of about 25 kB gzipped. Each proposal is a text to look up, and most of a word's proposals fall in the same one or two pieces, so a conjugated text costs a few pieces more than a plain one. The proposals are checked against the dictionary, not shown, so a text no ending fits costs what a plain lookup does.

## What is covered

- Godan and ichidan verbs, する (and a noun with する: 勉強した is 勉強, 愛した is 愛する) and 来る, in kanji and in kana.
- い adjectives, and な adjectives with だ, です and ではない (静かだった is 静か).
- Polite (ます), negative, past, te, conditional (ば and たら), volitional, tari, potential, passive, causative, causative-passive.
- Want to (たい), looks like (そう), too much (すぎる), easy to (やすい), hard to (にくい), while (ながら), and the polite command (なさい).
- The helper verbs a te-form leads: ている, てしまう (ちゃう), ておく (とく), てみる, ていく, てくる, てくれる, てあげる, てもらう, てください.
- Chains of all of them: 食べさせられたくなかった is 食べる, causative, passive, want to, negative, past.

## What is not

- The imperative (食べろ), honorific (keigo) forms, 〜ず, and 〜なければならない as a whole.
- The stem on its own (食べ).
- A noun with だ (学生だった): JMdict marks the な adjectives, not the nouns, so only な adjectives are read.
- 愛する and its kin conjugate their own way (愛さない); that is found as the godan 愛す, which JMdict also lists.
- A typo finds nothing.

The rules are tested on a golden set of 395 forms (every form with its dictionary form, kind and path) written from the conjugation rules, not taken from a program's output. No native reader has checked it yet, and each entry says so.

## See also

- [Look words up](words.md): the lookup these build on, safe and unfiltered modes, and your own lists.
- [Troubleshooting and questions](troubleshooting.md)
