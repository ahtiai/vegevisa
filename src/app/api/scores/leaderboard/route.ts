import { NextResponse } from "next/server";
import { getRedis, key } from "@/lib/redis";

export const dynamic = "force-dynamic";

interface StoredEntry {
  name: string;
  correct: number;
  total: number;
  time: number;
  ts: number;
}

export async function GET() {
  const redis = getRedis();
  const today = new Date().toISOString().slice(0, 10);

  const [allTimeRaw, todayRaw] = await Promise.all([
    redis.zrange(key("leaderboard"), 0, 9, { rev: true, withScores: true }),
    redis.zrange(key(`leaderboard:${today}`), 0, 9, { rev: true, withScores: true }),
  ]);

  const parseEntries = (raw: unknown[]) => {
    const entries = [];
    for (let i = 0; i < raw.length; i += 2) {
      const val = raw[i];
      const data = (typeof val === "string" ? JSON.parse(val) : val) as StoredEntry;
      const score = Number(raw[i + 1]);
      entries.push({
        player_name: data.name,
        score,
        correct_answers: data.correct,
        total_questions: data.total,
        created_at: new Date(data.ts).toISOString(),
      });
    }
    return entries;
  };

  return NextResponse.json({
    allTime: parseEntries(allTimeRaw),
    today: parseEntries(todayRaw),
  });
}
