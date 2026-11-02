---
title: "構成"
section: explanation
order: 7
description: "ソースの構成とその理由。"
---

## 構成

メインのエントリは型と関数だけで、データを持ちません。表はそれぞれ独立したエントリポイントなので、ページはインポートしたものの分だけを読み込みます。`src/data/`は機械出力で、`scripts/build-data.mjs`が書き出します。

```text
src/
├── index.ts   型と、表を読む関数
├── version.ts パッケージのバージョン
└── data/      表（それぞれ独立したエントリポイント）
    ├── grades.data.ts      学年
    ├── jlpt.data.ts        JLPTレベル
    ├── kanji.data.ts       読み、意味、画数、順位
    └── look-alike.data.ts  形の似た漢字の組
```
