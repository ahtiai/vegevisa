import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  test,
  vi,
} from "vitest";
import {
  setupDatabase,
  resetDatabase,
  closeDatabase,
} from "./support/database";
import { getDb } from "@/lib/db";
import { saveScore, getLeaderboard, resetScores } from "@/lib/score-store";
import { randomUUID } from "node:crypto";
import { GET as getRoute } from "@/app/api/scores/leaderboard/route";
import { POST as postRoute } from "@/app/api/scores/route";
const score = () => ({
  submissionId: randomUUID(),
  playerName: "Player",
  score: 1500,
  correctAnswers: 1,
  totalQuestions: 5,
  timePlayedSeconds: 12,
});
beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterEach(() => vi.useRealTimers());
afterAll(closeDatabase);
test("simultaneous saves persist separately and retry saves only once", async () => {
  const a = score(),
    b = score();
  await Promise.all([saveScore(a), saveScore(b), saveScore(a)]);
  expect((await getLeaderboard()).allTime).toHaveLength(2);
  await expect(saveScore({ ...a, score: 1000 })).rejects.toMatchObject({
    status: 409,
  });
});
test("invalid scores fail before storage", async () => {
  for (const change of [
    { score: NaN },
    { score: "100" },
    { score: 2500 },
    { correctAnswers: -1 },
    { totalQuestions: 21 },
    { playerName: " " },
    { score: 1.5 },
    { timePlayedSeconds: -1 },
  ])
    await expect(saveScore({ ...score(), ...change })).rejects.toMatchObject({
      status: 400,
    });
  expect((await getLeaderboard()).allTime).toHaveLength(0);
});
test("daily reset keeps all-time records and all reset hides both without deletion", async () => {
  await saveScore(score());
  await resetScores("today");
  let lists = await getLeaderboard();
  expect(lists.today).toHaveLength(0);
  expect(lists.allTime).toHaveLength(1);
  await resetScores("all");
  lists = await getLeaderboard();
  expect(lists.today).toHaveLength(0);
  expect(lists.allTime).toHaveLength(0);
  await saveScore(score());
  expect((await getLeaderboard()).today).toHaveLength(1);
  expect(
    Number((await getDb().query("SELECT count(*) FROM scores")).rows[0].count),
  ).toBe(2);
});
test.each([
  [
    "2026-03-29T10:00:00Z",
    "2026-03-28T21:59:59Z",
    "2026-03-28T22:00:00Z",
    "2026-03-29T20:59:59Z",
    "2026-03-29T21:00:00Z",
  ],
  [
    "2026-10-25T10:00:00Z",
    "2026-10-24T20:59:59Z",
    "2026-10-24T21:00:00Z",
    "2026-10-25T21:59:59Z",
    "2026-10-25T22:00:00Z",
  ],
])(
  "Helsinki day includes both DST edges at %s",
  async (now, before, start, end, after) => {
    for (const [i, date] of [before, start, end, after].entries()) {
      const s = score();
      s.playerName = String(i);
      await saveScore(s);
      await getDb().query(
        "UPDATE scores SET created_at=$1 WHERE submission_id=$2",
        [date, s.submissionId],
      );
    }
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(now));
    expect((await getLeaderboard()).today.map((x) => x.player_name)).toEqual([
      "1",
      "2",
    ]);
  },
);
test("public routes return structured bad request and list responses", async () => {
  expect(
    (
      await postRoute(
        new Request("http://localhost/api/scores", {
          method: "POST",
          body: "not json",
        }),
      )
    ).status,
  ).toBe(400);
  expect((await getRoute()).status).toBe(200);
});
test("a new score ranks first after all-time reset", async () => {
  const old = score();
  old.score = 2000;
  await saveScore(old);
  await resetScores("all");
  const next = score();
  expect((await saveScore(next)).rank).toBe(1);
});
