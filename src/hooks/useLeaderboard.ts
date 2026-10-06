"use client";
import { useState, useCallback } from "react";
import { requestJSON } from "@/lib/client-api";
import type { LeaderboardData, ScoreInput } from "@/lib/quiz-types";
export type { LeaderboardData, LeaderboardEntry } from "@/lib/quiz-types";
export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await requestJSON<LeaderboardData>("/api/scores/leaderboard"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  const submitScore = useCallback(
    async (params: ScoreInput) => {
      const result = await requestJSON<{ success: true; rank: number }>(
        "/api/scores",
        { method: "POST", body: JSON.stringify(params) },
      );
      await fetchLeaderboard();
      return result;
    },
    [fetchLeaderboard],
  );
  return { data, loading, error, fetchLeaderboard, submitScore };
}
