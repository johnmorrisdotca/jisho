---
title: "例文"
section: how-to
order: 3
description: "単語を示す例文を、示す語義に結び付けて取得します。ふりがな、英語、JLPTレベル、必要な出典つきです。"
---

`loadExamples`は、単語の例文を返します。例文はそれぞれ、示す語義に結び付き、ふりがな、英語、漢字のJLPTレベル、書いた人の名前が付いています。専用のエントリポイント`@johnmorrisdotca/jisho/examples`にあるので、単語を引くだけのページには入りません。

## 単語の例文を取得する

```ts
import { exampleCredit, loadExamples } from "@johnmorrisdotca/jisho/examples";
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const word = wordsOf(await loadWords("犬"), "犬")[0];
for (const one of word === undefined ? [] : await loadExamples(word)) {
  console.log(one.japanese, one.english, one.level);
  console.log(exampleCredit(one));
}
```

`loadExamples`は、検索で得た単語か、その項目の番号を受け取り、例文のない単語には空のリストを返します。単語1つにつき、gzipで約20 kBのチャンクを1つ取得し、同じチャンクの次の単語のために覚えておきます。`{ sense: 2 }`を付けると、1つの語義（`Entry.senses[].number`の番号）の例文だけになります。答えは凍結されています。

## 例文に入っているもの

| フィールド | 内容 |
| --- | --- |
| `sense` | 示している語義の番号。`loadEntry`の番号と同じです。 |
| `japanese` | Tatoebaにある文そのまま。 |
| `furigana` | 文を部分に分け、漢字の部分に読みを付けたもの。つなげると`japanese`になります。分からないときは1つの部分です。 |
| `english` | 英訳。 |
| `level` | 含まれる漢字のうち最も難しいJLPTレベル（漢字がなければ`N5`）。どのリストにもない漢字があれば`null`。 |
| `headword` | 文の中での単語の形。活用していることもあります。 |
| `credit` | 文のTatoebaの番号と、日本語と英語を書いた人の名前（Tatoebaが示している場合）。 |

全角の数字や英字のある文には、ふりがながありません。読むために文字を整えるので、表示する文とふりがなが合わなくなるためです。

## 一つ一つの文に出典を付ける

文はTatoebaのもので、CC BY 2.0 FRです。文を表示するページは、書いた人を示す必要があります。`exampleCredit(example)`がその行を作ります。例：`Tatoeba #162365, Japanese by alice, English by bob (CC BY 2.0 FR)`。田中コーパスから引き継いだ文には名前を出せるユーザーがなく、それでもTatoebaの文なので、その行には文の番号だけが入ります。できれば、番号を`https://tatoeba.org/sentences/show/<番号>`にリンクしてください。

## 初期値は安全

`loadExamples(word)`はセーフモードです。JMdictが下品、性的、配慮が必要、侮辱的と記した語義の例文、同じファイルが別の単語のそうした語義にも結び付けている文、そしてセーフモードでは、フィルターなしのときと同じ単語が見つからない文を除きます。それらを含むファイルは取得されません。`loadExamples(word, { mode: "unfiltered" })`は、もう1つチャンクを取得して、すべての例文を返します。Jishoは独自の単語リストを持たないので、JMdictが印を付けていない語だけで、英語だけが不適切な文は、初期の例文に入ります。子ども向けのページでは、表示するものを確認してください。

## ふりがなとレベルの出どころ

語義から文への結び付きは、EDRDG（JMdict_e_examp）のものです。ふりがなはこのパッケージの`readText`で、レベルは漢字のJLPTリストから作ります。`readText`と同じ限界があり（最長の語を取り、最良の読みを取るわけではありません）、日本語を母語とする人による確認はまだありません。

## 費用

例文は、gzipで約20 kBのチャンク145個で、28,813語分です。セーフモードが一覧を除く語のために、さらに1個あります。合わせて、パッケージのダウンロードは2.9 MB増えます。
