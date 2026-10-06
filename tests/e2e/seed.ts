import { writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../../src/lib/admin-auth";
import { migrate } from "../../scripts/migrations";
import { getDb } from "../../src/lib/db";
import { importQuestions } from "../../src/lib/quiz-store";
async function main() {
  const url = process.env.TEST_DATABASE_URL;
  if (
    !url ||
    !["localhost", "127.0.0.1"].includes(new URL(url).hostname) ||
    !new URL(url).pathname.endsWith("_test")
  )
    throw Error("Use an isolated local test database.");
  process.env.DATABASE_URL = url;
  await migrate();
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
    Array.from({ length: 11 }, (_, i) => ({
      id: String(i + 1),
      question: `Testikysymys ${i + 1}`,
      options: ["Oikea", "Väärä B", "Väärä C", "Väärä D"] as [
        string,
        string,
        string,
        string,
      ],
      correctIndex: 0,
      active: true,
      difficulty: null,
      revision: 1,
    })),
  );
  await writeFile(
    ".env.e2e.local",
    `DATABASE_URL=${url}\nDATABASE_ENV=test\nAPP_ORIGIN=http://localhost:3107\nADMIN_PASSWORD_HASH=${await hashPassword("test-only-admin-password")}\nADMIN_RATE_LIMIT_SECRET=${randomBytes(32).toString("hex")}\n`,
    { mode: 0o600 },
  );
  await getDb().end();
}
main().catch(() => {
  console.error("Could not seed isolated browser-test data.");
  process.exitCode = 1;
});
