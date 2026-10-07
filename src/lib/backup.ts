import "server-only";
import { transaction } from "./db";
import { AppError, object, integer, text } from "./errors";
import {
  questionColumns,
  validateQuestion,
  validateSettings,
} from "./quiz-store";
import { validateScore } from "./score-store";
import type { Question, QuizSettings } from "./quiz-types";
export async function createBackup() {
  return transaction(async (db) => {
    const questions = (
      await db.query<Question>(
        `SELECT ${questionColumns} FROM questions ORDER BY id`,
      )
    ).rows;
    const s = (await db.query("SELECT * FROM quiz_settings WHERE id=1"))
      .rows[0];
    const settings: QuizSettings = {
      questionCounts: s.question_counts,
      questionTimeSeconds: s.question_time_seconds,
      revision: s.revision,
    };
    const scores = (
      await db.query(
        'SELECT submission_id AS "submissionId",player_name AS "playerName",score,correct_answers AS "correctAnswers",total_questions AS "totalQuestions",time_played_seconds AS "timePlayedSeconds",created_at AS "createdAt" FROM scores ORDER BY created_at,submission_id',
      )
    ).rows;
    const state = (
      await db.query(
        'SELECT today_since AS "todaySince",all_time_since AS "allTimeSince" FROM leaderboard_state WHERE id=1',
      )
    ).rows[0];
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      questions,
      settings,
      scores,
      leaderboardState: state,
    };
  }, true);
}
function date(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new AppError(400, "Virheellinen varmuuskopion päivämäärä.");
  return new Date(value).toISOString();
}
export function validateBackup(value: unknown) {
  const b = object(value);
  if (
    b.version !== 1 ||
    !Array.isArray(b.questions) ||
    !Array.isArray(b.scores)
  )
    throw new AppError(400, "Tuntematon varmuuskopion muoto.");
  date(b.exportedAt);
  const settings = {
    ...validateSettings(b.settings),
    revision: integer(object(b.settings).revision, 1, 2147483647, "revision"),
  };
  const questions = b.questions.map((v) => {
    const q = object(v);
    return {
      ...validateQuestion(q),
      id: text(q.id, 200, "id"),
      revision: integer(q.revision, 1, 2147483647, "revision"),
    };
  });
  const scores = b.scores.map((v) => {
    const s = object(v);
    return { ...validateScore(s), createdAt: date(s.createdAt) };
  });
  if (
    new Set(questions.map((q) => q.id)).size !== questions.length ||
    new Set(scores.map((s) => s.submissionId)).size !== scores.length
  )
    throw new AppError(400, "Varmuuskopiossa on toistuvia tunnuksia.");
  if (
    questions.filter((q) => q.active).length <
    Math.max(...settings.questionCounts)
  )
    throw new AppError(400, "Aktiivisia kysymyksiä on liian vähän.");
  const state = object(b.leaderboardState);
  const leaderboardState = {
    todaySince: state.todaySince == null ? null : date(state.todaySince),
    allTimeSince: state.allTimeSince == null ? null : date(state.allTimeSince),
  };
  return { questions, settings, scores, leaderboardState };
}
export async function restoreBackup(value: unknown) {
  const b = validateBackup(value);
  await transaction(async (db) => {
    await db.query("SELECT id FROM quiz_settings WHERE id=1 FOR UPDATE");
    await db.query(
      "LOCK TABLE questions,scores,leaderboard_state IN EXCLUSIVE MODE",
    );
    if (
      Number(
        (
          await db.query(
            "SELECT (SELECT count(*) FROM questions)+(SELECT count(*) FROM scores) AS count",
          )
        ).rows[0].count,
      )
    )
      throw new AppError(409, "Palautus vaatii tyhjän tietokannan.");
    for (const q of b.questions)
      await db.query(
        "INSERT INTO questions(id,question,options,correct_index,active,difficulty,revision) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          q.id,
          q.question,
          q.options,
          q.correctIndex,
          q.active,
          q.difficulty,
          q.revision,
        ],
      );
    for (const s of b.scores)
      await db.query(
        "INSERT INTO scores(submission_id,player_name,score,correct_answers,total_questions,time_played_seconds,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          s.submissionId,
          s.playerName,
          s.score,
          s.correctAnswers,
          s.totalQuestions,
          s.timePlayedSeconds,
          s.createdAt,
        ],
      );
    await db.query(
      "UPDATE quiz_settings SET question_counts=$1,question_time_seconds=$2,revision=$3,updated_at=clock_timestamp() WHERE id=1",
      [
        b.settings.questionCounts,
        b.settings.questionTimeSeconds,
        b.settings.revision,
      ],
    );
    await db.query(
      "UPDATE leaderboard_state SET today_since=$1,all_time_since=$2 WHERE id=1",
      [b.leaderboardState.todaySince, b.leaderboardState.allTimeSince],
    );
  });
}
