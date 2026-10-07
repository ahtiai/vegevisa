import { Pool } from "pg";
import { migrate } from "../../scripts/migrations";
import { getDb } from "@/lib/db";
import { importQuestions } from "@/lib/quiz-store";
import type { Question } from "@/lib/quiz-types";
export function question(id: string): Question {
  return {
    id,
    question: "Question " + id,
    options: ["a", "b", "c", "d"],
    correctIndex: 0,
    active: true,
    difficulty: null,
    revision: 1,
  };
}
export async function setupDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || url === process.env.DATABASE_URL)
    throw Error("Use a separate TEST_DATABASE_URL.");
  const u = new URL(url);
  if (
    !["localhost", "127.0.0.1"].includes(u.hostname) ||
    !u.pathname.endsWith("_test")
  )
    throw Error("Tests require an isolated local *_test database.");
  process.env.DATABASE_URL = url;
  await migrate();
}
export async function resetDatabase() {
  await getDb().query(
    "TRUNCATE questions,scores,admin_sessions,login_attempts",
  );
  await getDb().query(
    "UPDATE quiz_settings SET question_counts=ARRAY[5,10],question_time_seconds=30,revision=1",
  );
  await getDb().query(
    "UPDATE leaderboard_state SET today_since=NULL,all_time_since=NULL",
  );
  await importQuestions(
    Array.from({ length: 11 }, (_, i) => question(String(i + 1))),
  );
}
export async function closeDatabase() {
  await getDb().end();
  delete process.env.DATABASE_URL;
}
export async function independentRead() {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    return (await pool.query("SELECT count(*) FROM questions")).rows[0].count;
  } finally {
    await pool.end();
  }
}
