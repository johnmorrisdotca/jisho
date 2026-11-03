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
