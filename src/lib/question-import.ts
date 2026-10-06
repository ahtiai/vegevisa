import { AppError } from "./errors";
import { validateQuestion } from "./quiz-store";
import type { Question } from "./quiz-types";
export function parseQuestionCSV(csv: string): Question[] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && csv[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new AppError(400, "CSV: sulkematon lainaus.");
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  const headers =
    rows.shift()?.map((h) =>
      h
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase(),
    ) ?? [];
  for (const h of [
    "id",
    "question",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct",
    "active",
  ])
    if (!headers.includes(h))
      throw new AppError(400, `CSV: sarake ${h} puuttuu.`);
  const ids = new Set<string>();
  return rows.map((r, i) => {
    try {
      const q = Object.fromEntries(
        headers.map((h, j) => [h, (r[j] ?? "").trim()]),
      );
      if (!q.id || ids.has(q.id)) throw Error("Tunnus puuttuu tai toistuu.");
      ids.add(q.id);
      if (q.active && !["TRUE", "FALSE"].includes(q.active.toUpperCase()))
        throw Error("Virheellinen aktiivisuus.");
      return {
        id: q.id,
        revision: 1,
        ...validateQuestion({
          question: q.question,
          options: [q.option_a, q.option_b, q.option_c, q.option_d],
          correctIndex: ["a", "b", "c", "d"].indexOf(q.correct.toLowerCase()),
          active: q.active.toUpperCase() !== "FALSE",
          difficulty: q.difficulty || null,
        }),
      };
    } catch (e) {
      throw new AppError(
        400,
        `CSV rivi ${i + 2}: ${e instanceof Error ? e.message : "Virheellinen rivi."}`,
      );
    }
  });
}
