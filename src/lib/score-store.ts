import "server-only";
import { getDb, transaction } from "./db";
import { AppError, integer, object, text } from "./errors";
import type {
  ScoreInput,
  LeaderboardData,
  LeaderboardEntry,
} from "./quiz-types";
export function validateScore(value: unknown): ScoreInput {
  const v = object(value);
  const submissionId = text(v.submissionId, 36, "submissionId");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionId,
    )
  )
    throw new AppError(400, "Virheellinen pelitunnus.");
  const totalQuestions = integer(v.totalQuestions, 1, 20, "totalQuestions"),
    correctAnswers = integer(
      v.correctAnswers,
      0,
      totalQuestions,
      "correctAnswers",
    );
  return {
    submissionId: submissionId.toLowerCase(),
    playerName: text(v.playerName, 30, "playerName"),
    score: integer(v.score, 0, correctAnswers * 2000, "score"),
    correctAnswers,
    totalQuestions,
    timePlayedSeconds: integer(
      v.timePlayedSeconds,
      0,
      2147483647,
      "timePlayedSeconds",
    ),
  };
}
export async function saveScore(
  value: unknown,
): Promise<{ success: true; rank: number | null }> {
  const s = validateScore(value);
  return transaction(async (db) => {
    const params = [
      s.submissionId,
      s.playerName,
      s.score,
      s.correctAnswers,
      s.totalQuestions,
      s.timePlayedSeconds,
    ];
    await db.query(
      "INSERT INTO scores(submission_id,player_name,score,correct_answers,total_questions,time_played_seconds) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(submission_id) DO NOTHING",
      params,
    );
    const same = await db.query(
      "SELECT 1 FROM scores WHERE submission_id=$1 AND player_name=$2 AND score=$3 AND correct_answers=$4 AND total_questions=$5 AND time_played_seconds=$6",
      params,
    );
    if (!same.rowCount)
      throw new AppError(409, "Tälle pelille on jo tallennettu eri tulos.");
    const { rows } = await db.query<{ rank: string }>(
      `SELECT rank FROM (SELECT submission_id,row_number() OVER(ORDER BY score DESC,created_at,submission_id) AS rank FROM scores,leaderboard_state WHERE leaderboard_state.id=1 AND (all_time_since IS NULL OR created_at>all_time_since)) ranked WHERE submission_id=$1`,
      [s.submissionId],
    );
    return { success: true, rank: rows[0] ? Number(rows[0].rank) : null };
  });
}
export async function getLeaderboard(): Promise<LeaderboardData> {
  const now = new Date().toISOString();
  const { rows } = await getDb().query<{
    allTime: LeaderboardEntry[];
    today: LeaderboardEntry[];
  }>(
    `WITH bounds AS (
 SELECT (($1::timestamptz AT TIME ZONE 'Europe/Helsinki')::date::timestamp AT TIME ZONE 'Europe/Helsinki') AS start,
 ((($1::timestamptz AT TIME ZONE 'Europe/Helsinki')::date+1)::timestamp AT TIME ZONE 'Europe/Helsinki') AS finish
 ), state AS (SELECT * FROM leaderboard_state WHERE id=1)
 SELECT COALESCE((SELECT jsonb_agg(t) FROM (SELECT player_name,score,correct_answers,total_questions,created_at FROM scores,state WHERE all_time_since IS NULL OR created_at>all_time_since ORDER BY score DESC,created_at,submission_id LIMIT 10)t),'[]'::jsonb) AS "allTime",
 COALESCE((SELECT jsonb_agg(t) FROM (SELECT player_name,score,correct_answers,total_questions,created_at FROM scores,state,bounds WHERE created_at>=bounds.start AND created_at<bounds.finish AND (today_since IS NULL OR created_at>today_since) ORDER BY score DESC,created_at,submission_id LIMIT 10)t),'[]'::jsonb) AS today`,
    [now],
  );
  return rows[0];
}
export async function resetScores(scope: "today" | "all") {
  if (scope !== "today" && scope !== "all")
    throw new AppError(400, "Valitse nollattava lista.");
  await getDb().query(
    `UPDATE leaderboard_state SET today_since=clock_timestamp(),all_time_since=CASE WHEN $1='all' THEN clock_timestamp() ELSE all_time_since END WHERE id=1`,
    [scope],
  );
}
