// The Reader view: paste Japanese, see it cut into words with their furigana, tap a word for its meaning, dictionary form, levels and kanji, and take
// the words away as a study list. The words are fetched in pieces about 25 kB gzipped, as the text needs them.
import { readText, studyList, studyListText } from "./dist/words.js";

export const READER_WORDS = {
  en: {
    viewReader: "Reader",
    readerLabel: "Text",
    readerPlaceholder: "Paste Japanese here",
    readerGo: "Read",
    readerTry: "Try",
    readerPrompt: "Paste a sentence or a few, and tap Read.",
    readerReading: "Reading {text}…",
    readerFailed: "Could not read the text. Try again.",
    readerCount: "{words} words, {unknown} not found.",
    readerCut: "Only the first {n} characters were read.",
    readerNone: "Nothing to read.",
    readerUnknown: "Not found: {list}",
    readerFrom: "from {form}: {path}",
    readerLevel: "JLPT",
    readerNoLevel: "no level",
    readerKanji: "Kanji",
    readerGrade: "grade {n}",
    readerNoGrade: "no grade",
    readerOthers: "Could also be",
    readerStudy: "Study list",
    readerKanjiOnly: "Leave out words with no kanji",
    readerCopy: "Copy",
    readerCopied: "Copied {n} words.",
    readerCopyFailed: "Could not copy. Use Download CSV.",
    readerCsv: "Download CSV",
    readerTimes: "×{n}",
    readerNoStudy: "No words to list.",
  },
  ja: {
    viewReader: "リーダー",
    readerLabel: "テキスト",
    readerPlaceholder: "ここに日本語を貼り付け",
    readerGo: "読む",
    readerTry: "例",
    readerPrompt: "文を貼り付けて「読む」を押してください。",
    readerReading: "「{text}」を読んでいます…",
    readerFailed: "テキストを読めませんでした。もう一度お試しください。",
    readerCount: "{words}語、見つからなかったもの{unknown}件。",
    readerCut: "最初の{n}文字だけを読みました。",
    readerNone: "読むものがありません。",
    readerUnknown: "見つからなかったもの：{list}",
    readerFrom: "{form}から：{path}",
    readerLevel: "JLPT",
    readerNoLevel: "レベルなし",
    readerKanji: "漢字",
    readerGrade: "{n}年",
    readerNoGrade: "学年なし",
    readerOthers: "ほかの候補",
    readerStudy: "学習リスト",
    readerKanjiOnly: "漢字のない語は除く",
    readerCopy: "コピー",
    readerCopied: "{n}語をコピーしました。",
    readerCopyFailed: "コピーできませんでした。CSVをダウンロードしてください。",
    readerCsv: "CSVをダウンロード",
    readerTimes: "×{n}",
    readerNoStudy: "リストにする語がありません。",
  },
};

/** The kanji pieces carry their reading above them; the kana pieces are text. */
function ruby(parts) {
  const holder = document.createDocumentFragment();
  for (const part of parts) {
    if (part.reading === undefined) holder.append(part.text);
    else {
      const el = document.createElement("ruby");
      el.append(part.text);
      const rt = document.createElement("rt");
      rt.textContent = part.reading;
      el.append(rt);
      holder.append(el);
    }
  }
  return holder;
}

export function createReader({ t, state, pathText, writeAddress }) {
  const $ = (id) => document.getElementById(id);
  let result = null;
  let chosen = 0;
  let pending = null;
  let failed = false;
  let asking = 0;
  let kanjiOnly = false;
  let copied = "";

  async function read(text) {
    state.text = text;
    const ask = ++asking;
    result = null;
    failed = false;
    pending = text.trim() === "" ? null : text.trim().slice(0, 20);
    chosen = 0;
    copied = "";
    draw();
    if (text.trim() === "") return;
    try {
      const done = await readText(text, { mode: state.mode });
      if (ask === asking) result = done;
    } catch {
      if (ask === asking) failed = true;
    }
    if (ask !== asking) return;
    pending = null;
    chosen = Math.max(
      0,
      result?.tokens.findIndex((token) => token.kind === "word"),
    );
    draw();
  }

  function fact(list, term, value) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    if (typeof value === "string") dd.textContent = value;
    else dd.append(value);
    list.append(dt, dd);
  }

  function drawCard() {
    const card = $("reader-card");
    const token = result?.tokens[chosen];
    if (token === undefined || token.kind !== "word") {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const big = document.createElement("p");
    big.className = "jisho-big";
    big.lang = "ja";
    big.append(ruby(token.furigana));
    const facts = document.createElement("dl");
    fact(facts, token.word.written, token.meaning);
    if (token.path.length > 0)
      fact(facts, "→", t("readerFrom", { form: token.word.written, path: pathText(token.path) }));
    fact(facts, t("readerLevel"), token.level ?? t("readerNoLevel"));
    if (token.kanji.length > 0) {
      const row = document.createElement("p");
      row.className = "jisho-token-kanji";
      row.lang = "ja";
      row.textContent = token.kanji
        .map(
          (one) =>
            `${one.kanji} ${one.grade === null ? t("readerNoGrade") : t("readerGrade", { n: one.grade })}${one.level === null ? "" : ` ${one.level}`}`,
        )
        .join("  ");
      fact(facts, t("readerKanji"), row);
    }
    if (token.alternatives.length > 0) {
      const row = document.createElement("p");
      row.lang = "ja";
      row.textContent = token.alternatives
        .map((one) => `${one.word.written}（${one.word.reading}）${one.word.meaning.split(";")[0]}`)
        .join(" / ");
      fact(facts, t("readerOthers"), row);
    }
    card.replaceChildren(big, facts);
  }

  function drawStudy() {
    const rows = result === null ? [] : studyList(result, { kanjiOnly });
    const list = $("reader-study");
    list.replaceChildren(
      ...rows.map((row) => {
        const li = document.createElement("li");
        li.dataset.testid = "study-item";
        const written = document.createElement("p");
        written.className = "jisho-written";
        written.lang = "ja";
        written.textContent = row.written;
        const reading = document.createElement("p");
        reading.className = "jisho-reading";
        reading.lang = "ja";
        reading.textContent = row.written === row.reading ? "" : row.reading;
        const meaning = document.createElement("p");
        meaning.lang = "en";
        meaning.textContent = row.meaning;
        const tags = document.createElement("p");
        tags.className = "jisho-marks";
        tags.textContent = [
          row.level ?? "",
          row.grade === null ? "" : t("readerGrade", { n: row.grade }),
          row.count > 1 ? t("readerTimes", { n: row.count }) : "",
        ]
          .filter(Boolean)
          .join(" · ");
        li.append(written, reading, meaning, tags);
        return li;
      }),
    );
    $("reader-study-count").textContent = rows.length === 0 ? t("readerNoStudy") : "";
    for (const id of ["reader-copy", "reader-csv"]) $(id).disabled = rows.length === 0;
    $("reader-copied").textContent = copied;
    return rows;
  }

  function draw() {
    $("reader-text").value = state.text;
    $("reader-text").lang = "ja";
    const out = $("reader-out");
    const count = $("reader-count");
    if (pending !== null) {
      count.textContent = t("readerReading", { text: pending });
      out.replaceChildren();
    } else if (failed) {
      count.textContent = t("readerFailed");
      out.replaceChildren();
    } else if (result === null) {
      count.textContent = t("readerPrompt");
      out.replaceChildren();
    } else if (result.tokens.length === 0) {
      count.textContent = t("readerNone");
      out.replaceChildren();
    } else {
      const words = result.tokens.filter((token) => token.kind === "word").length;
      count.textContent =
        t("readerCount", { words, unknown: result.unknown.length }) +
        (result.truncated ? ` ${t("readerCut", { n: result.text.length })}` : "");
      out.lang = "ja";
      out.replaceChildren(
        ...result.tokens.map((token, at) => {
          if (token.kind === "word") {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "jisho-token";
            button.dataset.testid = "token";
            button.setAttribute("aria-pressed", String(at === chosen));
            button.append(ruby(token.furigana));
            button.addEventListener("click", () => {
              chosen = at;
              draw();
            });
            return button;
          }
          const span = document.createElement("span");
          span.className = token.kind === "unknown" ? "jisho-unknown" : "jisho-other";
          if (token.kind === "unknown") span.dataset.testid = "unknown";
          span.textContent = token.text;
          return span;
        }),
      );
    }
    $("reader-unknown").textContent =
      result === null || result.unknown.length === 0 ? "" : t("readerUnknown", { list: result.unknown.join("、") });
    $("reader-unknown").hidden = $("reader-unknown").textContent === "";
    drawCard();
    drawStudy();
    $("reader-kanji-only").setAttribute("aria-pressed", String(kanjiOnly));
    writeAddress();
  }

  const examples = $("reader-examples");
  ["昨日、友達と学校に行きました。", "今日はいい天気ですね。毎日日本語を勉強しています。"].forEach((text) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.lang = "ja";
    button.addEventListener("click", () => void read(text));
    examples.append(button);
  });

  $("reader-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void read($("reader-text").value);
  });
  $("reader-kanji-only").addEventListener("click", () => {
    kanjiOnly = !kanjiOnly;
    $("reader-kanji-only").setAttribute("aria-pressed", String(kanjiOnly));
    drawStudy();
  });
  $("reader-copy").addEventListener("click", async () => {
    const rows = studyList(result, { kanjiOnly });
    try {
      await navigator.clipboard.writeText(studyListText(rows, "tsv"));
      copied = t("readerCopied", { n: rows.length });
    } catch {
      copied = t("readerCopyFailed");
    }
    $("reader-copied").textContent = copied;
  });
  $("reader-csv").addEventListener("click", () => {
    const csv = studyListText(studyList(result, { kanjiOnly }), "csv");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = "jisho-study-list.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  return { draw, read };
}
