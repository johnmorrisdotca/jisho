# Where the data comes from

`pnpm data` (`scripts/build-data.mjs`) writes `src/data/` from these and from KANJIDIC2, which it fetches, and `pnpm words` (`scripts/build-words.mjs`) writes `src/data/words/` from JMdict, which it fetches and whose address, date and SHA-256 it records in `sources.json`. Nothing is typed by hand. See [NOTICE.md](../NOTICE.md) for the terms, and [sources.json](sources.json) for each file's address, date and SHA-256.

- `jlpt/n1.txt` … `n5.txt`: the kanji of Jonathan Waller's five lists, in the order of his pages, read from the saved pages by `scripts/extract-jlpt.mjs`. CC BY.
- `look-alike/`: Lars Yencken's two distance files, as served. CC BY 3.0.
