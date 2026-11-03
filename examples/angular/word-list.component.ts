import { Component, Input, type OnChanges, signal } from "@angular/core";
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
export class WordListComponent implements OnChanges {
  @Input() text = "かみ";
  readonly words = signal<readonly Word[]>([]);

  async ngOnChanges(): Promise<void> {
    const asked = this.text;
    const loaded = await loadWords(asked);
    if (asked === this.text) this.words.set(wordsOf(loaded, asked).slice(0, 5));
  }
}
