---
title: "構成"
section: explanation
order: 7
description: "ソースの構成とその理由。"
---

## 構成

メインのエントリは型と関数だけで、データを持ちません。表はそれぞれ独立したエントリポイントなので、ページはインポートしたものの分だけを読み込みます。`src/data/`は機械出力で、`scripts/build-data.mjs`が書き出し、`src/data/words/`は`scripts/build-words.mjs`が書き出します。単語だけは表がいくつものチャンクに分かれていて、`words.ts`が引くときに必要なチャンクを見つけて取得します。

```text
src/
├── index.ts   型と、漢字の表を読む関数
├── entries.ts 完全な項目のエントリポイント：loadEntry、readEntry、referenceOf。wordsには入れていないので、単語を引くだけのページは完全な項目を読み込まない
├── words.ts   単語を引く（必要なチャンクを取得）
├── words-manifests.ts チャンクの場所を書いた小さなファイル。データのファイルを名指しするのはここだけなので、entriesは単語のデータを持たない
├── words-filter.ts  引いた結果を絞る小さな道具
├── examples.ts 例文のエントリポイント：loadExamples、exampleCredit、furiganaOfExample。wordsには入れていないので、単語を引くだけのページは例文を読み込まない
├── words-examples.ts loadExamples：単語の例文を、示す語義に結び付けて、専用のチャンクから取得
├── strokes.ts  筆順のエントリポイント：loadStrokes、strokeOrderSvg（筆順を描く）、findByDrawing（描いた漢字から探す）
├── words-suggest.ts suggestWords：何も見つからなかった検索のために、入力から1文字違いのよく使う単語を返す
├── words-entry.ts  loadEntry：単語の完全な項目（すべての語義とJMdictが記すこと）を、専用のチャンクから取得
├── words-inflected.ts 活用した文字列を、もとの辞書形から見つける（findInflected、inflectedOf）
├── reader.ts     readText：テキストを最長一致で単語に分け、ふりがな、意味、レベルを付ける
├── furigana.ts   単語（と、その活用形）のどのかなが、どの漢字を読むか
├── study-list.ts 読んだテキストの単語を1つずつ並べた表（行、CSV、TSV）
├── deinflect.ts  語尾の規則の表：活用した語のもとになりうる辞書形と道すじ。データなし
├── version.ts パッケージのバージョン
└── data/      表（それぞれ独立したエントリポイント）
    ├── grades.data.ts      学年
    ├── jlpt.data.ts        JLPTレベル
    ├── kanji.data.ts       読み、意味、画数、順位
    ├── look-alike.data.ts  形の似た漢字の組
    ├── strokes/            漢字の筆順（スクリプトが書き出す）
    │   ├── stroke-manifest.data.ts  筆順のチャンクの始まりと取得の方法
    │   └── t00.data.ts …     漢字ごとの筆順のチャンク（KanjiVG由来）
    ├── examples/           例文（スクリプトが書き出す）
    │   ├── example-manifest.data.ts  例文のチャンクの始まりと取得の方法
    │   ├── example-extra-manifest.data.ts  セーフモードが除く一覧についての同じもの（フィルターなしのときだけ取得）
    │   ├── s000.data.ts …    例文のチャンク（JMdictの項目番号順）
    │   └── xs0.data.ts …     セーフモードが例文を除く項目の完全な一覧（フィルターなしのときだけ取得）
    └── words/              単語（スクリプトが書き出す）
        ├── common.data.ts    セーフモードで残るよく使う単語を一つの表に
        ├── common-extra.data.ts  よく使う単語をすべてそろえるために加えるもの
        ├── manifest.data.ts  各チャンクの始まりと取得の方法
        ├── extra-manifest.data.ts  セーフモードが除くものを収めたチャンクについての同じもの
        ├── entry-manifest.data.ts  完全な項目のチャンクの始まりと取得の方法
        ├── entry-extra-manifest.data.ts  セーフモードが除く完全な項目についての同じもの（フィルターなしのときだけ取得）
        ├── e000.data.ts …    完全な項目のチャンク（JMdictの番号順）
        ├── xe0.data.ts …     セーフモードが除く語義を持つ完全な項目のチャンク（フィルターなしのときだけ取得）
        ├── r000.data.ts …    読みで分けた行のチャンク
        ├── f00.data.ts …     表記から読みへの索引のチャンク
        ├── xr0.data.ts …     セーフモードが除くものを読みで分けたチャンク（フィルターなしのときだけ取得）
        └── xf0.data.ts …     表記の索引についての同じもの
```
