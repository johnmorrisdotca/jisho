import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

async function show(text) {
  const words = await loadWords(text);
  const list = document.createElement("ul");
  list.id = "words";
  list.lang = "ja";
  for (const one of wordsOf(words, text).slice(0, 5)) {
    const item = document.createElement("li");
    item.textContent = `${one.written} ${one.meaning}`;
    list.append(item);
  }
  document.body.append(list);
}

void show("かみ");
