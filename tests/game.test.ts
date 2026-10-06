import { beforeAll, beforeEach, afterAll, expect, test } from "vitest";
import { NextRequest } from "next/server";
import {
  setupDatabase,
  resetDatabase,
  closeDatabase,
} from "./support/database";
import { calculateScore } from "@/lib/scoring";
import { GET } from "@/app/api/questions/route";
import { saveSettings } from "@/lib/quiz-store";
beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);
test.each([
  [30, 30, 2000],
  [15, 30, 1500],
  [30, 60, 1500],
  [0, 60, 1000],
  [100, 30, 2000],
  [-1, 30, 1000],
])("score normalizes %s seconds against %s", (remaining, total, expected) =>
  expect(calculateScore(remaining, total)).toBe(expected),
);
test("questions use active stored records with a settings snapshot", async () => {
  const first = await (
    await GET(new NextRequest("http://localhost/api/questions?count=5"))
  ).json();
  expect(first.questions).toHaveLength(5);
  expect(
    first.questions.every((q: { question: string }) =>
      q.question.startsWith("Question "),
    ),
  ).toBe(true);
  expect(first.settings.questionTimeSeconds).toBe(30);
  await saveSettings({ questionCounts: [3, 5], questionTimeSeconds: 60 }, 1);
  expect(first.settings.questionTimeSeconds).toBe(30);
  const next = await (
    await GET(new NextRequest("http://localhost/api/questions?count=3"))
  ).json();
  expect(next.settings.questionTimeSeconds).toBe(60);
});
test.each(["6", "NaN", "5abc", "0", "-1"])(
  "invalid quiz length %s is rejected",
  async (n) =>
    expect(
      (await GET(new NextRequest("http://localhost/api/questions?count=" + n)))
        .status,
    ).toBe(400),
);
