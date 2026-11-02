---
title: "単語を引く"
section: how-to
order: 3
description: "読みや表記から単語を探し、子ども向けでない語義を除き、サーバーのバンドルにこの辞書を入れないようにします。"
---

## 単語を引く

`loadWords`は、渡した文字列についてJMdictが持つものだけを取得し、それ以外は取得しません。取得したあとは`wordsOf`が待たずに読みます。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/moji/words";
const words=await loadWords(["かみ","紙"]);
console.log(wordsOf(words,"かみ").slice(0,3).map((one)=>`${one.written} ${one.meaning}`));
console.log(wordsOf(words,"紙")[0]?.reading);
```

かなだけの文字列は読みとして扱い、ひらがなとカタカナは同じ単語を見つけます。`カミ`は`かみ`と同じ結果になります。そのほかの文字列は表記として扱います。一つの読みに複数の単語があるときは、よく使う順に、それぞれの表記を付けて返します。「かみ」なら、紙（paper）、神（god）、髪（hair）のあとに、あまり使われない語が続きます。

返ってくる各単語は`Word`です。`written`は表示に使う表記、`reading`は読み、`forms`はすべての表記、`meaning`は短い英語の意味、`kinds`は語の種類を表す文字（g 五段、i 一段、a い形容詞、s する動詞、k 来る）、`common`はJMdictがよく使う語としているかどうかです。

単語のない文字列に対しては、`wordsOf`は空のリストを、`meaningOf`は`null`を返します。代わりの答えを作ることはありません。

```ts
import {loadWords,meaningOf} from "@johnmorrisdotca/moji/words";
const words=await loadWords(["紙","ぬぬぬぬぬ"]);
console.log(meaningOf(words,"紙"));
console.log(meaningOf(words,"ぬぬぬぬぬ"));
```

`wordsOf`は、取得していない文字列に対しては、単語なしと答える代わりに例外を投げます。空の答えは辞書に単語がないという意味になってしまうからです。答えられるかどうかは`isLoaded(words, text)`で分かります。

## 取得済みのものに足す

ゲームが一度に調べるのは、入力された言葉一つです。すでに取得したものを`previous`として渡すと、それは保たれ、もう一度取得されることはありません。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/moji/words";
const first=await loadWords("かみ");
const second=await loadWords("いぬ",{previous:first});
console.log(wordsOf(second,"かみ").length>0,wordsOf(second,"いぬ").length>0);
```

## 子どもが使う場合

初期値では、子ども向けでないものは取得されず、返ってくる結果にも入りません。JMdictが下品、性的、配慮が必要、侮辱的と記している語義、そのような語義だけが当てはまる表記や読み、すべての語義に印が付いている単語は、検索が取得するファイルの中にありません。残る語義が一つもない単語は見つからず、`wordsOf`は空のリストを、`meaningOf`は`null`を返します。JMdictにない単語と同じです。年齢を問わず誰にでも単語を見せるサイトは、何もしなくても、より厳格な結果になります。

```ts
import {loadWords,wordsOf} from "@johnmorrisdotca/moji/words";
const words=await loadWords("ほもびでお");
console.log(wordsOf(words,"ほもびでお"));
const everything=await loadWords("ほもびでお",{forChildren:false});
console.log(wordsOf(everything,"ほもびでお").map((one)=>one.meaning));
```

JMdictの内容をそのまま知りたい大人の学習者には、`loadWords`に`{ forChildren: false }`を渡します。すると、除かれたものすべてを収めたファイル`extra.data`（gzipで約90 kB）が一度だけ追加で取得され、返ってくる単語は、何も除かなかった場合と同じ、JMdictにあるそのままのものになります。子ども向けの単語とすべての単語は一緒に足せないので、`previous`は、新しい呼び出しと同じ対象向けに読み込んだものでなければなりません。

この区分は、[Kotoba](https://github.com/johnmorrisdotca/kotoba)が単語リストから誰にでも向くわけではないものを除くのに使うものと同じです。印はJMdict自身のもので、完全ではありません。印のない語義は、子ども向けのファイルに入っています。

除かれたものを収めた`extra.data`と`common-extra.data`は、ほかのデータと同じく、パッケージの中にあり、公開されています。検索が取得するものから外しているので、頼んでいないブラウザーには届きません。ただし、パッケージをインストールする人やファイルを要求する人から文章を隠すものではありません。

## どの表を使うか、大きさはどれくらいか

| やりたいこと | 使うもの | 取得するもの |
| --- | --- | --- |
| 入力された言葉の意味、目にした単語、少数の単語 | `loadWords` | 読みなら約25 kB（gzip）のチャンクが一つ。表記なら、索引の約30 kBのチャンクが一つと、行の約25 kBのチャンクが一つ |
| JMdictにあるすべてを知りたい | `loadWords(…, { forChildren: false })` | 同じものに加え、約90 kB（gzip）のファイルを一度だけ追加で取得 |
| 多数の単語（よく使う語だけ） | `loadCommonWords`、または`words-common`の`readCommonWords(COMMON_WORDS)` | 約640 kB（gzip）の表が一つ。そのあとの検索は待たずに答える |

辞書は、読みで分けた行のチャンク254個と、表記から読みへの索引を表記で分けたチャンク71個からなります。`words`には各チャンクの始まりが入っていて、検索は文字列とその始まりを比べてチャンクを見つけます。どのチャンクも約100 kB以下で、検索に必要になるまで取得されません。

よく使う語の表には、JMdictがよく使う語としているもののうち、子ども向けの26,039語が入っています（表記か読みに`news1`、`ichi1`、`spec1`、`spec2`、`gai1`のどれかが付いているもの）。この表はどんな文字列にも答えますが、答えるのはよく使う語だけです。まれな語と読みが同じでも、よく使う語しか見つかりません。どちらを持っているかは、`Words`の`scope`で分かります。すべてを知りたいときは、`loadCommonWords({ forChildren: false })`が`common-extra.data`（gzipで約10 kB）も取得します。これは、何を加えて何を変えるかを示すもので、`readCommonWords`を使う場合は、自分で`extra`として渡します。

## ブラウザーで

`import("@johnmorrisdotca/moji/words")`が読み込むのは、チャンクを見つける小さな部分だけです。チャンクはそれぞれ独立したモジュールなので、コード分割のできるバンドラー（Vite、webpack、Rollup、`splitting`を付けたesbuild）はチャンクごとにファイルを作り、ブラウザーは検索で必要になったものだけを取得します。単語はページを開くときではなく、必要になったときに取得します。

```ts no-run
const { loadWords, wordsOf } = await import("@johnmorrisdotca/moji/words");
```

## サーバーで

`words`は、検索を行う場所でだけインポートしてください。`loadWords`をたどるバンドラーはすべてのチャンク（約30 MB）に行き着くので、ページやルートの先頭でインポートするサーバーは、そのすべてを抱えることになります。バンドルから外すには次のようにします。

- パッケージを外部扱いにし、サーバーが実行時に`node_modules`から読むようにします。Next.jsなら`serverExternalPackages: ["@johnmorrisdotca/moji"]`、esbuildやwebpackなら`external`です。
- 検索は、それを必要とする一つのルートかアクションの中で行い、すべての訪問が通るページの描画経路では行いません。
- ビルドがたどれるファイルだけをホストにコピーする環境では、`node_modules/@johnmorrisdotca/moji/dist/data/words`がその中に入るようにするか、単語の検索をブラウザーで行います。

サーバーは読み込んだチャンクをメモリに保つので、同じチャンクの二度目の検索にコストはかかりません。

## 単語の作り方

`pnpm words`（`scripts/build-words.mjs`）がJMdict_eから`src/data/words/`を書き出し、EDRDGの求めに従って、毎月1日にワークフローがこれを実行します。一つの行は、一つの項目の一つの読みにあたり、それに付く表記、最大二つの語義から成る意味（訳語の区切りで約60文字以内に収めたもの）、フラグが入ります。チャンクには子ども向けの行が入り、`extra.data`には、子ども向けの行と答えが異なる読みや表記のすべてについて、JMdictにあるそのままの答えが入ります。ライセンスは[データの出どころ](data-sources.md)にあります。

項目は、持っている読みの数だけ行になります。意味には、語義の標準的な訳語が先に来て、直訳、説明、かっこ書きの注はその後ろに回ります。JMdictが不規則または古いとしている読みも、ゲームがどんなかなを入力として受け取っても意味を返せるように残してありますが、規則的な読みのあとに並び、よく使う語とはされません。
