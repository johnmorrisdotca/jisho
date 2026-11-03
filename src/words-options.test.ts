import { describe, expect, it } from "vitest";
import { COMMON_WORDS } from "./data/words/common.data.ts";
import {
  findByMeaning,
  hasMarks,
  loadCommonWords,
  loadWords,
  onlyWords,
  readCommonWords,
  withoutMarks,
  withoutWords,
  wordsOf,
  wordsWithKanji,
} from "./words.ts";

/** What a JavaScript caller can get wrong where a list belongs. */
const NOT_LISTS = ["神", "", 5, true, {}, null, new Set(["神"]), [1], ["神", 2], [["神"]]];
const asList = (value: unknown) => value as readonly string[];

describe("the lists a lookup takes", () => {
  it("must be lists of texts, and a text in place of a list says which option it was", async () => {
    for (const wrong of NOT_LISTS) {
      for (const name of ["block", "allow"] as const) {
        const options = { [name]: asList(wrong) };
        await expect(loadWords("かみ", options), `${name} ${String(wrong)}`).rejects.toThrow(TypeError);
        await expect(loadWords("かみ", options)).rejects.toThrow(new RegExp(`^${name} must be a list of texts`));
        await expect(loadCommonWords(options)).rejects.toThrow(TypeError);
        expect(() => readCommonWords(COMMON_WORDS, options)).toThrow(TypeError);
        await expect(findByMeaning("water", options)).rejects.toThrow(TypeError);
        await expect(wordsWithKanji("山", options)).rejects.toThrow(TypeError);
      }
    }
  });

  it("are refused before anything is fetched, so a nothing-to-load text is no excuse", async () => {
    await expect(loadWords("", { block: asList("神") })).rejects.toThrow(TypeError);
    await expect(findByMeaning("zxqvwj", { allow: asList("神") })).rejects.toThrow(TypeError);
  });

  it("are the same lists the tools take, so a text where a list belongs is the same mistake there", async () => {
    const words = wordsOf(await loadWords("かみ"), "かみ");
    for (const wrong of NOT_LISTS.filter((one) => one !== undefined)) {
      expect(() => withoutWords(words, asList(wrong))).toThrow(TypeError);
      expect(() => onlyWords(words, asList(wrong))).toThrow(TypeError);
      expect(() => withoutMarks(words, asList(wrong))).toThrow(TypeError);
      expect(() => hasMarks(words[0] ?? ({} as never), asList(wrong))).toThrow(TypeError);
    }
  });

  it("still take a list, an empty list, or none at all", async () => {
    expect(wordsOf(await loadWords("かみ", { block: ["神"] }), "かみ").map((one) => one.written)).not.toContain("神");
    expect(wordsOf(await loadWords("かみ", { allow: [] }), "かみ")).toEqual([]);
    expect((await findByMeaning("water", { block: undefined, allow: undefined })).length).toBeGreaterThan(0);
    expect(wordsOf(await loadWords("かみ", { block: [], allow: undefined }), "かみ").length).toBeGreaterThan(0);
  });
});
