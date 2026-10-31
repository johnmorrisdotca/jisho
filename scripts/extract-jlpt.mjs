// Reads the five kanji pages of Jonathan Waller's JLPT Resources, as saved HTML, into the plain lists in data-sources/jlpt/.
// Run only when a list is taken again: the lists in the repository are what the build reads, so that the build needs no
// network for them. Each row of a page's table starts with its kanji; the order on the page is kept.
//
//   node scripts/extract-jlpt.mjs <folder holding n1.html … n5.html>
//
// Waller's site says everything on it that he is not selling is under Creative Commons "BY", and asks for a credit:
// http://www.tanos.co.uk/jlpt/sharing/. data-sources/sources.json says which copy of each page was read.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const folder = process.argv[2];
if (folder === undefined) {
  console.error("Usage: node scripts/extract-jlpt.mjs <folder holding n1.html … n5.html>");
  process.exit(1);
}
for (const level of [1, 2, 3, 4, 5]) {
  const html = readFileSync(join(folder, `n${level}.html`), "utf8");
  const kanji = [...html.matchAll(/<tr><td><a class="nounderline"[^>]*>\s*(\S+)\s*<\/a><\/td><td>/g)].map(
    (match) => match[1],
  );
  const odd = kanji.filter((one) => [...one].length !== 1);
  if (odd.length > 0) throw new Error(`N${level}: rows that are not one character: ${odd.join(" ")}`);
  writeFileSync(`data-sources/jlpt/n${level}.txt`, `${kanji.join("")}\n`);
  console.log(`N${level}: ${kanji.length} kanji, page SHA-256 ${createHash("sha256").update(html).digest("hex")}`);
}
