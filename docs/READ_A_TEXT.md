# Read a text

`readText` cuts a text into words. From each place it takes the longest stretch the dictionary has a word for, as it stands or as a conjugated form (食べなかった is 食べる), and looks ahead one word so that 今日はいい天気 is 今日, は and いい天気, not 今日, はい and い天気. Each word has its `furigana` (the kanji with the kana that read them), its `reading` in hiragana, its `meaning`, the hardest JLPT `level` among its kanji and each kanji's grade and level. Japanese that no word fits is `unknown` and is listed; spaces, punctuation, Latin letters and digits are kept as `other`. It fetches Jisho's own pieces as the text needs them, about 25 kB gzipped each: a first sentence of fifteen characters took about 30 of them, and the next text reuses what is already fetched.

```ts
import { readText, studyList, studyListText } from "@johnmorrisdotca/jisho/words";

const result = await readText("私は寿司を食べなかった。");
console.log(result.tokens.map((token) => token.text)); // ["私", "は", "寿司", "を", "食べなかった", "。"]
const token = result.tokens[4];
console.log(token?.furigana, token?.form, token?.path); // 食 (た) べなかった, 食べる, ["negative", "past"]
console.log(result.unknown); // []
console.log(studyListText(studyList(result), "csv").split("\n")[1]); // 私,わたし,"I, me",N4,6,1,私
```

`studyList(result)` gives each word once, in order, with how often it came and the form it first came in; `studyListText(rows, "csv")` has a header and quotes what needs it, and `"tsv"` has tabs and no header, to paste into a spreadsheet or import into a flashcard program. Jisho has JLPT levels for kanji and none for words, so a word's level is that of its hardest kanji, and null for a word with no kanji.
