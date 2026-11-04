// The text that puts a lookup in a page, for each way a page is made. Jisho has no element: a page asks for the rows (`loadWords`, `findByMeaning` or `readKanji`) and writes them, so each way is
// the same lookup in that way's own shape, and the embed page does it with no script at all. The demo's "Put it in your page" panel is filled from here, and
// scripts/embed-code.test.mjs runs the lookup of every way against the package.
import { embedSnippet } from "@johnmorrisdotca/kazoku-ui/embed-panel";

export const PACKAGE = "@johnmorrisdotca/jisho";
export const SITE = "https://johnmorrisdotca.github.io/jisho/";
/** What can be looked up, in the order the demo shows them. */
export const LOOKUPS = ["word", "meaning", "kanji"];
/** What each lookup starts with. */
export const STARTS = { word: "かみ", meaning: "water", kanji: "山" };
/** The numbers of rows the embed page and the code offer, and the one the package uses when none is said. */
export const LIMITS = [3, 5, 10];
export const DEFAULT_LIMIT = 5;

/**
 * What a lookup needs: the names it imports (and from which file of the package), the arrow function that answers `text` with rows, and what is written for each row.
 *
 * @param {{ what: string, text: string, limit?: number, unfiltered?: boolean }} choice
 */
export function lookupOf(choice) {
  const limit = choice.limit ?? DEFAULT_LIMIT;
  const mode = choice.unfiltered === true ? ', { mode: "unfiltered" }' : "";
  const modeOnly = choice.unfiltered === true ? ', mode: "unfiltered"' : "";
  if (choice.what === "kanji") {
    return {
      imports: [
        { names: ["readKanji"], file: "index" },
        { names: ["KANJI"], file: "data/kanji.data", from: "kanji" },
      ],
      call: `async (text) => readKanji(KANJI).filter((one) => one.kanji === text)`,
      fields: ["one.kanji", 'one.meanings.join(", ")'],
      key: "one.kanji",
    };
  }
  if (choice.what === "meaning") {
    return {
      imports: [{ names: ["findByMeaning"], file: "words", from: "words" }],
      call: `async (text) => findByMeaning(text, { limit: ${limit}${modeOnly} })`,
      fields: ["one.written", "one.meaning"],
      key: "one.written + one.reading",
    };
  }
  return {
    imports: [{ names: ["loadWords", "wordsOf"], file: "words", from: "words" }],
    call: `async (text) => wordsOf(await loadWords(text${mode}), text).slice(0, ${limit})`,
    fields: ["one.written", "one.meaning"],
    key: "one.written + one.reading",
  };
}

const importLine = (imports, where) =>
  imports.map((one) => `import { ${one.names.join(", ")} } from "${where(one)}";`).join("\n");
const fromPackage = (one) => `${PACKAGE}${one.from === undefined || one.from === "index" ? "" : `/${one.from}`}`;
const fromCdn = (version) => (one) => `https://cdn.jsdelivr.net/npm/${PACKAGE}@${version}/dist/${one.file}.js`;
const words = (look, open, close, between = " ") => look.fields.map((field) => `${open}${field}${close}`).join(between);
const quoted = (text) => JSON.stringify(text);

/**
 * The code for one of the ways a page is made that write the rows: `html`, `module`, `react`, `vue`, `angular` or `svelte`.
 *
 * @param {string} kind
 * @param {{ what: string, text: string, limit?: number, unfiltered?: boolean }} choice
 * @param {string} version The package's version, for the CDN.
 * @returns {string | undefined}
 */
export function embedCode(kind, choice, version) {
  const look = lookupOf(choice);
  const text = quoted(choice.text);
  const lookup = `const lookup = ${look.call};`;
  const label = words(look, "${", "}");
  switch (kind) {
    case "html":
      return `<ul id="rows" lang="ja"></ul>\n<script type="module">\n${importLine(look.imports, fromCdn(version))
        .split("\n")
        .map((line) => `  ${line}`)
        .join(
          "\n",
        )}\n\n  ${lookup}\n  const items = (await lookup(${text})).map((one) => Object.assign(document.createElement("li"), { textContent: \`${label}\` }));\n  document.querySelector("#rows").replaceChildren(...items);\n</script>`;
    case "module":
      return `${importLine(look.imports, fromPackage)}\n\n${lookup}\nconst items = (await lookup(${text})).map((one) => Object.assign(document.createElement("li"), { textContent: \`${label}\` }));\ndocument.querySelector("#rows").replaceChildren(...items);`;
    case "react":
      return `${importLine(look.imports, fromPackage)}\nimport { useEffect, useState } from "react";\n\n${lookup}\n\nexport function Lookup({ text = ${text} }) {\n  const [rows, setRows] = useState([]);\n  useEffect(() => {\n    let current = true;\n    void lookup(text).then((found) => current && setRows(found));\n    return () => {\n      current = false;\n    };\n  }, [text]);\n  return (\n    <ul lang="ja">\n      {rows.map((one) => (\n        <li key={${look.key}}>${words(look, "{", "}")}</li>\n      ))}\n    </ul>\n  );\n}`;
    case "vue":
      return `<script setup>\n${importLine(look.imports, fromPackage)}\nimport { ref, watchEffect } from "vue";\n\nconst props = defineProps({ text: { type: String, default: ${text} } });\nconst rows = ref([]);\n${lookup}\n\nwatchEffect(async () => {\n  const text = props.text;\n  const found = await lookup(text);\n  if (text === props.text) rows.value = found;\n});\n</script>\n\n<template>\n  <ul lang="ja">\n    <li v-for="one in rows" :key="${look.key}">${words(look, "{{ ", " }}")}</li>\n  </ul>\n</template>`;
    case "angular":
      return `import { Component, Input, type OnChanges, type OnInit, type SimpleChanges, signal } from "@angular/core";\n${importLine(look.imports, fromPackage)}\n\n${lookup}\ntype Row = Awaited<ReturnType<typeof lookup>>[number];\n\n@Component({\n  selector: "app-lookup",\n  standalone: true,\n  template: \`\n    <ul lang="ja">\n      @for (one of rows(); track ${look.key}) {\n        <li>${words(look, "{{ ", " }}")}</li>\n      }\n    </ul>\n  \`,\n})\nexport class LookupComponent implements OnInit, OnChanges {\n  @Input() text = ${text};\n  readonly rows = signal<readonly Row[]>([]);\n\n  ngOnInit(): void {\n    void this.show();\n  }\n\n  ngOnChanges(changes: SimpleChanges): void {\n    if (changes["text"]?.firstChange === false) void this.show();\n  }\n\n  private async show(): Promise<void> {\n    const asked = this.text;\n    const found = await lookup(asked);\n    if (asked === this.text) this.rows.set(found);\n  }\n}`;
    case "svelte":
      return `<script>\n${importLine(look.imports, fromPackage)
        .split("\n")
        .map((line) => `  ${line}`)
        .join(
          "\n",
        )}\n\n  ${lookup}\n  let { text = ${text} } = $props();\n  let rows = $state([]);\n\n  $effect(() => {\n    const asked = text;\n    void lookup(asked).then((found) => {\n      if (asked === text) rows = found;\n    });\n  });\n</script>\n\n<ul lang="ja">\n  {#each rows as one (${look.key})}\n    <li>${words(look, "{", "}")}</li>\n  {/each}\n</ul>`;
    default:
      return undefined;
  }
}

/** What the embed page's address says for a choice (`limit` and `mode` are left out when they are the page's own). */
export function frameQuery(choice, language, theme) {
  const query = new URLSearchParams({ [choice.what]: choice.text });
  if (choice.what !== "kanji" && (choice.limit ?? DEFAULT_LIMIT) !== DEFAULT_LIMIT)
    query.set("limit", String(choice.limit));
  if (choice.what !== "kanji" && choice.unfiltered === true) query.set("mode", "unfiltered");
  if (language === "ja") query.set("lang", "ja");
  if (theme === "dark" || theme === "light") query.set("theme", theme);
  return query.toString();
}

/** The `iframe` way: the embed page at a width. `root` is the way to the demo for the picture beside the code; the copied code names the published demo. */
export function frameCode(query, title, width, preview) {
  return embedSnippet("iframe", {
    package: PACKAGE,
    cdn: "",
    tag: "jisho-lookup",
    element: "",
    entries: [],
    attrs: [],
    name: "lookup",
    iframe: { src: `${preview ? "" : SITE}embed.html?${query}`, title, width, height: Math.round((width * 7) / 6) },
  });
}
