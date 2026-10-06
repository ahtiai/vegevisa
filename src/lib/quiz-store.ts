import "server-only";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getDb, transaction } from "./db";
import { AppError, integer, object, text } from "./errors";
import type {
  Question,
  QuestionInput,
  QuizSettings,
  SettingsInput,
} from "./quiz-types";
export const questionColumns =
  'id, question, options, correct_index AS "correctIndex", active, difficulty, revision';
const settingsColumns =
  'question_counts AS "questionCounts", question_time_seconds AS "questionTimeSeconds", revision';
export function validateQuestion(value: unknown): QuestionInput {
  const v = object(value);
  const q = text(v.question, 1000, "question");
  if (!Array.isArray(v.options) || v.options.length !== 4)
    throw new AppError(400, "Anna neljä vastausta.", "options");
  const options = v.options.map((o) =>
    text(o, 300, "options"),
  ) as QuestionInput["options"];
  if (new Set(options.map((o) => o.toLocaleLowerCase("fi"))).size !== 4)
    throw new AppError(400, "Vastausten pitää olla erilaiset.", "options");
  if (typeof v.active !== "boolean")
    throw new AppError(400, "Tarkista aktiivisuus.", "active");
  return {
    question: q,
    options,
    correctIndex: integer(v.correctIndex, 0, 3, "correctIndex"),
    active: v.active,
    difficulty:
      v.difficulty == null ? null : text(v.difficulty, 50, "difficulty"),
  };
}
export function validateSettings(value: unknown): SettingsInput {
  const v = object(value);
  if (!Array.isArray(v.questionCounts) || v.questionCounts.length !== 2)
    throw new AppError(400, "Anna kaksi kysymysmäärää.", "questionCounts");
  const counts = v.questionCounts
    .map((n) => integer(n, 1, 20, "questionCounts"))
    .sort((a, b) => a - b) as [number, number];
  if (counts[0] === counts[1])
    throw new AppError(
      400,
      "Kysymysmäärien pitää olla erilaiset.",
      "questionCounts",
    );
  return {
    questionCounts: counts,
    questionTimeSeconds: integer(
      v.questionTimeSeconds,
      5,
      120,
      "questionTimeSeconds",
    ),
  };
}
export async function getSettings(): Promise<QuizSettings> {
  return (
    await getDb().query<QuizSettings>(
      `SELECT ${settingsColumns} FROM quiz_settings WHERE id=1`,
    )
  ).rows[0];
}
export async function listQuestions(): Promise<Question[]> {
  return (
    await getDb().query<Question>(
      `SELECT ${questionColumns} FROM questions ORDER BY created_at,id`,
    )
  ).rows;
}
export async function getActiveQuestions(): Promise<Question[]> {
  return (
    await getDb().query<Question>(
      `SELECT ${questionColumns} FROM questions WHERE active ORDER BY id`,
    )
  ).rows;
}
async function lockSettings(db: PoolClient): Promise<QuizSettings> {
  return (
    await db.query<QuizSettings>(
      `SELECT ${settingsColumns} FROM quiz_settings WHERE id=1 FOR UPDATE`,
    )
  ).rows[0];
}
async function checkCount(db: PoolClient, counts: number[]) {
  const { rows } = await db.query<{ count: string }>(
    "SELECT count(*) FROM questions WHERE active",
  );
  if (Number(rows[0].count) < Math.max(...counts))
    throw new AppError(
      400,
      "Aktiivisia kysymyksiä tarvitaan vähintään " + Math.max(...counts) + ".",
      "active",
    );
}
export async function createQuestion(input: unknown): Promise<Question> {
  const q = validateQuestion(input);
  return transaction(async (db) => {
    const s = await lockSettings(db);
    const { rows } = await db.query<Question>(
      `INSERT INTO questions(id,question,options,correct_index,active,difficulty) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${questionColumns}`,
      [
        randomUUID(),
        q.question,
        q.options,
        q.correctIndex,
        q.active,
        q.difficulty,
      ],
    );
    await checkCount(db, s.questionCounts);
    return rows[0];
  });
}
export async function updateQuestion(
  id: string,
  input: unknown,
  expectedRevision: number,
): Promise<Question> {
  const q = validateQuestion(input);
  integer(expectedRevision, 1, 2147483647, "revision");
  return transaction(async (db) => {
    const s = await lockSettings(db);
    const { rows } = await db.query<Question>(
      `UPDATE questions SET question=$2,options=$3,correct_index=$4,active=$5,difficulty=$6,revision=revision+1,updated_at=clock_timestamp() WHERE id=$1 AND revision=$7 RETURNING ${questionColumns}`,
      [
        id,
        q.question,
        q.options,
        q.correctIndex,
        q.active,
        q.difficulty,
        expectedRevision,
      ],
    );
    if (!rows[0])
      throw new AppError(409, "Kysymys on muuttunut. Lataa uusin versio.");
    await checkCount(db, s.questionCounts);
    return rows[0];
  });
}
export async function saveSettings(
  input: unknown,
  expectedRevision: number,
): Promise<QuizSettings> {
  const s = validateSettings(input);
  integer(expectedRevision, 1, 2147483647, "revision");
  return transaction(async (db) => {
    const current = await lockSettings(db);
    if (current.revision !== expectedRevision)
      throw new AppError(409, "Asetukset ovat muuttuneet. Lataa uusin versio.");
    await checkCount(db, s.questionCounts);
    return (
      await db.query<QuizSettings>(
        `UPDATE quiz_settings SET question_counts=$1,question_time_seconds=$2,revision=revision+1,updated_at=clock_timestamp() WHERE id=1 RETURNING ${settingsColumns}`,
        [s.questionCounts, s.questionTimeSeconds],
      )
    ).rows[0];
  });
}
export async function importQuestions(questions: Question[]): Promise<void> {
  const ids = new Set<string>();
  const validated = questions.map((q) => {
    const id = text(q.id, 200, "id");
    if (ids.has(id)) throw new AppError(400, "Kysymystunnus toistuu.");
    ids.add(id);
    return { ...validateQuestion(q), id };
  });
  await transaction(async (db) => {
    const s = await lockSettings(db);
    if (
      Number((await db.query("SELECT count(*) FROM questions")).rows[0].count)
    )
      throw new AppError(
        409,
        "Kysymyksiä on jo tallennettu. Tuonti ei korvaa niitä.",
      );
    for (const q of validated)
      await db.query(
        "INSERT INTO questions(id,question,options,correct_index,active,difficulty) VALUES($1,$2,$3,$4,$5,$6)",
        [q.id, q.question, q.options, q.correctIndex, q.active, q.difficulty],
      );
    await checkCount(db, s.questionCounts);
  });
}
export async function getGameData() {
  return transaction(
    async (db) => ({
      settings: (
        await db.query<QuizSettings>(
          `SELECT ${settingsColumns} FROM quiz_settings WHERE id=1`,
        )
      ).rows[0],
      questions: (
        await db.query<Question>(
          `SELECT ${questionColumns} FROM questions WHERE active ORDER BY id`,
        )
      ).rows,
    }),
    true,
  );
}
