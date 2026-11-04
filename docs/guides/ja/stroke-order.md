---
title: "筆順と、描いて漢字を探す"
section: how-to
order: 3
description: "漢字の筆順を、1画ずつ書かれていくSVGで描き、描いた画から漢字を探します。"
---

`@johnmorrisdotca/jisho/strokes`には、KanjiVG由来の2,967字の漢字の筆順が入っています。各漢字の画を書く順に並べ、KanjiVGが各画を描くSVGパスのままです。それを1画ずつ書かれていくSVGにしたり、パッドに描いた画から漢字を探したりできます。

## 筆順を取得して描く

```ts
import { loadStrokes, strokeOrderSvg, strokesOf } from "@johnmorrisdotca/jisho/strokes";

const table = await loadStrokes("日");
const strokes = strokesOf(table, "日");
console.log(strokes.length); // 4
const svg = strokeOrderSvg(strokes, { size: 160, numbers: true });
console.log(svg.startsWith("<svg"));
```

`loadStrokes`は、文に含まれる漢字が入っているチャンク（それぞれgzipで約20 kB）を取得します。`strokesOf`は、その結果から1字のパスを取り出し、1画につき1つのパスを、書く順に、109×109の正方形の中で返します。`strokeOrderSvg`は、ページの要素に入れたりサーバーから送ったりできるSVGの文字列を返します。`animate`（`false`にしない限りオン）のときは、SVGの中のCSSで1画ずつ順に書かれます。スクリプトは要らず、動きを減らす設定の端末では、すべての画が一度に出ます。`numbers: true`は、各画の始まりに番号を書きます。`size`、`color`、`label`、`strokeMs`（1画にかかる時間。初期値は500ミリ秒）で、そのほかを決めます。

描いたものを表示するページは、KanjiVGの出典を示す必要があります。例：*Stroke order from KanjiVG (Ulrich Apel and contributors, CC BY-SA 3.0, http://kanjivg.tagaini.net).* データはCC BY-SA 3.0で、そのライセンスのままです。詳しくは[データの出どころ](data-sources.md)にあります。

## 描いて漢字を探す

```ts
import { findByDrawing, loadAllStrokes } from "@johnmorrisdotca/jisho/strokes";

const table = await loadAllStrokes();
const drawn = [
  [[10, 50], [90, 50]],
  [[50, 10], [50, 90]],
] as const;
console.log(findByDrawing(table, drawn, { limit: 3 }).map((match) => match.kanji)); // ["十", ...]
```

`findByDrawing`は、描いたとおりの画を受け取ります。各画は、`[x, y]`の点のリスト（単位は何でも構いません。キャンバスのピクセルなど）で、描いた順に並べます（たとえば`pointermove`のイベントから作ります）。近い漢字から順に、`distance`（0はすべての画が同じ、丁寧に書いて0.1くらい）といっしょに返します。描いた大きさや位置は関係ありません。画は描いた順に1画ずつ比べるので、**正しい画を、書く順に**描く必要があります。画数は1つ多くても少なくても許されますが、そのぶん離れます（10画以上なら2つまで）。手書き文字認識ではありません。ふつうと違う筆順や、続け書きでは見つかりません。KanjiVG自身の画を、ランダムな大きさと位置で、ノイズを加えて描いたときは、100字中98字で正解が1位、すべての字で上位5位に入ります。

`loadAllStrokes`は、57個のチャンクすべて（gzipで約1.1 MB）を取得します。デモでは、初めて描くときに取得していて、そこにある描く欄が参考になります。KanjiVGにファイルがない、表の漢字（旧字形32字）は見つかりません。

## 費用

筆順は、gzipで約20 kBのチャンク57個で、パッケージのダウンロードを2.2 MB増やします。エントリポイントのコードはgzipで約4 kBで、`loadStrokes`か`loadAllStrokes`を呼ぶまで何も取得しません。
