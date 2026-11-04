---
title: "単語の完全な項目"
section: how-to
order: 3
description: "単語のすべての語義を、品詞、分野、方言、参照、対義語、注、外来語のもとの言語、表記と読みの印といっしょに取得します。"
---

`loadWords`が返す単語は短い行で、語義は4つまで、語義ごとの訳は3つまでです。`loadEntry`は、JMdictの完全な項目を取得します。専用のエントリポイント`@johnmorrisdotca/jisho/entries`にあるので、単語を引くだけのページには入りません。

## 項目を取得する

```ts
import { loadEntry } from "@johnmorrisdotca/jisho/entries";
import { loadWords, wordsOf } from "@johnmorrisdotca/jisho/words";

const words = await loadWords("かみ");
const word = wordsOf(words, "かみ")[0];
const entry = word === undefined ? null : await loadEntry(word);
for (const sense of entry?.senses ?? []) console.log(sense.pos.join(","), sense.glosses.map((gloss) => gloss.text).join("; "));
```

`Word`には`id`があり、JMdictがその項目に付けた番号です。`loadEntry`は単語か番号を受け取ります。項目1つにつき、gzipで約40 kBのチャンクを1つ取得し、同じチャンクの次の項目のために覚えておきます。その番号の項目がJMdictになければ`null`です。項目の中のオブジェクトはすべて凍結されています。

## 項目に入っているもの

| フィールド | 内容 |
| --- | --- |
| `id` | JMdictが項目に付けた番号。 |
| `forms` | 表記。それぞれに印（`ateji`、`rK`、`iK`など）が付きます。 |
| `readings` | 読み。それぞれに印、合わせて使う表記（`onlyForms`）、`noKanji`が付きます。 |
| `senses[].number` | JMdictが語義に付けた番号（1から数えます）。参照が指す番号で、セーフモードがその前の語義を除いても変わりません。 |
| `senses[].pos` | 品詞。JMdictのコード（`n`、`v5r`、`vt`、`adj-i`など）。 |
| `senses[].marks` | 用法、分野、方言のコード。行の語義にある印と同じものです。 |
| `senses[].glosses` | すべての訳。JMdictが種類を記していれば`kind`（`lit`、`expl`、`fig`、`tm`）が付きます。 |
| `senses[].onlyForms`、`onlyReadings` | その語義が限られる表記や読み。 |
| `senses[].seeAlso`、`antonyms` | 参照。JMdictの書き方のままです。 |
| `senses[].notes` | 語義についての注（「usu. in the negative」など）。 |
| `senses[].sources` | 外来語のもとの言語。単語、一部だけか、日本で作られた語（`wasei`）かも分かります。 |

## 参照

JMdictは参照を、語、読み、語義の番号の順に「・」で区切って書きます。どれも省けます。`referenceOf`が分けて読みます。

```ts
import { referenceOf } from "@johnmorrisdotca/jisho/entries";

console.log(referenceOf("天神・6")); // { written: "天神", reading: undefined, sense: 6 }
console.log(referenceOf("神・かみ・1").reading); // かみ
```

参照をたどるには、`written`を`loadWords`で引きます。

## 初期値は安全

`loadEntry(word)`はセーフモードです。JMdictが下品、性的、配慮が必要、侮辱的と記した語義は項目に入らず、そうした語義だけに当てはまる表記と読みも入りません。すべての語義にその印がある項目は、まったく含まれません。それらを含むファイルは取得されません。`loadEntry(word, { mode: "unfiltered" })`は、もう1つチャンクを取得して、項目をそのまま返します。単語を見つけたときと同じモードを使ってください。JMdictの印はJMdict自身のもので、完全ではありません。印のない語義はセーフモードの項目に入りますし、完全な項目には、単語の短い行が省く語義も出ます（猫には、スラングの印だけが付いた語義があり、子ども向けのページには向きません）。JMdictの印以上のものが必要なページは、表示する語義を自分で確認するか、項目を使わないでください。

```ts
import { loadEntry } from "@johnmorrisdotca/jisho/entries";

const safe = await loadEntry(1_094_860);
const whole = await loadEntry(1_094_860, { mode: "unfiltered" });
console.log(safe?.senses.length, whole?.senses.length);
```

## 費用

項目は、gzipで約40 kBのチャンク220個と、セーフモードが除く項目のチャンク3個（フィルターなしのときだけ取得）です。合わせて、パッケージのダウンロードは9.7 MB増えます（13.8 MBから23.6 MB。[例文](example-sentences.md)も入れると26.4 MB）。`words`をインポートして`entries`をインポートしないページは、取得もバンドルも増えません。ただし、どの行にも項目の番号が付くようになったため、行のチャンクが24個増えました（294個から318個。大きさは同じ）。gzipで合計約1 MBの増加です。

## ここにないもの：ほかの言語

JMdictには、ドイツ語、フランス語、ロシア語、スペイン語、オランダ語、ハンガリー語、スウェーデン語、スロベニア語の訳もあります。このパッケージには入っていません。EDRDGのライセンスは、JMdictのうち日本語と英語の部分だけをCC BY-SA 4.0としていて、その条文の2に、他の言語の訳は「その編纂者が持つ別の著作権の対象」とあります。Jishoは、条件を確かめられないファイルを使いません。
