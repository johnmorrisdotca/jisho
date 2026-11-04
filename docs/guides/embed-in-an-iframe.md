---
title: "Embed it with an iframe"
section: how-to
order: 12
description: "Put the words for a reading, a meaning or a kanji in any page with one iframe and no script."
---

The demo site has a page made to be framed, `embed.html`. It draws what its address says and fetches nothing but its own files, so it needs no script, no build and no package on your side. The demo's ["Put it in your page"](https://johnmorrisdotca.github.io/jisho/#embed-title) is the family's embed panel: choose what to look up (a reading or a word, an English meaning or a kanji), how many rows and the audience, and it writes the iframe below and the same lookup for plain HTML, an ES module, React, Vue, Angular and Svelte, with the embed page itself beside the code.

The iframe:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jisho in an iframe</title>
  </head>
  <body>
    <iframe
      src="https://johnmorrisdotca.github.io/jisho/embed.html?word=%E3%81%8B%E3%81%BF&limit=3&lang=en"
      title="The words read かみ"
      width="360"
      height="420"
      loading="lazy"
      style="border: 0"
    ></iframe>
  </body>
</html>
```

The page is light unless the device asks for dark, and `theme=dark` or `theme=light` decides. It has no header, no controls and nothing but the answer and the credit for the data.

## What the address can say

| In the address | What it does |
| --- | --- |
| `word=かみ` | The words read or written `かみ`, in kana, romaji or kanji, and the words a conjugated text comes from (`食べなかった` gives 食べる). |
| `meaning=water` | The commonest words whose English meaning holds `water`. |
| `kanji=山` | The card of one kanji: strokes, school grade, JLPT level, readings and meanings. |
| `with=山` | The commonest words written with a kanji. |
| `limit=5` | How many words, 1 to 20. The default is 5. |
| `mode=unfiltered` | Every sense JMdict has. The default is `safe`. |
| `lang=ja` | The labels in Japanese. The default is English. |
| `theme=dark` | The colours. Without it, the device's choice. |

Give more than one and the page draws each, the kanji card first. Percent-encode Japanese text in the address (`%E3%81%8B%E3%81%BF` is かみ); a browser does it for you when you type the address, and `encodeURIComponent` does it in code.

## Safe by default

The embed is in safe mode unless the address says `mode=unfiltered`, and in safe mode it never fetches the files that hold what JMdict marks vulgar, X-rated, sensitive or derogatory, or a gloss that names sex or the sex trade. A page for children should leave `mode` out and should not let a visitor choose it.

## Before you ship

- **Size the frame.** Three words fit in 360 by 420; the page scrolls inside the frame when there are more.
- **Allow the frame.** A site with a content security policy lists `https://johnmorrisdotca.github.io` in `frame-src`.
- **Host your own copy** by publishing the demo's `embed.html`, `embed.js`, `embed.css`, `family.css` and `dist` folder beside each other, if you do not want to depend on the demo site.
