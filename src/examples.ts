/**
 * The example sentences of a word, in an entry point of their own so that a page that looks words up never carries them. Fetched in pieces,
 * one for a word, when `loadExamples` is called.
 */
export type { FuriganaPart } from "./furigana.ts";
export type { Example, ExampleCredit } from "./words.types.ts";
export { exampleCredit, furiganaOfExample, loadExamples, readExamples } from "./words-examples.ts";
