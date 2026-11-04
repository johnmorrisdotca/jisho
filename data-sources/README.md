# Where the data comes from

`pnpm data` (`scripts/build-data.mjs`) writes `src/data/` from these and from KANJIDIC2, which it fetches, and `pnpm words` (`scripts/build-words.mjs`) writes `src/data/words/` from JMdict, which it fetches and whose address, date and SHA-256 it records in `sources.json`. Nothing is typed by hand. See [NOTICE.md](../NOTICE.md) for the terms, and [sources.json](sources.json) for each file's address, date and SHA-256.

- `jlpt/n1.txt` … `n5.txt`: the kanji of Jonathan Waller's five lists, in the order of his pages, read from the saved pages by `scripts/extract-jlpt.mjs`. CC BY.
- `look-alike/`: Lars Yencken's two distance files, as served. CC BY 3.0.
- `src/data/examples/` (`pnpm examples`, `scripts/build-examples.mjs`): the sentences of JMdict_e_examp, which the EDRDG links to the senses of JMdict, with the authors from the Tatoeba project's exports of Japanese and English sentences and their links. CC BY-SA 4.0 for the links, CC BY 2.0 FR for the sentences. Each file's address, date and SHA-256 are in `sources.json`.
- `src/data/strokes/` (`node scripts/build-strokes.mjs`): the stroke paths of KanjiVG's main release, for the kanji of the table. CC BY-SA 3.0. The release's address and SHA-256 are in `sources.json`.
