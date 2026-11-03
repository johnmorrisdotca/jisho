import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** The README's Architecture tree names every source file, and nothing that is not one, so it cannot fall behind the code. */
describe("the preserved architecture guide", () => {
  it("names exactly the files under src/", () => {
    const readme = readFileSync("README.md", "utf8");
    expect(readme).toContain("docs/guides/architecture.md");
    const guide = readFileSync("docs/guides/architecture.md", "utf8");
    const section = guide.slice(guide.indexOf("## Architecture"));
    const tree = section.slice(section.indexOf("```text"), section.indexOf("```", section.indexOf("```text") + 7));
    const piece = /^x?[rfmk]\d+\.data\.ts$/;
    const named = [...tree.matchAll(/[├└]── ([\w.-]+\.ts)\b/g)]
      .map((match) => match[1])
      .filter((name) => !piece.test(name))
      .sort();
    // The pieces of the words are written by scripts/build-words.mjs, hundreds of them: the guide names the two that are not
    // pieces and says what the rest are, and the test holds it to that.
    expect(guide).toContain("r000.data.ts");
    expect(guide).toContain("f00.data.ts");
    expect(guide).toContain("xr0.data.ts");
    expect(guide).toContain("m000.data.ts");
    expect(guide).toContain("k00.data.ts");
    const files = readdirSync("src", { recursive: true })
      .filter(
        (path) =>
          path.endsWith(".ts") && !/\.(test|fixture)\./.test(path) && !/(^|[\\/])x?[rfmk]\d+\.data\.ts$/.test(path),
      )
      .map((path) => path.split(/[\\/]/).at(-1))
      .sort();
    expect(named).toEqual(files);
  });
});
