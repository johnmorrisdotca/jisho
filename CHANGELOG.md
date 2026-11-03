# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2026-11-03

### Changed

- **Breaking:** `forChildren` is replaced by `mode`: `"safe"` (the default, which is what `forChildren: true` was) or `"unfiltered"` (which `forChildren: false` was). `Words` has `mode`, `block` and `allow` where it had `forChildren`; `readCommonWords` and `loadCommonWords` take the same options. The names are not the same, so this is a new major version.
- Every sense of a `Word` carries the marks JMdict gives it, in `senses`: usage (`col`, `sl`, `arch`, `obs`, `uk`, `vulg`…), field (`food`, `med`…) and dialect (`ksb`…). A row keeps its first four senses, and the `meaning` is made from the senses a word has when it is read. Unfiltered answers, and safe answers, are the same as 1.0.0's wherever a word has no more than four senses to leave out or keep, which a test holds to the dictionary.
- What safe mode leaves out is in pieces of its own (`xr*`, `xf*`, a manifest, and `words-common-extra`), cut small, so that an unfiltered lookup fetches one extra piece of about 19 kB gzipped for a reading, where 1.0.0 fetched one file of 92 kB. The common table is larger (about 770 kB gzipped) because every sense has its marks.

### Added

- `block` and `allow`, the consumer's own lists, by written form or reading in either kana, on top of either mode. Applied only when passed.
- `hasMarks`, `withoutMarks`, `withoutWords` and `onlyWords`: small pure tools on what a lookup returned, which apply nothing on their own, and `meaningFrom`, which makes a meaning from senses. `SAFE_MARKS` lists the four marks safe mode leaves out. Jisho keeps no list of words of its own.
- A guide section on modes, lists and marks in English and Japanese, and a Mode row in the demo (Safe and Unfiltered) that shows each word's marks.

## [1.0.0] - 2026-11-02

This package was published as `@johnmorrisdotca/moji` 0.1.x until now. Its entries are kept below as history.

### Added

- Words (`/words`): `loadWords`, `wordsOf` and `meaningOf` look up the words of JMdict by reading (かみ: 紙 paper, 神 god, 髪 hair) or by written form (紙), each with a short English meaning, commonest first. The rows are cut into 254 pieces by reading and 71 of an index of written forms, and a lookup fetches only the pieces it needs, about 25 kB gzipped each. `loadWords` adds to words already loaded with `previous`, and `wordsOf` says when a text was not loaded instead of answering with no words.
- The common words (`/words-common`, `loadCommonWords`, `readCommonWords`): 26,039 rows in one table for a page that looks many words up.
- For children by default, and in the files: a sense JMdict marks vulgar, X-rated, sensitive or derogatory, a written form or reading that only such a sense applies to, and a word with nothing else to say, are not in any file a default lookup fetches, nor in `words-common`. They are in `extra.data` and `common-extra.data` (`/words-common-extra`), which are fetched only with `forChildren: false`; then every answer is what JMdict has. A word with no meaning is `null` and never a placeholder.
- `scripts/build-words.mjs` (`pnpm words`) writes the words from JMdict, and `.github/workflows/jmdict-refresh.yml` does it again on the 1st of every month and leaves a change on a branch, as the EDRDG asks of a package that uses its files. The release, source and licence are in `NOTICE.md`, `data-sources/sources.json` and the head of every data file.
- The demo can look a word up (a reading, a written form, or an example), for children or for everything, in English and Japanese.
- A guide, "Look words up", in English and Japanese, including how a server keeps the dictionary out of its bundle.

### Changed

- The package is Jisho 辞書, a dictionary of Japanese words and kanji: its name, address (`github.com/johnmorrisdotca/jisho`), demo (`johnmorrisdotca.github.io/jisho/`), description, README and guides say so.

## [0.1.1] - 2026-11-02

### Changed

- The README's JLPT N3 picture ends after ten whole rows instead of cutting a row through, and its text says it shows the first ten rows of the 367 kanji (the grid scrolls in the demo).

## [0.1.0] - 2026-11-02

### Added

- School grades for 2,999 kanji (`/grades`), from KANJIDIC2.
- JLPT levels for 2,211 kanji (`/jlpt`), from Jonathan Waller's lists.
- Readings, English and French meanings, strokes and newspaper ranks for the same 2,999 (`/kanji`).
- 7,211 pairs of kanji that look alike (`/look-alike`), with two scores each, from Lars Yencken's kanji confusion datasets.
- `gradeOf`, `kanjiOfGrade`, `levelOf`, `kanjiOfLevel`, `readKanji`, `searchKanji`, `kanjiIn` and `lookAlikes`, and a demo.
