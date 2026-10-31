import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("the data's sources", () => {
  const notice = readFileSync("NOTICE.md", "utf8");

  it("are named with their terms, and each data file carries its own", () => {
    for (const name of ["KANJIDIC2", "Jonathan Waller", "tanos.co.uk", "Lars Yencken", "CC BY-SA 4.0", "CC BY 3.0"])
      expect(notice, name).toContain(name);
    expect(readFileSync("src/data/kanji.data.ts", "utf8").slice(0, 900)).toContain("Attribution-ShareAlike");
    expect(readFileSync("src/data/kanji.data.ts", "utf8").slice(0, 1200)).toContain("tanos.co.uk");
    expect(readFileSync("src/data/grades.data.ts", "utf8").slice(0, 700)).toContain("Attribution-ShareAlike");
    expect(readFileSync("src/data/jlpt.data.ts", "utf8").slice(0, 700)).toContain("tanos.co.uk");
    expect(readFileSync("src/data/look-alike.data.ts", "utf8").slice(0, 900)).toContain("Yencken");
  });

  it("never include a commercial study service", () => {
    const text = [
      "src/data/kanji.data.ts",
      "src/data/look-alike.data.ts",
      "README.md",
      "NOTICE.md",
      "scripts/build-data.mjs",
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(text.toLowerCase()).not.toContain(["wani", "kani"].join(""));
  });
});

describe("the README's numbers", () => {
  const readme = readFileSync("README.md", "utf8");

  it("are the data's, so that none is typed and left to drift", async () => {
    const { KANJI } = await import("./data/kanji.data.ts");
    const { LOOK_ALIKE } = await import("./data/look-alike.data.ts");
    const { JLPT } = await import("./data/jlpt.data.ts");
    const { GRADES } = await import("./data/grades.data.ts");
    const words = (n) => n.toLocaleString("en-US");
    expect(readme).toContain(`${words(KANJI.rows.length)} kanji`);
    expect(readme).toContain(`${words(LOOK_ALIKE.pairs.length)} pairs`);
    for (const [level, kanji] of Object.entries(JLPT.levels))
      expect(readme).toContain(`| ${level} | ${words([...kanji].length)} |`);
    for (const [grade, kanji] of Object.entries(GRADES.grades))
      expect(readme).toContain(`| ${grade} | ${words([...kanji].length)} |`);
    expect(readme).toContain(`KANJIDIC2 of ${GRADES.release}`);
  });
});
