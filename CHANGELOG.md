# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.4.0] - 2026-11-03

A minor version: nothing that 2.3.0 gave is taken away.

### Added

- **Read a text.** `readText(text, { mode, block, allow })` cuts Japanese into words. From each place it takes the longest stretch the dictionary has a word for, as it stands or as a conjugated form (食べなかった is 食べる), and weighs the few longest against the word that follows each, so that 今日はいい天気 is 今日, は and いい天気. Each `ReadToken` has the text as written, its `kind` (`word`, `unknown`, or `other` for spaces, punctuation, Latin letters and digits), the dictionary `word`, its `form` and the `path` to the text, its `furigana` (the text in pieces, each kanji piece with the kana that read it), its `reading` in hiragana, its `meaning`, the hardest JLPT `level` among its kanji (Jisho has levels for kanji and none for words), each kanji's school grade and level, and the other words the text could be (`alternatives`). Japanese that no word fits is `unknown` and is listed in `result.unknown`. A text is read up to `MAX_READ_LENGTH` (5,000) characters, and `truncated` says when it was cut. It fetches only Jisho's own pieces, as the text needs them: a first sentence of fifteen characters took about 30, and later text reuses them.
- Three rules keep the dictionary's rare words from taking over: a stretch counts when its word is common, or it has a kanji, or it is four characters or longer; a single katakana is never a word; and a text of kana alone is read as the word usually written in kana (は is the particle, not 葉 or 歯). A word of kanji that ends in は and begins with a word is the pair (今日は is 今日 and は).
- `studyList(result, { kanjiOnly })` and `studyListText(rows, "csv" | "tsv")`: the words of a text once each, in order, with reading, meaning, level, the highest school grade among the kanji, how often the text has the word and the form it first came in, as rows and as CSV (a header, quoting what needs it) or TSV (tabs, no header, to paste or import).
- `furiganaOf(written, reading)` and `furiganaOfSurface(surface, base, reading)`: which kana read which kanji of a word, and of a conjugated form of it (食べなかった is 食 (た) and べなかった; 来 takes the reading its ending asks for).
- An `InflectedWord` has `form`, the dictionary form as it was looked up.
- The demo has a Reader tab: paste a text and tap Read, see it as words with furigana above them, tap a word for its card (dictionary form and path, level, each kanji's grade, other readings), the words not found, and the study list with Copy, Download CSV and a switch to leave out the words with no kanji. The text is kept in the address. A picture of it in the README, a guide in English and Japanese, a troubleshooting entry and an upgrade note.

### Limits

It has no grammar: it takes the longest word, so a rare long word can win, a name (ジョンモリス) is not found or is cut into small words, and a word with several readings gets the commonest one JMdict ranks, which for a single kanji can be the wrong one (本 is もと before ほん; `alternatives` has the others). In safe mode a word the mode leaves out is not found, so its text is listed as unknown.

## [2.3.0] - 2026-11-03

A minor version: nothing that 2.2.0 gave is taken away.

### Added

- **Conjugated words.** `findInflected("食べなかった")` finds 食べる and says how the text comes from it, as a path from the dictionary form, innermost first (`["negative", "past"]`). `loadWords(texts, { inflected: true })` also loads the dictionary forms each text could be conjugated from, and `inflectedOf(words, text)` reads them with no waiting (and works on the table of common words with nothing more loaded). A text that is a word as it stands comes first, with an empty path; a word is given once, by the shortest path. Reading a text that was loaded without `inflected: true` throws a `RangeError`, rather than answer as if the dictionary had no word.
- `deinflect(text)`, also at its own entry point, `@johnmorrisdotca/jisho/deinflect` (7.1 kB minified, 2.1 kB gzipped, no data and no fetch): the rule table that proposes the dictionary forms. It covers godan and ichidan verbs, する (and a noun with する: 勉強した is 勉強), 来る in kanji and kana, い adjectives and な adjectives with だ, です and ではない; the polite, negative, past, te, conditional (ば and たら), volitional, tari, potential, passive, causative and causative-passive forms; want-to, looks-like, too-much, easy-to, hard-to, while and the polite command; the helper verbs a te-form leads (ている, てしまう, ちゃう, ておく, とく, てみる, ていく, てくる, てくれる, てあげる, てもらう, てください); and chains of all of them (食べさせられたくなかった). It proposes from endings alone, so the dictionary decides which proposals are real, by the kind of word each must be.
- A golden set of 395 conjugated forms (`src/deinflect-golden.test.ts`), written out from the conjugation rules as charts of a verb or adjective to a row, each with its dictionary form, kind and path, and each carrying the note that a native reader should check it: none has been read by one yet. Every form is proposed by the rules and found in the real dictionary with its path.
- The demo shows the path under a word found from a conjugated text ("from 食べる: negative, past", and in Japanese 「食べるから：否定、過去」), a picture of it in the README, a guide in English and Japanese, a troubleshooting entry and an upgrade note.

### Changed

- A `Word`'s `kinds` can hold `n`, for a な adjective (静か, 好き, 元気), which JMdict marks `adj-na` and which `kinds` left out; the dictionary check needs it. A word that had no letters because it was only a な adjective now has `n`. The words are cut into pieces at a few slightly different places because their rows grew by a letter; they are from the same JMdict of 2026-11-03.
- The README's Limits no longer send a reader to Hikidashi for a conjugated word, and the Hikidashi recipe is gone from the README and the guide. Hikidashi is no longer a development dependency.

### Not covered

The imperative, honorific (keigo) forms, 〜ず, 〜なければならない as a whole, the stem on its own (食べ), and a noun with だ: JMdict marks the な adjectives and not the nouns, so only な adjectives are read. 愛する and its kin, which conjugate their own way (愛さない), are found as the godan 愛す.

## [2.2.0] - 2026-11-03

A minor version: the one change of behaviour is that a mistake which used to be quietly accepted now throws, and each of those is a call that had a typo or a wrong type in it.

### Fixed

- **A `mode` other than `"safe"` or `"unfiltered"` no longer takes the filter off.** `loadWords("あげちん", { mode: "Safe" })` returned the unfiltered words, and so did `"SAFE"`, `""`, `"unsafe"` and `"bogus"`, in `loadWords`, `loadCommonWords` and `readCommonWords`, while `findByMeaning` and `wordsWithKanji` read it the other way round. One check (`modeOf`) now runs at the top of every entry point and throws a `TypeError` for anything else; no mode at all is still safe.
- `findByMeaning` finds the obvious word. The index kept the commonest twenty words that held a term, so `drink` never gave 飲む, `walk` gave 歩く eighth and `eat` gave 食べる fourth. It now keeps up to ten words with an exact gloss first (a word whose first gloss it is before one that has it later, aside text such as "(esp. cool or cold)" left out), then the commonest that merely hold the term, and `searchMeanings` ranks the same way. A test holds 36 common English words to the word each must give in its top three. The meaning index is 172 pieces (it was 173) and the one for what safe mode leaves out 9 (it was 10).
- `gradeOf` and `levelOf` take exactly one character. `gradeOf(GRADES, "")` was 1, `levelOf(JLPT, "")` was `"N5"` and `gradeOf(GRADES, "一右")` was 1, because the lookup was a substring search; anything else than one kanji is now `null`.
- A caller can no longer change what the next caller sees: `word.senses[0].glosses.push("X")` showed up in every later lookup of that word. A row and every list in it, and the lists in a `Words`, are frozen, and a change throws a `TypeError`. `withoutMarks`, `withoutWords`, `onlyWords` and `commonestFirst` still return new arrays.
- `block` or `allow` given as a text (`block: "神"`) threw "list.map is not a function" from deep inside a lookup. They, and the lists the tools take, are checked first and throw a `TypeError` that names the option.

### Changed

- The pieces a process has read are kept up to 64 at a time (`cacheLimit` in `words-pieces.ts`), the one asked for longest ago let go. Looking up every piece once took a process from 49 MB to 266 MB. Words you have loaded are yours and stay.
- The documentation says what a lookup costs: a kana guess is one piece of about 25 kB gzipped, a written form two in a row (about 57 kB), `findByMeaning("water")` about 8 files and 180 kB in three steps, `wordsWithKanji("山")` 9 files and 210 kB; a piece of rows is about 74 kB and a piece of the written-form index about 120 kB. It no longer says "a few kilobytes" or "at most about 100 kB". The main entry is 0.9 kB gzipped (it was 0.8).
- `NOTICE.md` says that `package.json`'s `CC-BY-4.0` for Waller's JLPT lists is there because SPDX has no versionless "BY": his page names no version.
- The README opens with the package's thumbnail, and the demo carries it as its link preview (og:image) and publishes the card, a dark card and an icon on Pages at `thumbnail.png`, `thumbnail-dark.png` and `icon.png`.

### Added

- `pnpm test:coverage` (`@vitest/coverage-v8`, a development dependency) fails below today's level: statements 99, branches 92, functions 98, lines 99 (measured 99.25, 92.11, 98.74 and 99.76). `pnpm check` runs it.
- `AGENTS.md` names the demo's local port block, 8500 to 8599. The demo's Playwright tests draw in software and run one worker.
- Tests for each of the above: every wrong spelling of `mode`, the golden set of English words, the frozen rows, the cache limit and the list options.

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
