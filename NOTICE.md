# Notice: the data's licences

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The data in `src/data/` (and `dist/data/`) is other people's work, under their licences, which travel with it. Each data file opens with its notice.

| Entry point | File | Made from | Terms |
| --- | --- | --- | --- |
| `grades` | `src/data/grades.data.ts` | KANJIDIC2, of the Electronic Dictionary Research and Development Group (EDRDG) | CC BY-SA 4.0 and the Group's conditions |
| `jlpt` | `src/data/jlpt.data.ts` | Jonathan Waller's JLPT Resources, tanos.co.uk | Creative Commons "BY" (CC BY) |
| `kanji` | `src/data/kanji.data.ts` | KANJIDIC2, with the levels from Waller's lists | CC BY-SA 4.0 and the Group's conditions; the levels CC BY |
| `look-alike` | `src/data/look-alike.data.ts` | Lars Yencken's kanji confusion datasets (the scores by strokes and by parts), and scores by shape made from KanjiVG's stroke paths | CC BY-SA 3.0 as a whole; Yencken's scores CC BY 3.0 |
| `words-common`, `words-common-extra`, and the pieces `words` fetches | `src/data/words/` | JMdict, of the EDRDG | CC BY-SA 4.0 and the Group's conditions |
| `entries`, and the pieces `loadEntry` fetches (`e*`, `xe*`) | `src/data/words/` | JMdict, of the EDRDG | CC BY-SA 4.0 and the Group's conditions |
| `examples`, and the pieces `loadExamples` fetches (`s*`, `xs*`) | `src/data/examples/` | The Tatoeba project's sentences, linked to JMdict's senses by EDRDG's JMdict_e_examp | CC BY 2.0 FR (the sentences, each credited to its author); CC BY-SA 4.0 and the Group's conditions (the links) |
| `strokes`, and the pieces it fetches (`t*`) | `src/data/strokes/` | KanjiVG, by Ulrich Apel and its contributors | CC BY-SA 3.0 |
| `.` | everything else in `src/` | this package | MIT |

Which rows are kept (every kanji with a school grade; a pair at or over a set score; every reading of JMdict with a meaning, and which of it safe mode keeps) and the functions that read them are this package's own work. Nobody named here has reviewed or endorsed this package.

## KANJIDIC2: the grades, readings, meanings, strokes and frequency ranks

KANJIDIC2 is the property of the Electronic Dictionary Research and Development Group (https://www.edrdg.org/), used under the Creative Commons Attribution-ShareAlike 4.0 licence (https://creativecommons.org/licenses/by-sa/4.0/) and the Group's conditions: https://www.edrdg.org/edrdg/licence.html (read 2026-10-31). It is described at https://www.edrdg.org/wiki/index.php/KANJIDIC_Project. The tables made from it are derived from it and shared under the same licence, and copyright in the file remains the Group's.

What the Group's conditions ask, and where this package does it:

- **Acknowledge the source** in the documentation and the site of whatever uses the file: the README's Licence section, this file, the head of each data file and the foot of the demo do. A page that shows these words must say so on that screen, for example at its foot: *Kanji data from KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).*
- **Provide the licence and documentation**, or links to them: this file and the links above, shipped in the package.
- **Share alike**: `grades` and `kanji` are CC BY-SA 4.0. Code that merely imports them is not changed by that and stays under its own licence.
- **Keep it current.** The Group asks for a procedure for updating its files at least once a month. `.github/workflows/edrdg-refresh.yml` fetches KANJIDIC2 on the 1st of every month and, if the data has changed, leaves it on a branch and opens a pull request from it, so the change is landed as a patch release.

The date and SHA-256 of the file used are in [data-sources/sources.json](data-sources/sources.json), and its date in `release` in the data.

## JMdict: the words

JMdict is the property of the Electronic Dictionary Research and Development Group (https://www.edrdg.org/), used under the Creative Commons Attribution-ShareAlike 4.0 licence and the Group's conditions: https://www.edrdg.org/edrdg/licence.html (read 2026-11-02). It is described at https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project. The words in `src/data/words/` (the common table `words-common`, the pieces that `words` fetches, and the indexes by English meaning and by kanji that `findByMeaning` and `wordsWithKanji` fetch) are derived from it and shared under the same licence, and copyright in the file remains the Group's. Only the English glosses of JMdict_e are used. The indexes by meaning and by kanji hold only readings, each under an English term of a gloss or a kanji of a written form; they are made from the rows and so from the same file, and the default ones from the rows as safe mode has them, so that nothing in them comes from a sense safe mode leaves out. The priority tags of each word (`news1`, `ichi1`, `spec1`, `gai1`, `nf01`…) are JMdict's own.

What the Group's conditions ask, and where this package does it:

- **Acknowledge the source** in the documentation and the site of whatever uses the file: the README's Licence section, this file, the head of every data file and the foot of the demo do. A page that shows these words must say so on that screen, for example at its foot: *Words from JMdict, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).*
- **Provide the licence and documentation**, or links to them: this file and the links above, shipped in the package.
- **Share alike**: the words are CC BY-SA 4.0. Code that merely imports them is not changed by that and stays under its own licence.
- **Keep it current.** The Group asks for a procedure for updating its files at least once a month. `.github/workflows/jmdict-refresh.yml` fetches JMdict_e on the 1st of every month and, if the words have changed, leaves them on a branch and opens a pull request from it, so the change is landed as a patch release.

The date and SHA-256 of the file used are in [data-sources/sources.json](data-sources/sources.json), and its date in `release` in the data.

**The whole entries.** `loadEntry` fetches the entries of the same file whole: every sense with its parts of speech, usage, field and dialect marks, cross-references, antonyms, notes and loanword sources, every gloss, and the marks of the written forms and readings. They are the English file's (JMdict_e), shared under the same licence, and the senses safe mode leaves out are in the `xe` pieces only. Each row also carries its entry's number, `ent_seq`, which is JMdict's own.

**Not used: the glosses in other languages.** JMdict also has glosses in German, French, Russian, Spanish, Dutch, Hungarian, Swedish and Slovenian. The Group's licence statement (https://www.edrdg.org/edrdg/licence.html, read 2026-11-03) applies CC BY-SA 4.0 to "the Japanese and English components" of JMdict and says "the translational equivalents in other languages, e.g. German, French, Dutch, etc. are covered by separate copyright held by the compilers of that material". No terms for those compilers are given there, so none of it is in this package.

**What was kept and what was left out.** Every reading of every entry that has an English meaning is a row. Written forms JMdict marks search-only (`sK`, `sk`) or irregular or outdated (`iK`, `ik`, `oK`, `ok`) are not written forms here, and a reading carrying those marks is kept behind the regular readings and is never called common. A meaning is cut to two senses and about 60 characters, so it is a short gloss and not JMdict's entry. Every sense keeps the marks JMdict gives it (usage, field and dialect codes such as `vulg`, `col`, `arch`, `food`, `ksb`), so that a consumer can leave out what it chooses. Jisho keeps no list of words of its own.

The default, safe mode, leaves out a sense JMdict marks vulgar (`vulg`), X-rated (`X`), sensitive (`sens`) or derogatory (`derog`). None of it is in a file a safe lookup fetches: the common table (`words-common`), the manifest and the pieces hold only the senses safe mode keeps, the written forms and readings that one of those senses applies to, and the words that have at least one, so a word of which every sense is marked is not in them at all. All that was left out is in the extra pieces (`xr*`, `xf*`, `xm*`, `xk*`, their manifests and `common-extra.data`, entry `words-common-extra`), which a lookup fetches only when it says `mode: "unfiltered"`. Those files are in the package and are public, as is the rest of the data: the separation decides what this package's functions fetch and say, and it does not hide the text from anybody who asks for the files. JMdict's marks are its own and are not complete.

## Tatoeba and JMdict_e_examp: the example sentences

The example sentences are from the Tatoeba project (https://tatoeba.org), whose terms of use (https://tatoeba.org/en/terms_of_use, read 2026-11-03) say that text sentences are under the Creative Commons Attribution 2.0 France licence (CC BY 2.0 FR, https://creativecommons.org/licenses/by/2.0/fr/), that reuse needs credit to the author and that a sentence's licence may not be removed; its downloads page says the exported files "are released under CC BY 2.0 FR" and that many Japanese and English sentences come from the Tanaka Corpus, which is public domain. The EDRDG's file index says the same of its `examples` file, which it fills from Tatoeba: "The version maintained by the Tatoeba project has been placed under the CC-BY licence."

Which sentence shows which sense of which word is the work of JMdict_e_examp (http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz), the file the EDRDG makes of JMdict and Tatoeba's Japanese-English pairs. The links are the Group's, under the same CC BY-SA 4.0 licence and conditions as JMdict (above) and the same acknowledgement. The sentences in it are Tatoeba's.

What is kept and where it is shown: 32,434 examples of 26,377 sentences, as JMdict_e_examp links them, each with the Japanese sentence as Tatoeba has it, its English translation, and the Tatoeba number of the sentence. Each carries its credit: the number of the sentence, the name of the user who wrote the Japanese and of the user who wrote the English, from Tatoeba's detailed exports of Japanese and English sentences and its links between them, where those name one (a sentence taken over from the Tanaka Corpus has no user, and is Tatoeba's all the same). `exampleCredit(example)` makes the line to show with a sentence: "Tatoeba #4448, Japanese by alice, English by bob (CC BY 2.0 FR)". A page that shows a sentence must show it, or its parts. The furigana and the JLPT level of each sentence are this package's own work, made with `readText` and the levels of the kanji, and no native reader has checked them. The exports' addresses, dates and SHA-256 are in [data-sources/sources.json](data-sources/sources.json). `package.json`'s `license` field says `CC-BY-2.0` for the sentences because SPDX has no identifier for the France port; read it as CC BY 2.0 FR. Nothing here is Tatoeba's audio, which has licences of its own.

Safe mode leaves out an example of a sense JMdict marks vulgar, X-rated, sensitive or derogatory, a sentence JMdict_e_examp also links to such a sense of another word, and a sentence in which safe mode does not find the words unfiltered mode finds; the pieces that hold them (`xs*`) are fetched only unfiltered. Jisho keeps no list of words of its own, so a sentence that is rude in English only, with words JMdict does not mark, is in the default pieces.

## KanjiVG: the stroke order

The strokes are from KanjiVG (https://kanjivg.tagaini.net), copyright Ulrich Apel and its contributors, released "under the Creative Commons Attribution-Share Alike 3.0 licence" (CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/; the project's README at https://github.com/KanjiVG/kanjivg, read 2026-11-03, and the header of every one of its files). That header says what the licence asks: "You must attribute the work by stating your use of KanjiVG in your own copyright header and linking to KanjiVG's website (http://kanjivg.tagaini.net)", and "If you alter, transform, or build upon this work, you may distribute the resulting work only under the same or similar license". Every file of `src/data/strokes/` says so in its own header, and the tables made from it are shared under CC BY-SA 3.0, not 4.0; code that merely imports them is not changed by that and stays under its own licence. Credit it where you show the stroke order, for example: *Stroke order from KanjiVG (Ulrich Apel and contributors, CC BY-SA 3.0, http://kanjivg.tagaini.net).*

What was kept: the stroke paths, in the order they are written, of the 2,967 kanji of this package's table that KanjiVG's main release draws (release r20260714; 32 kanji that are old forms with no file there have none), as the SVG path text KanjiVG gives, in a square of 109 by 109. Nothing else of KanjiVG's (its groups, stroke types, radicals or components) is kept. `strokeOrderSvg` and `findByDrawing`, which read the paths, are this package's own work. KanjiVG's release address and SHA-256 are in [data-sources/sources.json](data-sources/sources.json). `data-sources/README.md` says how to make the table again. Bushu (also of this family) works from RADKFILE and does not hold KanjiVG, so there is no second copy of it to keep in step.

## Jonathan Waller's JLPT lists: the levels

The Japanese Language Proficiency Test has published no list of kanji since the present five levels began in 2010, so any list of kanji by level is somebody's reconstruction. These are Jonathan Waller's, from his JLPT Resources (http://www.tanos.co.uk/jlpt/). His page "Use my data!" (http://www.tanos.co.uk/jlpt/sharing/) says: "Everything on this site (that I'm not selling), is licenced under Creative Commons "BY". Basically this means... use anything here however you like (commercial or non-commercial), but credit my site. (A link would be nice.)"

The page names no version of the licence. `package.json`'s `license` field says `CC-BY-4.0` for these lists only because SPDX has no identifier for a Creative Commons "BY" with no version; read it as "CC BY, version not stated by the author". The credit above is the same under every version.

If you show the levels, credit his site and link to it, for example: *JLPT levels from Jonathan Waller's JLPT Resources (http://www.tanos.co.uk/jlpt/), CC BY.*

tanos.co.uk did not answer from where this package was built on 2026-10-31, so the five kanji pages and the page of terms were read from the Internet Archive's copies; [data-sources/sources.json](data-sources/sources.json) gives the address and date of each copy.

## Lars Yencken's kanji confusion datasets, and KanjiVG: the look-alike pairs

The scores by strokes and by parts are from https://lars.yencken.org/datasets/kanji-confusion/, whose page says all of its data sets are "released under the Creative Commons Attribution 3.0 Unported license" (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/; read 2026-10-31), and that "for web sites, a reference to the data set and link back to this page in your about page is sufficient". This package uses two files, `jyouyou__strokeEditDistance.csv` and `jyouyou__yehAndLiRadical.csv`, and keeps from them the pairs with a score of 60 or more by strokes, or 70 or more by parts, as whole numbers out of 100. The citation the page asks for:

> Yencken, Lars (2010) Orthographic support for passing the reading hurdle in Japanese. PhD Thesis, University of Melbourne, Melbourne, Australia.

**The scores by shape.** His two measures cover only the 1,945 jōyō kanji of before 2010. For the 196 kanji added in 2010, the kanji for names, and pairs his measures ranked too low, `scripts/build-shapes.mjs` scores pairs from the stroke paths of KanjiVG (release r20260714, the paths in `src/data/strokes/`; its licence and terms are in the KanjiVG section above): a stroke edit distance over the strokes as written, which uses nothing of KanjiVG but the paths. It writes `data-sources/look-alike/shape-pairs.tsv`, and `scripts/build-data.mjs` adds the pairs it keeps to the table (2,882 pairs, each with a fourth number, the score by shape). Those scores are derived from KanjiVG, so they are under CC BY-SA 3.0, and so is `src/data/look-alike.data.ts` as a whole, which holds Yencken's CC BY 3.0 scores too; CC BY 3.0 material may be put into a CC BY-SA 3.0 work, and his credit above stays. Credit both where you show the pairs, for example: *Look-alike kanji from Lars Yencken's kanji confusion datasets (CC BY 3.0, https://lars.yencken.org/datasets/kanji-confusion/) and shape scores made from KanjiVG (Ulrich Apel and contributors, CC BY-SA 3.0, http://kanjivg.tagaini.net).* No pair comes from a commercial study service.
