import { describe, expect, it } from "vitest";
import { COMMON_WORDS } from "./data/words/common.data.ts";
import { COMMON_EXTRA } from "./data/words/common-extra.data.ts";
import { MANIFEST } from "./data/words/manifest.data.ts";
import {
  allWords,
  foldKana,
  isLoaded,
  loadCommonWords,
  loadWords,
  meaningOf,
  readCommonWords,
  readRow,
  wordsOf,
} from "./words.ts";

describe("the words of a reading", () => {
  it("come commonest first, each with its written form: かみ is paper, god, hair", async () => {
    const words = await loadWords("かみ");
    expect(
      wordsOf(words, "かみ")
        .slice(0, 3)
        .map((one) => [one.written, one.meaning]),
    ).toEqual([
      ["紙", "paper"],
      ["神", "god, deity, divinity; god-tier, incredible, fantastic"],
      ["髪", "hair (on the head)"],
    ]);
    expect(wordsOf(words, "かみ").length).toBeGreaterThan(8);
  });

  it("are the same in katakana, which finds a loanword by either kana", async () => {
    const words = await loadWords(["カミ", "てれび"]);
    expect(wordsOf(words, "かみ")[0]?.written).toBe("紙");
    expect(wordsOf(words, "てれび")[0]).toMatchObject({ written: "テレビ", reading: "テレビ", common: true });
    expect(wordsOf(words, "テレビ")[0]?.reading).toBe("テレビ");
  });

  it("show the reading itself for a word usually written in kana, and for one with no kanji", async () => {
    const words = await loadWords(["ありがとう", "いぬ"]);
    expect(wordsOf(words, "ありがとう")[0]).toMatchObject({ written: "ありがとう" });
    expect(wordsOf(words, "いぬ")[0]?.written).toBe("犬");
  });
});

describe("the words of a written form", () => {
  it("give the reading and the meaning: 紙 is かみ, paper", async () => {
    const words = await loadWords("紙");
    expect(wordsOf(words, "紙")[0]).toMatchObject({ written: "紙", reading: "かみ", meaning: "paper", common: true });
    expect(meaningOf(words, "紙")).toBe("paper");
  });

  it("find every reading of a form, the commonest word first", async () => {
    const words = await loadWords("神");
    const readings = wordsOf(words, "神").map((one) => one.reading);
    expect(readings[0]).toBe("かみ");
    expect(readings).toEqual(expect.arrayContaining(["しん", "じん", "かん"]));
  });

  it("reach a word the common table does not hold, and a reading with a middle dot", async () => {
    const words = await loadWords(["憂鬱症", "エア・メール"]);
    expect(meaningOf(words, "憂鬱症")).toMatch(/depress/i);
    expect(wordsOf(words, "エア・メール")[0]?.reading).toBe("エア・メール");
  });

  it("find a word by one of several written forms, and say which form was asked", async () => {
    const words = await loadWords(["年寄り", "年寄"]);
    expect(wordsOf(words, "年寄")[0]).toMatchObject({ written: "年寄", reading: "としより" });
    expect(wordsOf(words, "年寄り")[0]?.forms).toContain("年寄");
  });
});

describe("a word with no meaning", () => {
  it("is null, never a placeholder, and a text nobody wrote has no words", async () => {
    const words = await loadWords(["ぬぬぬぬぬ", "龘龘龘"]);
    expect(wordsOf(words, "ぬぬぬぬぬ")).toEqual([]);
    expect(meaningOf(words, "ぬぬぬぬぬ")).toBeNull();
    expect(meaningOf(words, "龘龘龘")).toBeNull();
  });

  it("refuses a text that was never loaded instead of saying there are no words", async () => {
    const words = await loadWords("かみ");
    expect(isLoaded(words, "かみ")).toBe(true);
    expect(isLoaded(words, "いぬ")).toBe(false);
    expect(() => wordsOf(words, "いぬ")).toThrow(/was not loaded/);
  });
});

describe("what is not for children", () => {
  it("is not there unless the host asks for it: ほもびでお has nothing fit to say, and asking for everything gives it back", async () => {
    const words = await loadWords("ほもびでお");
    expect(words.forChildren).toBe(true);
    expect(wordsOf(words, "ほもびでお")).toEqual([]);
    expect(meaningOf(words, "ほもびでお")).toBeNull();
    const adults = await loadWords("ほもびでお", { forChildren: false });
    expect(adults.forChildren).toBe(false);
    expect(wordsOf(adults, "ほもびでお")[0]?.meaning).toBe("gay porn video, gay pornographic video");
    expect(wordsOf(adults, "ホモビデオ")[0]?.reading).toBe("ホモビデオ");
  });

  it("is cut out of a word that has other senses, and the others stay", async () => {
    const words = await loadWords("いぬ");
    expect(wordsOf(words, "いぬ")[0]?.meaning).not.toMatch(/rat|squealer/);
    const adults = await loadWords("いぬ", { forChildren: false });
    expect(wordsOf(adults, "いぬ")[0]?.meaning).toMatch(/squealer/);
  });

  it("is cut from real words by every mark: vulgar, derogatory and sensitive senses go, the plain ones stay", async () => {
    const asked = [
      ["ハーモニカ", /cunnilingus/, "harmonica"],
      ["尺八", /fellatio|blow job/, "shakuhachi"],
      ["ピザ", /ugly/, "pizza"],
      ["外人", /Westerner|gaijin/, "outsider"],
    ] as const;
    const texts = [...asked.map(([text]) => text), "チンピラ", "ジプシー"];
    const words = await loadWords(texts);
    const adults = await loadWords(texts, { forChildren: false });
    const said = (from: typeof words, text: string) =>
      wordsOf(from, text)
        .map((one) => one.meaning)
        .join(" | ");
    for (const [text, unfit, kept] of asked) {
      expect(said(words, text), text).not.toMatch(unfit);
      expect(said(words, text), text).toContain(kept);
      expect(said(adults, text), text).toMatch(unfit);
      expect(said(adults, text), text).toContain(kept);
    }
    // Every sense of these is marked, so for children there is nothing to say and the answer is none.
    expect(wordsOf(words, "チンピラ")).toEqual([]);
    expect(wordsOf(words, "ジプシー")).toEqual([]);
    expect(said(adults, "チンピラ")).toMatch(/hoodlum/);
  });

  it("is cut from a written form's answer as well: 吐かす is a form of ぬかす only for the sense that is not for children", async () => {
    const words = await loadWords(["吐かす", "抜かす", "ぬかす"]);
    const adults = await loadWords(["吐かす", "ぬかす"], { forChildren: false });
    expect(wordsOf(words, "吐かす")).toEqual([]);
    expect(wordsOf(words, "抜かす")[0]).toMatchObject({ reading: "ぬかす", forms: ["抜かす"] });
    expect(wordsOf(words, "ぬかす")[0]?.forms).toEqual(["抜かす"]);
    expect(wordsOf(adults, "吐かす")[0]).toMatchObject({ reading: "ぬかす", written: "吐かす" });
    expect(wordsOf(adults, "ぬかす")[0]?.forms).toEqual(["抜かす", "吐かす"]);
  });

  it("is cut from the words with more than one reading, and a reading only such a sense applies to is not one of the word", async () => {
    const words = await loadWords(["そいつ", "そやつ"]);
    const adults = await loadWords(["そいつ", "そやつ"], { forChildren: false });
    expect(wordsOf(words, "そいつ").length).toBeGreaterThan(0);
    expect(wordsOf(words, "そやつ")).toEqual([]);
    expect(wordsOf(adults, "そやつ").length).toBeGreaterThan(0);
  });

  it("cannot be added to words for the other people, and has no sense of its own to be turned on in a lookup", async () => {
    const children = await loadWords("かみ");
    await expect(loadWords("いぬ", { forChildren: false, previous: children })).rejects.toThrow(
      /cannot be added together/,
    );
    const adults = await loadWords("かみ", { forChildren: false });
    await expect(loadWords("いぬ", { previous: adults, forChildren: true })).rejects.toThrow(
      /cannot be added together/,
    );
    expect(wordsOf(await loadWords("いぬ", { previous: adults }), "かみ")[0]?.written).toBe("紙");
  });

  it("is the same as it was in everything, for the words that have none of it", async () => {
    const [children, adults] = await Promise.all([loadWords("かみ"), loadWords("かみ", { forChildren: false })]);
    const asked = (words: typeof children) => wordsOf(words, "かみ").map((one) => [one.written, one.meaning]);
    expect(asked(adults)).toEqual(asked(children));
  });

  it("is a patch of the common words that makes every common word again, and asking for it takes the patch", async () => {
    const children = readCommonWords(COMMON_WORDS);
    expect(() => readCommonWords(COMMON_WORDS, { forChildren: false })).toThrow(/COMMON_EXTRA/);
    const adults = readCommonWords(COMMON_WORDS, { forChildren: false, extra: COMMON_EXTRA });
    expect(allWords(adults).length).toBeGreaterThan(allWords(children).length);
    expect(allWords(adults).length - allWords(children).length).toBeLessThan(100);
    expect(wordsOf(children, "ハーモニカ").map((one) => one.meaning)).toEqual([
      "harmonica, mouth organ; hypodermic syringe",
    ]);
    expect(wordsOf(adults, "ハーモニカ")[0]?.meaning).toMatch(/cunnilingus/);
    // A word with nothing in it for children is not among the common words for them, and is for everything.
    const loaded = await loadCommonWords({ forChildren: false });
    expect(allWords(loaded)).toEqual(allWords(adults));
    const fewer = allWords(children).map((one) => `${one.reading}${one.meaning}`);
    expect(new Set(fewer).size).toBeGreaterThan(20_000);
  });
});

describe("the common words", () => {
  it("are one table that answers a reading or a written form with no waiting", async () => {
    const words = await loadCommonWords();
    expect(words.scope).toBe("common");
    expect(
      wordsOf(words, "かみ")
        .slice(0, 3)
        .map((one) => one.written),
    ).toEqual(["紙", "神", "髪"]);
    expect(meaningOf(words, "紙")).toBe("paper");
    expect(wordsOf(words, "ぬぬぬぬぬ")).toEqual([]);
    expect(isLoaded(words, "anything")).toBe(true);
  });

  it("hold only what JMdict marks common, and every one of them is in the pieces too", async () => {
    expect(readCommonWords(COMMON_WORDS).entries.size).toBeGreaterThan(40_000);
    expect(COMMON_WORDS.rows.map(readRow).every((one) => one.common)).toBe(true);
    const all = await loadWords(["さくら", "さくら"]);
    expect(wordsOf(all, "さくら").some((one) => one.common)).toBe(true);
  });

  it("cannot be added to", async () => {
    await expect(loadWords("かみ", { previous: await loadCommonWords() })).rejects.toThrow(/nothing to add/);
  });
});

describe("loading in steps", () => {
  it("keeps what was loaded and adds to it, and does not touch the words it was given", async () => {
    const first = await loadWords("かみ");
    const second = await loadWords(["いぬ", "かみ"], { previous: first });
    expect(first.entries.has("いぬ")).toBe(false);
    expect(wordsOf(second, "いぬ").length).toBeGreaterThan(0);
    expect(wordsOf(second, "かみ")[0]?.written).toBe("紙");
    expect(second.forChildren).toBe(true);
  });
});

describe("the pieces", () => {
  const sets = [
    ["readings", MANIFEST.readings],
    ["forms", MANIFEST.forms],
  ] as const;

  it("start in order, the first at nothing, and have a loader each", () => {
    for (const [name, set] of sets) {
      expect(set.starts[0], name).toBe("");
      expect(set.load.length, name).toBe(set.starts.length);
      for (let at = 1; at < set.starts.length; at++)
        expect((set.starts[at - 1] ?? "") < (set.starts[at] ?? ""), `${name} ${at}`).toBe(true);
    }
    expect(MANIFEST.readings.starts.length).toBeGreaterThan(200);
  });

  it("hold every key inside its own start and the next piece's, and every row of the dictionary once", async () => {
    let rows = 0;
    for (const [name, set] of sets) {
      for (const [at, load] of set.load.entries()) {
        const piece = await load();
        const low = set.starts[at] ?? "";
        const high = set.starts[at + 1];
        for (const line of piece.rows) {
          const key =
            name === "readings" ? foldKana(line.slice(0, line.indexOf("\t"))) : line.slice(0, line.indexOf("\t"));
          expect(key >= low && (high === undefined || key < high), `${name} ${at} ${key}`).toBe(true);
        }
        if (name === "readings") rows += piece.rows.length;
        expect(new TextEncoder().encode(piece.rows.join("\n")).length, `${name} ${at}`).toBeLessThan(110_000);
      }
    }
    expect(rows).toBe(MANIFEST.rowCount);
  }, 60_000);

  it("say which JMdict they were made from", () => {
    expect(MANIFEST.release).toBe(COMMON_WORDS.release);
    expect(MANIFEST.release).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
