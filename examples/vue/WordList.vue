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
