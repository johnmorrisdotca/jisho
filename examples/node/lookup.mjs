import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const words = await loadWords("かみ");
for (const one of wordsOf(words, "かみ").slice(0, 3)) console.log(one.written, one.meaning);
