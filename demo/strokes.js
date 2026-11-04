// Stroke order and drawing, for the demo: the strokes of the kanji on the card written out one after the other, and a pad to draw a kanji on,
// which finds the kanji whose strokes are nearest. The strokes are KanjiVG's, fetched in pieces of about 20 kB gzipped (all of them, 1.1 MB, only
// when someone draws).
import { findByDrawing, loadAllStrokes, loadStrokes, strokeOrderSvg, strokesOf } from "./dist/strokes.js";

export const STROKE_WORDS = {
  en: {
    strokeTitle: "Stroke order",
    strokeReplay: "Replay",
    strokeNumbers: "Numbers",
    strokeLoading: "Loading the strokes…",
    strokeNone: "No stroke order for this kanji.",
    strokeFailed: "Could not load the strokes.",
    strokeLabel: "The strokes of {kanji}, in order",
    drawLabel: "Draw a kanji",
    drawHide: "Close the pad",
    drawHint:
      "Draw the strokes one after the other, in the order you would write them. The kanji that look most like them appear below.",
    drawPad: "Drawing pad: draw a kanji with a finger or the mouse",
    drawUndo: "Undo a stroke",
    drawClear: "Clear",
    drawLoading: "Loading the strokes of every kanji…",
    drawFailed: "Could not load the strokes. Try again.",
    drawNone: "Nothing like it. Draw it again, with every stroke, in order.",
    drawPick: "Open the kanji {kanji}",
  },
  ja: {
    strokeTitle: "筆順",
    strokeReplay: "もう一度",
    strokeNumbers: "番号",
    strokeLoading: "筆順を読み込んでいます…",
    strokeNone: "この漢字の筆順はありません。",
    strokeFailed: "筆順を読み込めませんでした。",
    strokeLabel: "{kanji}の筆順",
    drawLabel: "漢字を描いて探す",
    drawHide: "描く欄を閉じる",
    drawHint: "書く順番に、1画ずつ描いてください。形のいちばん近い漢字が下に出ます。",
    drawPad: "描く欄：指かマウスで漢字を描きます",
    drawUndo: "1画戻す",
    drawClear: "消す",
    drawLoading: "すべての漢字の筆順を読み込んでいます…",
    drawFailed: "筆順を読み込めませんでした。もう一度お試しください。",
    drawNone: "近いものがありません。すべての画を、順番どおりに描き直してください。",
    drawPick: "漢字{kanji}を開く",
  },
};

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/** The stroke order of one kanji in a box: it fetches the piece the kanji is in, and draws the strokes writing themselves. */
export function strokeOrderBox({ t, kanji }) {
  const box = make("section", "jisho-strokes");
  box.dataset.testid = "strokes";
  const title = make("h3", "jisho-strokes-title", t("strokeTitle"));
  const picture = make("div", "jisho-strokes-picture");
  picture.dataset.testid = "strokes-picture";
  picture.append(make("p", "fam-muted", t("strokeLoading")));
  const replay = make("button", "jisho-entry-button", t("strokeReplay"));
  replay.type = "button";
  replay.dataset.testid = "strokes-replay";
  replay.hidden = true;
  const numbers = make("button", "jisho-entry-button", t("strokeNumbers"));
  numbers.type = "button";
  numbers.dataset.testid = "strokes-numbers";
  numbers.setAttribute("aria-pressed", "false");
  numbers.hidden = true;
  const controls = make("div", "jisho-strokes-controls");
  controls.append(replay, numbers);
  box.append(title, picture, controls);
  let paths = [];
  let withNumbers = false;
  const show = () => {
    picture.innerHTML = strokeOrderSvg(paths, {
      size: 140,
      numbers: withNumbers,
      label: t("strokeLabel", { kanji }),
    });
  };
  replay.addEventListener("click", show);
  numbers.addEventListener("click", () => {
    withNumbers = !withNumbers;
    numbers.setAttribute("aria-pressed", String(withNumbers));
    show();
  });
  loadStrokes(kanji).then(
    (table) => {
      paths = strokesOf(table, kanji);
      if (paths.length === 0) {
        picture.replaceChildren(make("p", "fam-muted", t("strokeNone")));
        return;
      }
      replay.hidden = false;
      numbers.hidden = false;
      show();
    },
    () => picture.replaceChildren(make("p", "fam-muted", t("strokeFailed"))),
  );
  return box;
}

/** The drawing pad: a canvas to draw on with a finger or the mouse, and the kanji nearest to the strokes drawn. */
export function createDrawPad({ t, known, onPick }) {
  const pad = document.getElementById("draw-pad");
  const canvas = document.getElementById("draw-canvas");
  const status = document.getElementById("draw-status");
  const results = document.getElementById("draw-results");
  const context = canvas.getContext("2d");
  const strokes = [];
  let current = null;
  let table = null;
  let loading = null;

  const size = () => canvas.getBoundingClientRect().width || 260;
  const resize = () => {
    const side = size();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(side * ratio);
    canvas.height = Math.round(side * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    redraw();
  };
  const redraw = () => {
    const side = size();
    context.clearRect(0, 0, side, side);
    const style = getComputedStyle(canvas);
    context.strokeStyle = style.color;
    context.lineWidth = 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of strokes) {
      context.beginPath();
      for (const [at, [x, y]] of stroke.entries()) {
        if (at === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      if (stroke.length === 1) context.lineTo(stroke[0][0] + 0.1, stroke[0][1]);
      context.stroke();
    }
  };

  const find = async () => {
    results.replaceChildren();
    if (strokes.length === 0) {
      status.textContent = t("drawHint");
      return;
    }
    if (table === null) {
      status.textContent = t("drawLoading");
      loading ??= loadAllStrokes();
      try {
        table = await loading;
      } catch {
        loading = null;
        status.textContent = t("drawFailed");
        return;
      }
    }
    const found = findByDrawing(table, strokes, { limit: 16 }).filter((one) => known.has(one.kanji));
    status.textContent = found.length === 0 ? t("drawNone") : "";
    results.replaceChildren(
      ...found.map((one) => {
        const button = make("button", "", one.kanji);
        button.type = "button";
        button.lang = "ja";
        button.dataset.testid = "draw-result";
        button.setAttribute("aria-label", t("drawPick", { kanji: one.kanji }));
        button.addEventListener("click", () => onPick(one.kanji));
        return button;
      }),
    );
  };

  const point = (event) => {
    const box = canvas.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top];
  };
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    current = [point(event)];
    strokes.push(current);
    redraw();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (current === null) return;
    current.push(point(event));
    redraw();
  });
  const end = () => {
    if (current === null) return;
    current = null;
    void find();
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  document.getElementById("draw-undo").addEventListener("click", () => {
    strokes.pop();
    redraw();
    void find();
  });
  document.getElementById("draw-clear").addEventListener("click", () => {
    strokes.length = 0;
    redraw();
    void find();
  });
  window.addEventListener("resize", resize);

  return {
    open() {
      const wasHidden = pad.hidden;
      pad.hidden = false;
      resize();
      if (wasHidden) pad.scrollIntoView({ block: "nearest" });
      status.textContent = t("drawHint");
    },
    close() {
      pad.hidden = true;
    },
    /** Words that depend on the language: set again after a switch of language. */
    draw() {
      canvas.setAttribute("aria-label", t("drawPad"));
      if (strokes.length === 0 && !pad.hidden) status.textContent = t("drawHint");
      document.getElementById("draw-undo").textContent = t("drawUndo");
      document.getElementById("draw-clear").textContent = t("drawClear");
    },
  };
}
