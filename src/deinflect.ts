/**
 * Deinflection: the dictionary forms a conjugated word could come from, and the path from there to it. 食べなかった is the
 * negative and then the past of 食べる. A rule table of a few hundred endings (written out from a few dozen templates) does the
 * walking, in no data and no network: it only proposes. Which proposals are real is for the dictionary to say, by the kind of
 * word each would have to be (see `kinds` of a `Word`), and `findInflected` and `inflectedOf` ask it.
 *
 * Covered: godan and ichidan verbs, する (and a noun with する, 勉強した) and 来る (in kanji and kana), い adjectives, and な
 * adjectives with だ, です and ではない; in the polite, negative, past, te, conditional, volitional, potential, passive,
 * causative and causative-passive forms, with want-to (たい), looks-like (そう), too-much (すぎる), easy-to and hard-to, while
 * (ながら) and the commonest verbs a te-form leads (ている, てしまう, ておく, てみる, ていく, てくる, てくれる, てあげる, てもらう),
 * and chains of all of them. Not covered: the imperative, keigo verbs, 〜ず, 〜なければならない and nouns with だ.
 */

/**
 * The kind of word a dictionary form must be, as the letters of a `Word`'s `kinds`: g godan, i ichidan, a i-adjective, n
 * na-adjective, s suru, k kuru.
 *
 * @example
 * ```ts
 * import type { DeinflectKind } from "@johnmorrisdotca/jisho/deinflect";
 *
 * const kind: DeinflectKind = "i";
 * console.log(kind);
 * ```
 */
export type DeinflectKind = "g" | "i" | "a" | "n" | "s" | "k";

/**
 * One way a written word could be a conjugated dictionary word.
 *
 * @example
 * ```ts
 * import type { Deinflection } from "@johnmorrisdotca/jisho/deinflect";
 *
 * const one: Deinflection = { base: "食べる", kind: "i", path: ["negative", "past"] };
 * console.log(one.path.join(", "));
 * ```
 */
export type Deinflection = {
  /** The dictionary form it would come from. */
  readonly base: string;
  /** The kind of word the base would have to be. */
  readonly kind: DeinflectKind;
  /** What was done to the base to make the word, innermost first: 食べなかった is `["negative", "past"]`. */
  readonly path: readonly string[];
};

/** A state is the kind of word a form stands for: a letter of `DeinflectKind`, `t` for a te-form that waits for its helper verb, or empty at the start. */
type Rule = {
  readonly from: string;
  readonly to: string;
  readonly path: readonly string[];
  readonly needs: string;
  readonly gives: string;
  readonly only: RegExp | undefined;
};

/** A template: an ending, the labels it adds (apart by commas), and the states it may follow (the word it makes is itself of that kind). */
type Template = readonly [ending: string, labels: string, needs?: string];

const MAX_STEPS = 6;

const rule = (from: string, to: string, [, labels, needs = ""]: Template, gives: string, only?: RegExp): Rule => ({
  from,
  to,
  path: labels.split(","),
  needs,
  gives,
  only,
});

/** The endings that follow a verb's stem (食べ-, 書き-). */
const STEM: readonly Template[] = [
  ["ます", "polite"],
  ["ました", "polite,past"],
  ["ません", "polite,negative"],
  ["ませんでした", "polite,negative,past"],
  ["ましょう", "polite,volitional"],
  ["まして", "polite,te"],
  ["たい", "want to", "a"],
  ["そう", "looks like"],
  ["すぎる", "too much", "i"],
  ["やすい", "easy to", "a"],
  ["にくい", "hard to", "a"],
  ["ながら", "while"],
  ["なさい", "polite command"],
];

/** The te-form of a verb leads a helper verb, which itself conjugates: 食べていた is 食べて + いる, past. */
const HELPERS: readonly [ending: string, to: string, labels: string, needs: string][] = [
  ["ている", "て", "continuous", "i"],
  ["てる", "て", "continuous", "i"],
  ["でいる", "で", "continuous", "i"],
  ["でる", "で", "continuous", "i"],
  ["てしまう", "て", "completed", "g"],
  ["ちゃう", "て", "completed", "g"],
  ["でしまう", "で", "completed", "g"],
  ["じゃう", "で", "completed", "g"],
  ["ておく", "て", "prepared", "g"],
  ["とく", "て", "prepared", "g"],
  ["でおく", "で", "prepared", "g"],
  ["どく", "で", "prepared", "g"],
  ["てみる", "て", "try", "i"],
  ["でみる", "で", "try", "i"],
  ["ていく", "て", "go on", "g"],
  ["でいく", "で", "go on", "g"],
  ["てくる", "て", "come", "k"],
  ["でくる", "で", "come", "k"],
  ["てくれる", "て", "given to me", "i"],
  ["でくれる", "で", "given to me", "i"],
  ["てあげる", "て", "given to another", "i"],
  ["であげる", "で", "given to another", "i"],
  ["てもらう", "て", "received", "g"],
  ["でもらう", "で", "received", "g"],
  ["てください", "て", "request", ""],
  ["でください", "で", "request", ""],
];

/** What a verb's forms are, for the endings that differ from one kind to the next. */
type Verb = {
  /** The dictionary form's ending, which the rules put back. */
  to: string;
  /** What the stem takes before ます, たい and the rest. */
  i: string;
  /** What it takes before ない. */
  a: string;
  /** The passive, causative and causative-passive endings, and the potential. */
  voices: readonly Template[];
  /** The conditional (ば), volitional, te and past endings. */
  ba: string;
  volitional: string;
  te: string;
  ta: string;
};

const NEGATIVE: Template = ["ない", "negative", "a"];

function verbRules(verb: Verb, gives: string, only?: RegExp): Rule[] {
  const make = (from: string, to: string, template: Template) => rule(from, to, template, gives, only);
  return [
    ...STEM.map((template) => make(verb.i + template[0], verb.to, template)),
    make(verb.a + NEGATIVE[0], verb.to, NEGATIVE),
    ...verb.voices.map((template) => make(template[0], verb.to, template)),
    make(verb.ba, verb.to, ["", "ba-conditional"]),
    make(verb.volitional, verb.to, ["", "volitional"]),
    make(verb.te, verb.to, ["", "te", "t"]),
    make(verb.ta, verb.to, ["", "past"]),
    make(`${verb.ta}ら`, verb.to, ["", "tara-conditional"]),
    make(`${verb.ta}り`, verb.to, ["", "tari"]),
  ];
}

/** Each godan ending with the kana of its rows: the dictionary form, the い, あ, え and お rows, and the te and past endings. */
const GODAN = [
  ["う", "い", "わ", "え", "お", "って", "った"],
  ["く", "き", "か", "け", "こ", "いて", "いた"],
  ["ぐ", "ぎ", "が", "げ", "ご", "いで", "いだ"],
  ["す", "し", "さ", "せ", "そ", "して", "した"],
  ["つ", "ち", "た", "て", "と", "って", "った"],
  ["ぬ", "に", "な", "ね", "の", "んで", "んだ"],
  ["ぶ", "び", "ば", "べ", "ぼ", "んで", "んだ"],
  ["む", "み", "ま", "め", "も", "んで", "んだ"],
  ["る", "り", "ら", "れ", "ろ", "って", "った"],
] as const;

/** An ichidan stem ends in an え or い row kana, or in a kanji: this keeps 取る and 帰る from being read as 取れる's and 帰れる's ichidan kin. */
const ICHIDAN_STEM =
  /[㐀-鿿々いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれイキギシジチヂニヒビピミリエケゲセゼテデネヘベペメレ]る$/;
/** 行く is the one godan verb whose te and past endings are not its row's. */
const IKU = /[行い]く$/;
/** The kana of 来る, only where no kanji comes before it (持ってきた), because after a kanji 行きます is 行く and never 行くる. */
const KANA_KURU = /(?:^|[^㐀-鿿々])くる$/;

const godanRules = GODAN.flatMap(([to, i, a, e, o, te, ta]) =>
  verbRules(
    {
      to,
      i,
      a,
      voices: [
        [`${a}れる`, "passive", "i"],
        [`${a}せる`, "causative", "i"],
        [`${a}せられる`, "causative,passive", "i"],
        [`${a}される`, "causative,passive", "i"],
        [`${e}る`, "potential", "i"],
      ],
      ba: `${e}ば`,
      volitional: `${o}う`,
      te,
      ta,
    },
    "g",
  ),
);

const ichidanRules = verbRules(
  {
    to: "る",
    i: "",
    a: "",
    voices: [
      ["られる", "potential or passive", "i"],
      ["れる", "potential", "i"],
      ["させる", "causative", "i"],
      ["させられる", "causative,passive", "i"],
    ],
    ba: "れば",
    volitional: "よう",
    te: "て",
    ta: "た",
  },
  "i",
  ICHIDAN_STEM,
);

/** する, as the verb itself (愛した is 愛する) and as the noun that takes it (勉強した is 勉強). */
const SURU: Verb = {
  to: "する",
  i: "し",
  a: "し",
  voices: [
    ["される", "passive", "i"],
    ["させる", "causative", "i"],
    ["させられる", "causative,passive", "i"],
  ],
  ba: "すれば",
  volitional: "しよう",
  te: "して",
  ta: "した",
};
const suruRules = [...verbRules(SURU, "s"), ...verbRules({ ...SURU, to: "" }, "s")];

/** 来る in kanji (来ない) and in kana (こない, 持ってきた). */
const KURU: readonly [Verb, RegExp | undefined][] = [
  [
    {
      to: "来る",
      i: "来",
      a: "来",
      voices: [
        ["来られる", "potential or passive", "i"],
        ["来させる", "causative", "i"],
        ["来させられる", "causative,passive", "i"],
      ],
      ba: "来れば",
      volitional: "来よう",
      te: "来て",
      ta: "来た",
    },
    undefined,
  ],
  [
    {
      to: "くる",
      i: "き",
      a: "こ",
      voices: [
        ["こられる", "potential or passive", "i"],
        ["こさせる", "causative", "i"],
        ["こさせられる", "causative,passive", "i"],
      ],
      ba: "くれば",
      volitional: "こよう",
      te: "きて",
      ta: "きた",
    },
    KANA_KURU,
  ],
];
const kuruRules = KURU.flatMap(([verb, only]) => verbRules(verb, "k", only));

/** The i-adjective, whose endings follow the stem (高-). */
const adjectiveRules: Rule[] = (
  [
    ["かった", "past"],
    ["かったら", "tara-conditional"],
    ["かったり", "tari"],
    ["くない", "negative", "a"],
    ["くて", "te"],
    ["く", "adverbial"],
    ["ければ", "ba-conditional"],
    ["そう", "looks like"],
    ["すぎる", "too much", "i"],
    ["いです", "polite"],
    ["かったです", "past,polite"],
    ["くないです", "negative,polite"],
    ["くありません", "negative,polite"],
    ["くありませんでした", "negative,past,polite"],
  ] as readonly Template[]
)
  .map((template) => rule(template[0], "い", template, "a"))
  .concat([rule("なさそう", "ない", ["", "looks like"], "a")]);

/** The na-adjective, which takes the copula and does not conjugate itself (静かだった). */
const naRules: Rule[] = (
  [
    ["だ", "plain"],
    ["です", "polite"],
    ["だった", "past"],
    ["でした", "polite,past"],
    ["だったら", "tara-conditional"],
    ["ではない", "negative"],
    ["じゃない", "negative"],
    ["ではなかった", "negative,past"],
    ["じゃなかった", "negative,past"],
    ["ではありません", "polite,negative"],
    ["じゃありません", "polite,negative"],
    ["ではありませんでした", "polite,negative,past"],
    ["じゃありませんでした", "polite,negative,past"],
  ] as readonly Template[]
).map((template) => rule(template[0], "", template, "n"));

const helperRules: Rule[] = HELPERS.map(([ending, to, labels, needs]) => rule(ending, to, ["", labels, needs], "t"));

/** 行く: って and った are its te and past endings, where the く row has いて and いた. */
const ikuRules: Rule[] = (
  [
    ["って", "te", "t"],
    ["った", "past"],
    ["ったら", "tara-conditional"],
    ["ったり", "tari"],
  ] as readonly Template[]
).map((template) => rule(template[0], "く", template, "g", IKU));

const RULES: readonly Rule[] = [
  ...godanRules,
  ...ichidanRules,
  ...adjectiveRules,
  ...suruRules,
  ...kuruRules,
  ...naRules,
  ...helperRules,
  ...ikuRules,
];

const BY_LAST = new Map<string, Rule[]>();
for (const one of RULES) {
  const last = one.from.slice(-1);
  BY_LAST.set(last, [...(BY_LAST.get(last) ?? []), one]);
}

type State = { readonly text: string; readonly type: string; readonly path: readonly string[] };

/**
 * The dictionary forms a written word could be conjugated from, with the path from each to the word: the endings are taken off one
 * at a time, outermost first, as a learner does, so 食べなかった is the past of 食べない, which is the negative of 食べる. This
 * only proposes, from endings alone, so it also proposes forms that are no word (食べなかう); the dictionary says which are real,
 * by the kind of word each must be. `findInflected` and `inflectedOf` ask it. A form is proposed once, by the shortest path that
 * reaches it. Nothing here fetches, and it never throws.
 *
 * @param text - A written word, made plain (`normalizeText`): kana, or kana and kanji.
 * @returns The proposals, shortest path first, none for a word no ending fits.
 * @example
 * ```ts
 * import { deinflect } from "@johnmorrisdotca/jisho/deinflect";
 *
 * console.log(deinflect("食べなかった").filter((one) => one.base === "食べる")); // [{ base: "食べる", kind: "i", path: ["negative", "past"] }]
 * ```
 */
export function deinflect(text: string): Deinflection[] {
  if (typeof text !== "string" || text === "") return [];
  const found: Deinflection[] = [];
  const seen = new Set<string>([`${text}\0`]);
  let frontier: State[] = [{ text, type: "", path: [] }];
  for (let step = 0; step < MAX_STEPS && frontier.length > 0; step++) {
    const next: State[] = [];
    for (const state of frontier) {
      for (const one of BY_LAST.get(state.text.slice(-1)) ?? []) {
        if (!state.text.endsWith(one.from) || (state.type !== "" && !one.needs.includes(state.type))) continue;
        const base = state.text.slice(0, state.text.length - one.from.length) + one.to;
        const key = `${base}\0${one.gives}`;
        if (base.length < (one.to === "" ? 1 : 2) || seen.has(key) || (one.only !== undefined && !one.only.test(base)))
          continue;
        seen.add(key);
        const path = [...one.path, ...state.path];
        next.push({ text: base, type: one.gives, path });
        if (one.gives !== "t") found.push({ base, kind: one.gives as DeinflectKind, path });
      }
    }
    frontier = next;
  }
  return found;
}
