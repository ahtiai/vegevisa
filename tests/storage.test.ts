import { beforeAll, beforeEach, afterAll, expect, test } from "vitest";
import {
  setupDatabase,
  resetDatabase,
  closeDatabase,
  question,
} from "./support/database";
import {
  createQuestion,
  getSettings,
  listQuestions,
  updateQuestion,
  saveSettings,
  importQuestions,
} from "@/lib/quiz-store";
import { parseQuestionCSV } from "@/lib/question-import";
beforeAll(setupDatabase);
beforeEach(resetDatabase);
afterAll(closeDatabase);
test("settings default to two playable lengths and updates reject stale revisions", async () => {
  const s = await getSettings();
  expect(s.questionCounts).toEqual([5, 10]);
  await saveSettings(
    { questionCounts: [3, 5], questionTimeSeconds: 60 },
    s.revision,
  );
  await expect(
    saveSettings(
      { questionCounts: [3, 5], questionTimeSeconds: 30 },
      s.revision,
    ),
  ).rejects.toMatchObject({ status: 409 });
});
test("simultaneous deactivations cannot leave fewer than ten active questions", async () => {
  const qs = await listQuestions();
  const results = await Promise.allSettled(
    qs
      .slice(0, 2)
      .map((q) => updateQuestion(q.id, { ...q, active: false }, q.revision)),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await listQuestions()).filter((q) => q.active)).toHaveLength(10);
});
test("question revision conflicts preserve the first edit", async () => {
  const [q] = await listQuestions();
  await updateQuestion(q.id, { ...q, question: "First edit" }, q.revision);
  await expect(
    updateQuestion(q.id, { ...q, question: "Stale edit" }, q.revision),
  ).rejects.toMatchObject({ status: 409 });
  expect((await listQuestions()).find((x) => x.id === q.id)?.question).toBe(
    "First edit",
  );
});
test("invalid answers and insufficient active questions cannot be saved", async () => {
  await expect(
    createQuestion({ ...question("new"), options: ["same", "same", "c", "d"] }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    saveSettings({ questionCounts: [5, 20], questionTimeSeconds: 30 }, 1),
  ).rejects.toMatchObject({ status: 400 });
});
test("CSV import keeps inactive rows and rejects duplicate IDs before writes", async () => {
  expect(() => parseQuestionCSV("id,question,option_a,option_b,option_c,option_d,correct\nq1,Question,a,b,c,d,a\n")).toThrow(/sarake active puuttuu/);
  const csv =
    'id,question,option_a,option_b,option_c,option_d,correct,active\nq1,"Text, quoted",a,b,c,d,b,FALSE\n';
  const rows = parseQuestionCSV(csv);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: "q1",
    active: false,
    correctIndex: 1,
    question: "Text, quoted",
  });
  expect(() => parseQuestionCSV(csv + "q1,Another,a,b,c,d,a,TRUE\n")).toThrow(
    /3/,
  );
  const before = await listQuestions();
  await expect(importQuestions([question("1")])).rejects.toMatchObject({
    status: 409,
  });
  expect(await listQuestions()).toEqual(before);
});
test("rerunning migrations preserves edits and another connection reads committed data", async () => {
  const { migrate } = await import("../scripts/migrations");
  const { independentRead } = await import("./support/database");
  const [q] = await listQuestions();
  await updateQuestion(q.id, { ...q, question: "Persisted edit" }, q.revision);
  await migrate();
  expect((await listQuestions()).find((x) => x.id === q.id)?.question).toBe(
    "Persisted edit",
  );
  expect(await independentRead()).toBe("11");
});
