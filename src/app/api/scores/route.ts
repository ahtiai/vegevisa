import { NextRequest, NextResponse } from "next/server";
import { getRedis, key } from "@/lib/redis";

export const dynamic = "force-dynamic";

const MAX_POINTS_PER_QUESTION = 2000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerName, score, correctAnswers, totalQuestions, timePlayedSeconds } = body;

    // Validation
    if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
      return NextResponse.json({ error: "Nimi vaaditaan" }, { status: 400 });
    }
    if (playerName.trim().length > 30) {
      return NextResponse.json({ error: "Nimi on liian pitkä" }, { status: 400 });
    }
    if (![5, 10].includes(totalQuestions)) {
      return NextResponse.json({ error: "Virheellinen kysymysmäärä" }, { status: 400 });
    }
    if (score < 0 || score > totalQuestions * MAX_POINTS_PER_QUESTION) {
      return NextResponse.json({ error: "Virheellinen pistemäärä" }, { status: 400 });
    }
    if (correctAnswers < 0 || correctAnswers > totalQuestions) {
      return NextResponse.json({ error: "Virheelliset oikeat vastaukset" }, { status: 400 });
    }

    const redis = getRedis();
    const now = Date.now();
    const member = JSON.stringify({
      name: playerName.trim().slice(0, 30),
      correct: correctAnswers,
      total: totalQuestions,
      time: timePlayedSeconds,
      ts: now,
    });

    // Add to all-time leaderboard
    await redis.zadd(key("leaderboard"), { score, member });

    // Add to daily leaderboard (with today's date as key)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await redis.zadd(key(`leaderboard:${today}`), { score, member });
    // Expire daily key after 48h
    await redis.expire(key(`leaderboard:${today}`), 48 * 60 * 60);

    // Get rank (0-indexed, highest first)
    const rank = await redis.zrevrank(key("leaderboard"), member);

    return NextResponse.json({
      success: true,
      rank: (rank ?? 0) + 1,
    });
  } catch {
    return NextResponse.json({ error: "Virheellinen pyyntö" }, { status: 400 });
  }
}
