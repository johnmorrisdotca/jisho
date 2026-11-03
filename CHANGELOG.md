# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.1.0] - 2026-11-03

A minor version: nothing that 2.0.0 gave is taken away.

### Added

- `findByMeaning("water")`: the commonest words whose English meaning holds the whole word or phrase, from an index of English terms in pieces of its own that only this lookup fetches. It takes `mode`, `block`, `allow` and `limit`. `searchMeanings(words, text)` is the same search over words already loaded, such as the common table, and fetches nothing.
- `wordsWithKanji("山")` and `kanjiOfWord(word, table)`: the commonest words written with a kanji, and the entries of the kanji table (grade, JLPT level, readings, meanings) for the kanji in a word, so that a word can show its kanji.
- Romaji: `loadWords`, `wordsOf`, `meaningOf` and `isLoaded` take `romaji: true` and read Latin letters as modified Hepburn or Kunrei (`kami`, `gakkō`, `kon'nichi`, `Tōkyō`). A long vowel can read more than one way, so every way is looked up (`kōhī` finds コーヒー). `romajiToKana` and `kanaFromRomaji` are the conversion alone, with no dependency.
- How common a word is: a `Word` has `priority`, the tags JMdict gives it (`news1`, `ichi1`, `spec2`, `gai1`, `nf05`…), and `rank`, one number made from them, lower being commoner. `commonestFirst`, `priorityTags` and `rankOfTags` work on them.
- `normalizeText`: a text made plain for a lookup, and used by every lookup.
- `WordsLoadError`: what a lookup rejects with when a piece of the dictionary cannot be fetched, naming the piece (`kind`, `index`, `piece`) and keeping the reason in `cause`.
- A guide section for each, in English and Japanese, a recipe for looking up 食べました as 食べる with [Hikidashi](https://github.com/johnmorrisdotca/hikidashi)'s `dictionaryForms` (a development dependency, run by the README's check), and a demo that finds words by reading, English meaning or kanji, leads from a word to its kanji and from a kanji to its words, and reads romaji.

### Changed

- A text is made plain before it is looked up: NFKC (full-width and half-width, composed and decomposed), whitespace collapsed and removed beside Japanese, zero-width and control characters removed, a dash between kana made the long vowel mark ー. A word JMdict writes in full-width characters (１人, ＣＤ) is found by either spelling and shown as JMdict writes it. A text that is empty, not a string or longer than 100 characters is nothing to load and has no words; none of them throws.
- A piece that fails to fetch is asked for once more, and then rejects with a `WordsLoadError`, where it rejected with whatever the bundler or the browser threw. A failure is not remembered. Lookups at the same moment for the same pieces share one fetch.
- `src/words.ts`, which was 652 lines, is split by what each part does: `words-load.ts`, `words-lookup.ts`, `words-common.ts`, `words-search.ts`, `words-pieces.ts`, `words-rows.ts`, `words-text.ts`, `words.types.ts` and `romaji.ts`. Every export is still at `@johnmorrisdotca/jisho/words`.
- The words are from JMdict of 2026-11-03. The rows carry the priority tags, and the package holds the indexes by meaning and by kanji: 173 and 50 pieces of about 15 kB gzipped, and 14 more for what safe mode leaves out. A kana guess fetches the same one piece of 25 kB gzipped as before; the package is 3.7 MB larger to download (10.2 to 13.9 MB), and the pieces' JavaScript 13 MB larger (34.9 to 48.0 MB unpacked).
- The monthly refresh workflows no longer fail on purpose when new data arrives. They push the `data/…` branch as before and open a pull request from it (or update the one already open), titled with the month and saying to land it with a patch version, and the run ends green. They use only the workflow's own token, with `pull-requests: write`; opening the pull request needs the repository setting "Allow GitHub Actions to create and approve pull requests", and where it is off the run says so in a warning with the address to open it by hand.

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
