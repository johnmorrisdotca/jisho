---
title: "データの出どころ"
section: explanation
order: 4
description: "三つの出典、その条件、示すべきこと。"
---

## 三つの出典と、それぞれの条件

| エントリポイント | 元のデータ | 条件 |
| --- | --- | --- |
| `grades` | Electronic Dictionary Research and Development GroupのKANJIDIC2 | CC BY-SA 4.0と同グループの条件 |
| `jlpt` | Jonathan WallerのJLPT Resources（tanos.co.uk） | CC BY |
| `kanji` | KANJIDIC2とWallerのレベル | CC BY-SA 4.0と同グループの条件。レベルはCC BY |
| `look-alike` | Lars Yenckenのkanji confusionデータ | CC BY 3.0 |

全文は[NOTICE.md](../../../NOTICE.md)（英語）に、各ファイルのアドレス、日付、SHA-256は[sources.json](../../../data-sources/sources.json)にあります。

## 必要な対応

データを表示するページは、出典を示します。KANJIDIC2のデータを表示するページでは、その画面に示す必要があります。`grades`や`kanji`を配布するプロジェクトは、その表については継承（シェアアライク）の条件も引き継ぎます。インポートするだけのコードは影響を受けません。文例はNOTICE.mdにあります。

## JLPTレベルは一個人のリストです

試験は、今の五段階になった2010年以降、漢字のリストを公開していません。よく使われているのはWallerのリストですが、これは推定です。ここでのレベルは、どのリストにその字があるかを示すもので、試験に何が出るかを示すものではありません。

## 学年の番号

KANJIDIC2では、1から6が小学校、8がそのほかの常用漢字、9が人名に使える漢字、10が常用漢字の人名用異体字です。10には、よく使う字と同じに見えてもコードポイントが違う互換漢字があります。U+FA45は海（U+6D77）と同じに見えます。NFCで正規化した文章には、よく使うほうの字が入っています。
