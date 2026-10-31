# Notice: the data's licences

The code of this package is under the MIT licence (see [LICENSE](LICENSE)). The data in `src/data/` (and `dist/data/`) is other people's work, under their licences, which travel with it. Each data file opens with its notice.

| Entry point | File | Made from | Terms |
| --- | --- | --- | --- |
| `grades` | `src/data/grades.data.ts` | KANJIDIC2, of the Electronic Dictionary Research and Development Group (EDRDG) | CC BY-SA 4.0 and the Group's conditions |
| `jlpt` | `src/data/jlpt.data.ts` | Jonathan Waller's JLPT Resources, tanos.co.uk | Creative Commons "BY" (CC BY) |
| `kanji` | `src/data/kanji.data.ts` | KANJIDIC2, with the levels from Waller's lists | CC BY-SA 4.0 and the Group's conditions; the levels CC BY |
| `look-alike` | `src/data/look-alike.data.ts` | Lars Yencken's kanji confusion datasets | CC BY 3.0 |
| `.` | everything else in `src/` | this package | MIT |

Which rows are kept (every kanji with a school grade; a pair at or over a set score) and the functions that read them are this package's own work. Nobody named here has reviewed or endorsed this package.

## KANJIDIC2: the grades, readings, meanings, strokes and frequency ranks

KANJIDIC2 is the property of the Electronic Dictionary Research and Development Group (https://www.edrdg.org/), used under the Creative Commons Attribution-ShareAlike 4.0 licence (https://creativecommons.org/licenses/by-sa/4.0/) and the Group's conditions: https://www.edrdg.org/edrdg/licence.html (read 2026-10-31). It is described at https://www.edrdg.org/wiki/index.php/KANJIDIC_Project. The tables made from it are derived from it and shared under the same licence, and copyright in the file remains the Group's.

What the Group's conditions ask, and where this package does it:

- **Acknowledge the source** in the documentation and the site of whatever uses the file: the README's Licence section, this file, the head of each data file and the foot of the demo do. A page that shows these words must say so on that screen, for example at its foot: *Kanji data from KANJIDIC2, the property of the Electronic Dictionary Research and Development Group, used under the Group's licence (https://www.edrdg.org/edrdg/licence.html).*
- **Provide the licence and documentation**, or links to them: this file and the links above, shipped in the package.
- **Share alike**: `grades` and `kanji` are CC BY-SA 4.0. Code that merely imports them is not changed by that and stays under its own licence.
- **Keep it current.** The Group asks for a procedure for updating its files at least once a month. `.github/workflows/edrdg-refresh.yml` fetches KANJIDIC2 on the 1st of every month and, if the data has changed, leaves it on a branch and fails on purpose, so the change is landed as a patch release.

The date and SHA-256 of the file used are in [data-sources/sources.json](data-sources/sources.json), and its date in `release` in the data.

## Jonathan Waller's JLPT lists: the levels

The Japanese Language Proficiency Test has published no list of kanji since the present five levels began in 2010, so any list of kanji by level is somebody's reconstruction. These are Jonathan Waller's, from his JLPT Resources (http://www.tanos.co.uk/jlpt/). His page "Use my data!" (http://www.tanos.co.uk/jlpt/sharing/) says: "Everything on this site (that I'm not selling), is licenced under Creative Commons "BY". Basically this means... use anything here however you like (commercial or non-commercial), but credit my site. (A link would be nice.)"

If you show the levels, credit his site and link to it, for example: *JLPT levels from Jonathan Waller's JLPT Resources (http://www.tanos.co.uk/jlpt/), CC BY.*

tanos.co.uk did not answer from where this package was built on 2026-10-31, so the five kanji pages and the page of terms were read from the Internet Archive's copies; [data-sources/sources.json](data-sources/sources.json) gives the address and date of each copy.

## Lars Yencken's kanji confusion datasets: the look-alike pairs

The scores are from https://lars.yencken.org/datasets/kanji-confusion/, whose page says all of its data sets are "released under the Creative Commons Attribution 3.0 Unported license" (CC BY 3.0, https://creativecommons.org/licenses/by/3.0/; read 2026-10-31), and that "for web sites, a reference to the data set and link back to this page in your about page is sufficient". This package uses two files, `jyouyou__strokeEditDistance.csv` and `jyouyou__yehAndLiRadical.csv`, and keeps from them the pairs with a score of 60 or more by strokes, or 70 or more by parts, as whole numbers out of 100. The citation the page asks for:

> Yencken, Lars (2010) Orthographic support for passing the reading hurdle in Japanese. PhD Thesis, University of Melbourne, Melbourne, Australia.
