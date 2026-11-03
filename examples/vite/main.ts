import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

async function show(text: string): Promise<void> {
  const words = await loadWords(text);
  const items = wordsOf(words, text)
    .slice(0, 5)
    .map((one) => Object.assign(document.createElement("li"), { textContent: `${one.written} ${one.meaning}` }));
  document.querySelector("#words")!.replaceChildren(...items);
}

void show("かみ");
