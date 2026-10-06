import { readFile } from "node:fs/promises";
import { loadTarget, option } from "./environment";
import { parseQuestionCSV } from "../src/lib/question-import";
import { importQuestions } from "../src/lib/quiz-store";
import { AppError } from "../src/lib/errors";
async function main() {
  const { target, apply } = loadTarget();
  const file = option("--file");
  if (!file) throw Error("Specify --file with a CSV export.");
  const questions = parseQuestionCSV(await readFile(file, "utf8"));
  console.log({
    target,
    questions: questions.length,
    active: questions.filter((q) => q.active).length,
    apply,
  });
  if (apply) await importQuestions(questions);
}
main().catch((e) => {
  console.error(
    e instanceof AppError
      ? e.message
      : "Import failed. Check the file and database target.",
  );
  process.exitCode = 1;
});
