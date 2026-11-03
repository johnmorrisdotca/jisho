---
title: "React、Vue、Svelte、Angular"
section: how-to
order: 10
description: "React、Vue、Svelte、Angularのコンポーネントで単語を引き、サーバーで単語を描きます。"
---

単語を引く処理はPromiseです。コンポーネントは、文字が変わったら引き始め、単語を自分の状態に持ち、文字が変わったあとに届いた答えは捨てます。単語はふつうの行なので、`written`、`reading`、`meaning`を文字として表示するだけでよく、安全の印を付ける必要はありません。

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

`WordList`は渡された単語を描くだけで、`Lookup`が単語を取得します。この2つを分けておけば、前者はサーバーでも動きます。

### サーバーでの描画

```tsx
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";
import { renderToString } from "react-dom/server";
import { WordList } from "./WordList";

const words = wordsOf(await loadWords("かみ"), "かみ");
console.log(renderToString(<WordList words={words} />));
```

サーバーでの描画はエフェクトを待てません。単語を先に読み込み（ルートのローダー、サーバーコンポーネント、スクリプトなど）、`WordList`に渡します。チャンクのファイルは実行時に`node_modules`から読みます。辞書全体がバンドルに入らないよう、サーバーのバンドルではこのパッケージを外部扱いにしてください。

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

このコンポーネントはシグナルと新しい制御フロー構文を使い、zoneなしで動きます。起動は、ふつうのスタンドアロンのAngularアプリと同じです。
