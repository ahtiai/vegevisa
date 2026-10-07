import { readFile } from "node:fs/promises";
import { loadTarget, option } from "./environment";
import { restoreBackup, validateBackup } from "../src/lib/backup";
import { AppError } from "../src/lib/errors";
async function main() {
  const { target, apply } = loadTarget();
  const file = option("--file");
  if (!file) throw Error("Specify --file.");
  const data = JSON.parse(await readFile(file, "utf8"));
  const b = validateBackup(data);
  console.log({
    target,
    questions: b.questions.length,
    scores: b.scores.length,
    apply,
  });
  if (apply) await restoreBackup(data);
}
main().catch((e) => {
  console.error(
    e instanceof AppError
      ? e.message
      : "Restore failed. Check the file and empty database target.",
  );
  process.exitCode = 1;
});
