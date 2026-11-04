// The code the demo's "Put it in your page" panel writes: every way writes the lookup that gives the rows, the lookup runs against the package, and the pieces of each way are there.
import { describe, expect, it } from "vitest";

import { DEFAULT_LIMIT, embedCode, frameCode, frameQuery, LOOKUPS, lookupOf, STARTS } from "../demo/embed-code.js";
import { KANJI } from "../src/data/kanji.data.ts";
import { readKanji } from "../src/index.ts";
import { findByMeaning, loadWords, wordsOf } from "../src/words.ts";

const KINDS = ["html", "module", "react", "vue", "angular", "svelte"];
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor;

/** Runs the `lookup` a way's code defines, with the package's own functions in scope. */
async function rowsOf(code, text) {
  const line = code.split("\n").find((one) => /^\s*const lookup = /.test(one));
  expect(line, "the code defines lookup").toBeDefined();
  const source = line.replace(/^\s*const lookup = /, "").replace(/;\s*$/, "");
  return new AsyncFunction(
    "loadWords",
    "wordsOf",
    "findByMeaning",
    "readKanji",
    "KANJI",
    `return (${source})(${JSON.stringify(text)});`,
  )(loadWords, wordsOf, findByMeaning, readKanji, KANJI);
}

describe("the code for each way a page is made", () => {
  for (const what of LOOKUPS) {
    it(`${what}: every way defines the lookup, and the lookup gives rows`, async () => {
      const choice = { what, text: STARTS[what], limit: 3 };
      for (const kind of KINDS) {
        const code = embedCode(kind, choice, "9.9.9");
        expect(code, kind).toBeTypeOf("string");
        const rows = await rowsOf(code, choice.text);
        expect(rows.length, `${kind}: rows`).toBeGreaterThan(0);
        if (what !== "kanji") expect(rows.length, `${kind}: limit`).toBeLessThanOrEqual(3);
        expect(code, kind).toContain(JSON.stringify(choice.text));
      }
    });
  }

  it("the words of a reading are paper, god and hair, and the unfiltered audience is said in the call", async () => {
    const rows = await rowsOf(embedCode("module", { what: "word", text: "かみ" }, "9.9.9"), "かみ");
    expect(rows.slice(0, 3).map((one) => one.written)).toEqual(["紙", "神", "髪"]);
    expect(embedCode("module", { what: "word", text: "かみ", unfiltered: true }, "9.9.9")).toContain(
      '{ mode: "unfiltered" }',
    );
    expect(embedCode("module", { what: "meaning", text: "water", unfiltered: true }, "9.9.9")).toContain(
      'mode: "unfiltered"',
    );
    expect(embedCode("module", { what: "word", text: "かみ" }, "9.9.9")).not.toContain("unfiltered");
  });

  it("the plain page imports from the CDN at the version, the others from the package, and the package's files are the ones that exist", () => {
    const html = embedCode("html", { what: "word", text: "かみ" }, "9.9.9");
    expect(html).toContain("https://cdn.jsdelivr.net/npm/@johnmorrisdotca/jisho@9.9.9/dist/words.js");
    expect(embedCode("html", { what: "kanji", text: "山" }, "9.9.9")).toContain("@9.9.9/dist/data/kanji.data.js");
    expect(embedCode("module", { what: "word", text: "かみ" }, "9.9.9")).toContain(
      'from "@johnmorrisdotca/jisho/words"',
    );
    expect(embedCode("react", { what: "kanji", text: "山" }, "9.9.9")).toContain('from "@johnmorrisdotca/jisho/kanji"');
    expect(embedCode("vue", { what: "word", text: "かみ" }, "9.9.9")).toContain("watchEffect");
    expect(embedCode("angular", { what: "word", text: "かみ" }, "9.9.9")).toContain("standalone: true");
    expect(embedCode("svelte", { what: "word", text: "かみ" }, "9.9.9")).toContain("$effect");
    expect(lookupOf({ what: "word", text: "x" }).fields).toEqual(["one.written", "one.meaning"]);
  });

  it("the frame's address says what the embed page reads, and leaves out what it does by itself", () => {
    const query = new URLSearchParams(
      frameQuery({ what: "meaning", text: "water", limit: 10, unfiltered: true }, "ja", "dark"),
    );
    expect([...query.keys()].sort()).toEqual(["lang", "limit", "meaning", "mode", "theme"]);
    expect(frameQuery({ what: "word", text: "かみ", limit: DEFAULT_LIMIT }, "en")).toBe("word=%E3%81%8B%E3%81%BF");
    expect(frameQuery({ what: "kanji", text: "山", limit: 10 }, "en")).toBe("kanji=%E5%B1%B1");
    const copied = frameCode("word=%E3%81%8B%E3%81%BF", "Jisho", 360, false);
    expect(copied).toContain('src="https://johnmorrisdotca.github.io/jisho/embed.html?word=');
    expect(copied).toContain('width="360"');
    expect(copied).toContain('height="420"');
    expect(frameCode("word=x", "Jisho", 360, true)).toContain('src="embed.html?word=x"');
  });
});
