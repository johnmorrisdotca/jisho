---
title: "React, Vue, Svelte and Angular"
section: how-to
order: 10
description: "Show a lookup in a component of React, Vue, Svelte or Angular, and render the words on a server."
---

The lookup is a promise, so a component starts it when its text changes, keeps the words in its own state, and drops an answer that arrives after the text has changed. The words are plain rows: show `written`, `reading` and `meaning` as text and nothing needs to be marked safe.

## React

```tsx
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
```

`WordList` only draws the words it is given, and `Lookup` fetches them. Keep the two apart and the first works on a server too.

### Server rendering

```tsx
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
import { renderToString } from "react-dom/server";
import { WordList } from "./WordList";

const words = wordsOf(await loadWords("かみ"), "かみ");
console.log(renderToString(<WordList words={words} />));
```

A server render cannot wait for an effect, so load the words first (a route's loader, a server component, a script) and hand them to `WordList`. The piece files are read from `node_modules` at run time; keep the package external to the server's bundle so the whole dictionary is not carried in it.

## Vue 3

```vue
<script setup lang="ts">
import { loadWords, type Word, wordsOf } from "@johnmorrisdotca/jisho/words";
import { ref, watchEffect } from "vue";

const props = defineProps<{ text: string }>();
const words = ref<readonly Word[]>([]);

watchEffect(async () => {
  const text = props.text;
  const loaded = await loadWords(text);
  if (text === props.text) words.value = wordsOf(loaded, text);
});
</script>

<template>
  <ul id="words" lang="ja">
    <li v-for="one in words.slice(0, 5)" :key="one.written + one.reading">{{ one.written }} {{ one.meaning }}</li>
  </ul>
</template>
```

```ts no-check
import { createApp } from "vue";
import WordList from "./WordList.vue";

createApp(WordList, { text: "かみ" }).mount("#app");
```

## Svelte

```svelte
<script lang="ts">
import { loadWords, type Word, wordsOf } from "@johnmorrisdotca/jisho/words";

let { text }: { text: string } = $props();
let words = $state<readonly Word[]>([]);

$effect(() => {
  const asked = text;
  void loadWords(asked).then((loaded) => {
    if (asked === text) words = wordsOf(loaded, asked);
  });
});
</script>

<ul id="words" lang="ja">
  {#each words.slice(0, 5) as one (one.written + one.reading)}
    <li>{one.written} {one.meaning}</li>
  {/each}
</ul>
```

## Angular

```ts no-check
import { Component, Input, type OnChanges, type OnInit, type SimpleChanges, signal } from "@angular/core";
import { loadWords, type Word, wordsOf } from "@johnmorrisdotca/jisho/words";

@Component({
  selector: "app-word-list",
  standalone: true,
  template: `
    <ul id="words" lang="ja">
      @for (one of words(); track one.written + one.reading) {
        <li>{{ one.written }} {{ one.meaning }}</li>
      }
    </ul>
  `,
})
export class WordListComponent implements OnInit, OnChanges {
  @Input() text = "かみ";
  readonly words = signal<readonly Word[]>([]);

  ngOnInit(): void {
    void this.show();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["text"]?.firstChange === false) void this.show();
  }

  private async show(): Promise<void> {
    const asked = this.text;
    const loaded = await loadWords(asked);
    if (asked === this.text) this.words.set(wordsOf(loaded, asked).slice(0, 5));
  }
}
```

The component uses signals and control flow, and works zoneless. Bootstrap it as in any standalone Angular app.
