---
title: "単語を引く"
section: how-to
order: 3
description: "読み、表記、英語の意味、含まれる漢字、ローマ字から単語を探し、セーフモードとフィルターなしを選び、自分のリストと印を使い、読み込めないチャンクを扱い、サーバーのバンドルにこの辞書を入れないようにします。"
---

## 単語を引く

`loadWords`は、渡した文字列についてJMdictが持つものだけを取得し、それ以外は取得しません。取得したあとは`wordsOf`が待たずに読みます。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["かみ","紙"]);
console.log(wordsOf(words,"かみ").slice(0,3).map((one)=>`${one.written} ${one.meaning}`));
console.log(wordsOf(words,"紙")[0]?.reading);
```

かなだけの文字列は読みとして扱い、ひらがなとカタカナは同じ単語を見つけます。`カミ`は`かみ`と同じ結果になります。そのほかの文字列は表記として扱います。一つの読みに複数の単語があるときは、よく使う順に、それぞれの表記を付けて返します。「かみ」なら、紙（paper）、神（god）、髪（hair）のあとに、あまり使われない語が続きます。

返ってくる各単語は`Word`です。`written`は表示に使う表記、`reading`は読み、`forms`はすべての表記、`meaning`は短い英語の意味（`senses`から作られます）、`senses`は各語義で、JMdictが付けた`marks`（印）と`glosses`（訳語）を持ち、`kinds`は語の種類を表す文字（g 五段、i 一段、a い形容詞、n な形容詞、s する動詞、k 来る）、`common`はJMdictがよく使う語としているかどうか、`priority`はJMdictが付けた優先度のタグ、`rank`はそこから作った一つの数です（[どれくらいよく使う語か](word-rank.md)を参照）。

単語のない文字列に対しては、`wordsOf`は空のリストを、`meaningOf`は`null`を返します。代わりの答えを作ることはありません。

```ts
import {loadWords,meaningOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords(["紙","ぬぬぬぬぬ"]);
console.log(meaningOf(words,"紙"));
console.log(meaningOf(words,"ぬぬぬぬぬ"));
```

`wordsOf`は、取得していない文字列に対しては、単語なしと答える代わりに例外を投げます。空の答えは辞書に単語がないという意味になってしまうからです。答えられるかどうかは`isLoaded(words, text)`で分かります。

## 取得済みのものに足す

ゲームが一度に調べるのは、入力された言葉一つです。すでに取得したものを`previous`として渡すと、それは保たれ、もう一度取得されることはありません。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const first=await loadWords("かみ");
const second=await loadWords("いぬ",{previous:first});
console.log(wordsOf(second,"かみ").length>0,wordsOf(second,"いぬ").length>0);
```

## セーフモードとフィルターなし

引くときは、`mode: "unfiltered"`を指定しない限り、**セーフ**モードです。セーフモードは、JMdictが下品（`vulg`）、性的（`X`）、配慮が必要（`sens`）、侮辱的（`derog`）と記している語義を除き、英訳が性や売春にふれる語義も除きます（JMdictが印を付けていないこともあります）。そのような語義だけが当てはまる表記や読みと、すべての語義がそうである単語も除きます。除くものを含むファイルは取得しないので、取得するデータも少なくて済みます。残る語義が一つもない単語は見つからず、`wordsOf`は空のリストを、`meaningOf`は`null`を返します。JMdictにない単語と同じ扱いです。フィルターなしは、JMdictにあるすべてです。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("ほもびでお");
console.log(wordsOf(words,"ほもびでお"));
const everything=await loadWords("ほもびでお",{mode:"unfiltered"});
console.log(wordsOf(everything,"ほもびでお").map((one)=>one.meaning));
```

フィルターなしでは、検索に必要なチャンクに加えて、同じ読みや表記についてセーフモードが除いたものを収めたチャンクも取得します。読みなら、gzipで約19 kBが一度だけ増え、小さな目録も要ります。セーフモードの単語とフィルターなしの単語は一つにまとめられないので、`previous`は新しい呼び出しと同じモードのものでなければなりません。

セーフモードが使う印は、[Kotoba](https://github.com/johnmorrisdotca/kotoba)が単語リストから誰にでも向くわけではないものを除くのに使うものと同じで、`SAFE_MARKS`として参考のために公開されています。印はJMdict自身のもので、完全ではありません。印のない語義は、セーフモードでも残ります。セーフモードが除くものを収めたチャンクは、ほかのデータと同じく、パッケージの中にあり、公開されています。セーフモードの検索が取得しないので、頼んでいないブラウザーには届きません。ただし、パッケージをインストールする人やファイルを要求する人から内容を隠すものではありません。

## 自分のリスト

Jisho自身は、単語のリストを持ちません。使う側が自分のリストを用意し、どちらのモードにも重ねて渡します。`block`は除く読みや表記、`allow`はそれだけを残す読みや表記です。リストは、読みでも表記のどれかでも単語を指します。照合は、リスト側も単語側も、かなをひらがなにそろえて行います。そのため、複数の単語が共有する読みは、そのすべてを指します。`block`も`allow`も、渡したときだけ適用され、空の`allow`は何も残しません。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ",{block:["神"]});
console.log(wordsOf(words,"かみ").map((one)=>one.written).slice(0,3));
const only=await loadWords("かみ",{allow:["紙","髪"]});
console.log(wordsOf(only,"かみ").map((one)=>one.written));
```

## 印と、引いた結果を絞る道具

どの語義にも、JMdictが付けた印が付いています。印はコードで、用法（`vulg`、`col`、`sl`、`arch`、`obs`、`uk`など）、分野（`food`、`med`など）、方言（`ksb`など）があります。引いた結果の単語に使う小さな純粋関数が四つあり、呼ばない限り何も適用しません。

| 関数 | 働き |
| --- | --- |
| `hasMarks(word, marks)` | 単語のどれかの語義が、いずれかの印を持つかどうか |
| `withoutMarks(words, marks)` | いずれかの印を持つ語義を除いた単語。語義が残らない単語は除き、意味は作り直す |
| `withoutWords(words, list)` | リストに挙げた単語を除いたもの |
| `onlyWords(words, list)` | リストに挙げた単語だけ |

```ts
import {loadWords,withoutMarks,wordsOf} from "@johnmorrisdotca/jisho/words";
const words=await loadWords("かみ",{mode:"unfiltered"});
console.log(withoutMarks(wordsOf(words,"かみ"),["arch","obs"]).map((one)=>one.meaning).slice(0,3));
```

## ほかの探し方

次の探し方には、それぞれ専用のガイドがあります。

- [意味から単語を探す](find-by-meaning.md)
- [漢字から単語を探す](words-by-kanji.md)
- [ローマ字で単語を引く](romaji.md)
- [どれくらいよく使う語か](word-rank.md)
- [活用した形の単語を引く](conjugated-words.md)
- [テキストを読む](read-text.md)：テキストを単語に分け、ふりがな、意味、レベル、学習リストを得る。
- [変わった入力と、読み込めないチャンク](odd-input-and-errors.md)

## どの表を使うか、大きさはどれくらいか

| やりたいこと | 使うもの | 取得するもの |
| --- | --- | --- |
| 入力された言葉の意味、目にした単語、少数の単語 | `loadWords` | 読みなら約25 kB（gzip）のチャンクが一つ。表記なら、索引の約30 kBのチャンクが一つと、行の約25 kBのチャンクが一つ |
| JMdictにあるすべてを知りたい | `loadWords(…, { mode: "unfiltered" })` | 同じものに加え、読みなら約19 kBのチャンクを一つ追加で取得 |
| 多数の単語（よく使う語だけ） | `loadCommonWords`、または`words-common`の`readCommonWords(COMMON_WORDS)` | 約820 kB（gzip）の表が一つ。そのあとの検索は待たずに答える |
| 英語の意味から単語を探す | `findByMeaning` | その語の索引のチャンク（約15 kB、gzip）が一つと、見つかった単語ごとに辞書のチャンクが一つ。`water`で10語取得すると約160 kB、`walk`で10語取得すると最大約250 kB（gzip） |
| 漢字から単語を探す | `wordsWithKanji` | 同じく、その漢字の索引のチャンクと、単語ごとのチャンク。「山」で10語取得すると約190 kB（gzip） |
| ローマ字 | `loadWords(…, { romaji: true })` | 読み替えたかなと同じ。長音は複数に読めるので、チャンクが数個増えることがある |

辞書は、読みで分けた行のチャンク316個と、表記から読みへの索引を表記で分けたチャンク70個からなります。`words`には各チャンクの始まりが入っていて、検索は文字列とその始まりを比べてチャンクを見つけます。どのチャンクも約100 kB以下で、検索に必要になるまで取得されません。

よく使う語の表には、JMdictがよく使う語としているもののうち、セーフモードで残る25,999語が入っています（表記か読みに`news1`、`ichi1`、`spec1`、`spec2`、`gai1`のどれかが付いているもの）。この表はどんな文字列にも答えますが、答えるのはよく使う語だけです。まれな語と読みが同じでも、よく使う語しか見つかりません。どちらを持っているかは、`Words`の`scope`で分かります。フィルターなしでは、`loadCommonWords({ mode: "unfiltered" })`が`common-extra.data`（gzipで約27 kB）も取得します。これは、何を加えて何を変えるかを示すもので、`readCommonWords`を使う場合は、自分で`extra`として渡します。

## ブラウザーで

`import("@johnmorrisdotca/jisho/words")`が読み込むのは、チャンクを見つける小さな部分だけです。チャンクはそれぞれ独立したモジュールなので、コード分割のできるバンドラー（Vite、webpack、Rollup、`splitting`を付けたesbuild）はチャンクごとにファイルを作り、ブラウザーは検索で必要になったものだけを取得します。単語はページを開くときではなく、必要になったときに取得します。

```ts no-run
const { loadWords, wordsOf } = await import("@johnmorrisdotca/jisho/words");
```

## サーバーで

`words`は、検索を行う場所でだけインポートしてください。`loadWords`をたどるバンドラーはすべてのチャンク（約50 MB）に行き着くので、ページやルートの先頭でインポートするサーバーは、そのすべてを抱えることになります。バンドルから外すには次のようにします。

- パッケージを外部扱いにし、サーバーが実行時に`node_modules`から読むようにします。Next.jsなら`serverExternalPackages: ["@johnmorrisdotca/jisho"]`、esbuildやwebpackなら`external`です。
- 検索は、それを必要とする一つのルートかアクションの中で行い、すべての訪問が通るページの描画経路では行いません。
- ビルドがたどれるファイルだけをホストにコピーする環境では、`node_modules/@johnmorrisdotca/jisho/dist/data/words`がその中に入るようにするか、単語の検索をブラウザーで行います。

サーバーは読み込んだチャンクをメモリに保つので、同じチャンクの二度目の検索にコストはかかりません。

## かかるコスト

2026-11-03に、Node 24、Mac一台で2.0.0と比べて測りました。かなでの検索は以前と同じファイルです。索引のチャンクは、上の検索を行うときだけ取得されます。

| | 2.0.0 | 2.1.0 |
| --- | --- | --- |
| メインのエントリ`@johnmorrisdotca/jisho`（最小化してgzip） | 0.8 kB | 0.8 kB |
| かなでの検索（`loadWords("かみ")`）で取得するチャンク（gzip） | 1個、25 kB | 1個、25 kB |
| 表記での検索（`loadWords("紙")`） | 2個、56 kB | 2個、56 kB |
| 読み込み後の`wordsOf`、かみ（9語） | 1.0 µs | 1.4 µs |
| 読み込み後の`wordsOf`、紙（2語） | 0.19 µs | 0.33 µs |
| `readCommonWords(COMMON_WORDS)`（25,999行） | 64〜72 ms | 73〜80 ms |
| `normalizeText("ｶﾐ ")` | なし | 2 µs。すでに整った文字列なら0.3 µs |
| すべてのチャンクを含めたwordsエントリ（最小化してgzip） | 9.97 MB | 13.74 MB |
| パッケージ内のチャンクのJavaScript（展開後） | 34.9 MB | 48.0 MB |
| npmからダウンロードするパッケージ | 10.2 MB | 13.9 MB |

検索ごとに増える時間は、文字列を整える分の、1マイクロ秒に満たない程度です。増えた大きさは索引の分で、意味の索引が173個、漢字の索引が50個のチャンクで、セーフモードが除くものを収めたチャンクが14個です。

## 単語の作り方

`pnpm words`（`scripts/build-words.mjs`）がJMdict_eから`src/data/words/`を書き出し、EDRDGの求めに従って、毎月1日にワークフローがこれを実行します。一つの行は、一つの項目の一つの読みにあたり、それに付く表記、フラグが入ります。語義は最初の四つまでで、それぞれに印と最大三つの訳語が付き、意味は単語を読むときに語義から作ります（最大二つの語義を、訳語の切れ目で約60文字以内に収めます）。チャンクにはセーフモードの行が入り、セーフモードが除く分を収めた別のチャンクには、答えが変わる読みや表記のすべてについて、JMdictにあるそのままの答えが入ります。ライセンスは[データの出どころ](data-sources.md)にあります。

項目は、持っている読みの数だけ行になります。意味には、語義の標準的な訳語が先に来て、直訳、説明、かっこ書きの注はその後ろに回ります。JMdictが不規則または古いとしている読みも、ゲームがどんなかなを入力として受け取っても意味を返せるように残してありますが、規則的な読みのあとに並び、よく使う語とはされません。
