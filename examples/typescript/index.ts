import { gradeOf, type JlptLevel, levelOf, type SchoolGrade } from "@johnmorrisdotca/jisho";
import { GRADES } from "@johnmorrisdotca/jisho/grades";
import { JLPT } from "@johnmorrisdotca/jisho/jlpt";
import { loadWords, type Word, type WordsMode, wordsOf } from "@johnmorrisdotca/jisho/words";

const mode: WordsMode = "safe";
const words = await loadWords("かみ", { mode });
const first: Word | undefined = wordsOf(words, "かみ")[0];
const grade: SchoolGrade | null = gradeOf(GRADES, "語");
const level: JlptLevel | null = levelOf(JLPT, "語");
console.log(first?.written, grade, level);

export function refused(): void {
  // @ts-expect-error "careful" is not a mode
  void loadWords("かみ", { mode: "careful" });
}
