import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
import { renderToString } from "react-dom/server";
import { WordList } from "./WordList";

const words = wordsOf(await loadWords("かみ"), "かみ");
console.log(renderToString(<WordList words={words} />));
