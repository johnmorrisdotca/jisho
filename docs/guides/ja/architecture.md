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
├── words.ts   単語を引く（必要なチャンクを取得）
├── words-filter.ts  引いた結果を絞る小さな道具
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
    └── words/              単語（スクリプトが書き出す）
        ├── common.data.ts    セーフモードで残るよく使う単語を一つの表に
        ├── common-extra.data.ts  よく使う単語をすべてそろえるために加えるもの
        ├── manifest.data.ts  各チャンクの始まりと取得の方法
        ├── extra-manifest.data.ts  セーフモードが除くものを収めたチャンクについての同じもの
        ├── r000.data.ts …    読みで分けた行のチャンク
        ├── f00.data.ts …     表記から読みへの索引のチャンク
        ├── xr0.data.ts …     セーフモードが除くものを読みで分けたチャンク（フィルターなしのときだけ取得）
        └── xf0.data.ts …     表記の索引についての同じもの
```
