import { loadWords, type Word, wordsOf } from "@johnmorrisdotca/jisho/words";
import { useEffect, useState } from "react";

export function WordList({ words }: { words: readonly Word[] }) {
  return (
    <ul id="words" lang="ja">
      {words.slice(0, 5).map((one) => (
        <li key={`${one.written}-${one.reading}`}>
          {one.written} {one.meaning}
        </li>
      ))}
    </ul>
  );
}

export function Lookup({ text }: { text: string }) {
  const [words, setWords] = useState<readonly Word[]>([]);
  useEffect(() => {
    let current = true;
    void loadWords(text).then((loaded) => current && setWords(wordsOf(loaded, text)));
    return () => {
      current = false;
    };
  }, [text]);
  return <WordList words={words} />;
}
