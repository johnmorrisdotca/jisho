// "Put it in your page": the family's <kazoku-embed-panel>, filled with what a lookup needs. The reader chooses what to look up and for what; the panel writes the code for each way a page is
// made, shows the embed page's own picture beside it, and keeps its tab and width in the address. The code is written by embed-code.js.
import "@johnmorrisdotca/kazoku-ui/embed-panel/define";

import { VERSION } from "./dist/index.js";
import { DEFAULT_LIMIT, embedCode, frameCode, frameQuery, LIMITS, LOOKUPS, STARTS } from "./embed-code.js";

const WORDS = {
  en: {
    what: "Look up",
    word: "A reading or a word",
    meaning: "An English meaning",
    kanji: "A kanji",
    text: "What to look up",
    limit: "How many",
    audience: "Words",
    safe: "Safe",
    unfiltered: "Unfiltered",
    title: "Jisho lookup",
    notes: {
      word: "The words read or written like that, and the words a conjugated text comes from.",
      meaning: "The commonest words whose English meaning holds the text.",
      kanji: "The card of one kanji: strokes, grade, JLPT level, readings and meanings.",
    },
    credit: {
      words: "Jisho by John Morris (MIT). Words from JMdict (EDRDG, CC BY-SA 4.0).",
      kanji: "Jisho by John Morris (MIT). Kanji from KANJIDIC2 (EDRDG, CC BY-SA 4.0).",
    },
  },
  ja: {
    what: "引くもの",
    word: "読みか単語",
    meaning: "英語の意味",
    kanji: "漢字",
    text: "引くことば",
    limit: "表示する数",
    audience: "単語",
    safe: "安全",
    unfiltered: "すべて",
    title: "Jisho の検索",
    notes: {
      word: "その読みか表記の単語と、活用した語のもとの単語です。",
      meaning: "英語の意味にそのことばを含む、よく使う単語です。",
      kanji: "漢字1つのカード：画数、学年、JLPTレベル、読み、意味。",
    },
    credit: {
      words: "Jisho、作者 John Morris (MIT)。単語はJMdict (EDRDG、CC BY-SA 4.0)。",
      kanji: "Jisho、作者 John Morris (MIT)。漢字はKANJIDIC2 (EDRDG、CC BY-SA 4.0)。",
    },
  },
};
const KEYS = { what: "lookup", text: "for", limit: "count", unfiltered: "audience" };

const panel = document.getElementById("embed-panel");
if (panel !== null) {
  const query = new URLSearchParams(location.search);
  const start = LOOKUPS.includes(query.get(KEYS.what)) ? query.get(KEYS.what) : "word";
  const count = Number(query.get(KEYS.limit));
  const choice = {
    what: start,
    text: query.get(KEYS.text) ?? STARTS[start],
    limit: LIMITS.includes(count) ? count : DEFAULT_LIMIT,
    unfiltered: query.get(KEYS.unfiltered) === "unfiltered",
  };
  const lang = () => (document.documentElement.lang === "ja" ? "ja" : "en");
  const say = () => WORDS[lang()];
  const forced = () => {
    const theme = document.documentElement.dataset.theme;
    return theme === "dark" || theme === "light" ? theme : undefined;
  };
  const $ = (id) => document.getElementById(id);
  const buttons = (id, items, chosen, on) => {
    $(id).replaceChildren(
      ...items.map(([value, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.value = String(value);
        button.textContent = label;
        button.setAttribute("aria-pressed", String(String(value) === String(chosen)));
        button.addEventListener("click", () => on(value));
        return button;
      }),
    );
  };
  const remember = () => {
    const next = new URLSearchParams(location.search);
    const set = (key, value, byDefault) => (value === byDefault ? next.delete(key) : next.set(key, String(value)));
    set(KEYS.what, choice.what, "word");
    set(KEYS.text, choice.text, STARTS[choice.what]);
    set(KEYS.limit, choice.limit, DEFAULT_LIMIT);
    set(KEYS.unfiltered, choice.unfiltered ? "unfiltered" : "safe", "safe");
    const text = next.toString();
    history.replaceState(history.state, "", `${location.pathname}${text === "" ? "" : `?${text}`}${location.hash}`);
  };
  const drawChoices = () => {
    const words = say();
    $("embed-what-label").textContent = words.what;
    $("embed-text-label").textContent = words.text;
    $("embed-limit-label").textContent = words.limit;
    $("embed-audience-label").textContent = words.audience;
    $("embed-note").textContent = words.notes[choice.what];
    buttons(
      "embed-what",
      LOOKUPS.map((one) => [one, words[one]]),
      choice.what,
      (value) => {
        choice.what = value;
        choice.text = STARTS[value];
        $("embed-text").value = choice.text;
        changed();
      },
    );
    buttons(
      "embed-limit",
      LIMITS.map((one) => [one, String(one)]),
      choice.limit,
      (value) => {
        choice.limit = Number(value);
        changed();
      },
    );
    buttons(
      "embed-audience",
      [
        ["safe", words.safe],
        ["unfiltered", words.unfiltered],
      ],
      choice.unfiltered ? "unfiltered" : "safe",
      (value) => {
        choice.unfiltered = value === "unfiltered";
        changed();
      },
    );
    for (const row of document.querySelectorAll("[data-embed-words]")) row.hidden = choice.what === "kanji";
    $("embed-text").lang = choice.what === "meaning" ? "en" : "ja";
  };
  const frame = (width, preview) =>
    frameCode(frameQuery(choice, lang(), preview ? forced() : undefined), say().title, width, preview);
  function changed() {
    drawChoices();
    panel.openHref = `embed.html?${frameQuery(choice, lang(), forced())}`;
    panel.update();
    remember();
  }

  // The picture is the embed page, which fetches the dictionary's pieces: it waits until the panel is on screen.
  let seen = false;
  const waiting = new Set();
  const show = (frame) => frame.setAttribute("src", frame.dataset.src);
  new IntersectionObserver((entries) => {
    if (seen || !entries.some((entry) => entry.isIntersecting)) return;
    seen = true;
    for (const frame of waiting) show(frame);
    waiting.clear();
  }).observe(panel);
  const picture = (size) => {
    const holder = document.createElement("div");
    holder.innerHTML = frame(size, true);
    const found = holder.querySelector("iframe");
    if (found === null) return undefined;
    const made = document.createElement("iframe");
    for (const name of found.getAttributeNames())
      if (name !== "src" && name !== "style") made.setAttribute(name, found.getAttribute(name));
    made.dataset.src = found.getAttribute("src");
    if (seen) show(made);
    else waiting.add(made);
    return made;
  };

  panel.kinds = ["html", "module", "react", "vue", "angular", "svelte", "iframe"];
  panel.generate = ({ kind, size, preview }) =>
    kind === "iframe" ? frame(size, preview) : (embedCode(kind, choice, VERSION) ?? "");
  panel.preview = ({ size }) => picture(size);
  panel.credits = () => say().credit[choice.what === "kanji" ? "kanji" : "words"];
  panel.docsHref = lang() === "ja" ? "docs/ja/index.html" : "docs/index.html";

  $("embed-text").value = choice.text;
  $("embed-text").addEventListener("input", (event) => {
    choice.text = event.target.value.trim() === "" ? STARTS[choice.what] : event.target.value.trim();
    panel.openHref = `embed.html?${frameQuery(choice, lang(), forced())}`;
    panel.update();
    remember();
  });
  const again = () => {
    panel.docsHref = lang() === "ja" ? "docs/ja/index.html" : "docs/index.html";
    changed();
  };
  new MutationObserver(again).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang", "data-theme"],
  });
  changed();
}
