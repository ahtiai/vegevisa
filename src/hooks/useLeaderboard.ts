"use client";

import { useState, useCallback } from "react";

export interface LeaderboardEntry {
  player_name: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  created_at: string;
}

export interface LeaderboardData {
  allTime: LeaderboardEntry[];
  today: LeaderboardEntry[];
}

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scores/leaderboard");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitScore = useCallback(
    async (params: {
      playerName: string;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      timePlayedSeconds: number;
    }) => {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchLeaderboard();
      return json;
    },
    [fetchLeaderboard]
  );

  return { data, loading, fetchLeaderboard, submitScore };
}
