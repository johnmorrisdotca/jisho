/**
 * The whole entry of a word, in an entry point of its own so that a page that looks words up never carries it. Fetched in pieces,
 * one for an entry, when `loadEntry` is called.
 */
export type {
  Entry,
  EntryForm,
  EntryGloss,
  EntryManifest,
  EntryReading,
  EntrySense,
  LoanSource,
  Reference,
} from "./words.types.ts";
export { loadEntry, readEntry, referenceOf } from "./words-entry.ts";
