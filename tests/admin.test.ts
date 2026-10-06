import { beforeAll, beforeEach, afterAll, expect, test } from "vitest";
import {
  setupDatabase,
  resetDatabase,
  closeDatabase,
} from "./support/database";
import { hashPassword, login, SESSION_COOKIE } from "@/lib/admin-auth";
import {
  GET as questions,
  POST as create,
} from "@/app/api/admin/questions/route";
import { PUT as settings } from "@/app/api/admin/settings/route";
import { POST as reset } from "@/app/api/admin/scores/reset/route";
import { GET as backup } from "@/app/api/admin/backup/route";
import { getDb } from "@/lib/db";
import { restoreBackup } from "@/lib/backup";
import { saveScore, getLeaderboard } from "@/lib/score-store";
import { randomUUID } from "node:crypto";
beforeAll(async () => {
  await setupDatabase();
  process.env.ADMIN_PASSWORD_HASH = await hashPassword("admin test password");
  process.env.ADMIN_RATE_LIMIT_SECRET = "a-long-random-test-secret-32-chars";
  process.env.APP_ORIGIN = "https://quiz.test";
});
beforeEach(resetDatabase);
afterAll(closeDatabase);
async function request(body?: unknown, origin = "https://quiz.test") {
  const s = await login("admin test password", "local");
  return new Request("https://quiz.test/api/admin/settings", {
    method: body ? "POST" : "GET",
    headers: { origin, cookie: `${SESSION_COOKIE}=${s.token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}
test("all admin endpoints reject unauthenticated requests", async () => {
  for (const handler of [questions, create, settings, reset, backup])
    expect(
      (await handler(new Request("https://quiz.test/api/admin"))).status,
    ).toBe(401);
});
test("authenticated writes reject foreign origin and invalid settings", async () => {
  expect(
    (
      await settings(
        await request(
          { questionCounts: [5, 10], questionTimeSeconds: 30, revision: 1 },
          "https://evil.test",
        ),
      )
    ).status,
  ).toBe(403);
  for (const body of [
    { questionCounts: [5, 5], questionTimeSeconds: 30 },
    { questionCounts: [0, 10], questionTimeSeconds: 30 },
    { questionCounts: [5, 10], questionTimeSeconds: 121 },
  ])
    expect(
      (await settings(await request({ ...body, revision: 1 }))).status,
    ).toBe(400);
});
test("backup excludes credentials and round-trips into empty data tables", async () => {
  await saveScore({
    submissionId: randomUUID(),
    playerName: "Saved player",
    score: 1000,
    correctAnswers: 1,
    totalQuestions: 5,
    timePlayedSeconds: 20,
  });
  const response = await backup(await request());
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(Object.keys(data).sort()).toEqual([
    "exportedAt",
    "leaderboardState",
    "questions",
    "scores",
    "settings",
    "version",
  ]);
  expect(JSON.stringify(data)).not.toContain("password");
  await expect(restoreBackup(data)).rejects.toMatchObject({ status: 409 });
  await getDb().query("TRUNCATE questions,scores");
  await restoreBackup(data);
  expect((await getLeaderboard()).allTime[0].player_name).toBe("Saved player");
  expect(
    (await getDb().query("SELECT count(*) FROM questions")).rows[0].count,
  ).toBe("11");
});
