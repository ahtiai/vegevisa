"use client";

import { useState } from "react";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

interface LeaderboardProps {
  allTime: LeaderboardEntry[];
  today: LeaderboardEntry[];
  compact?: boolean;
}

export default function Leaderboard({ allTime, today, compact = false }: LeaderboardProps) {
  const [tab, setTab] = useState<"allTime" | "today">("allTime");
  const entries = tab === "allTime" ? allTime : today;
  const displayEntries = compact ? entries.slice(0, 5) : entries;

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex rounded-xl bg-bg-secondary p-1 mb-3">
        <button
          onClick={() => setTab("allTime")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === "allTime" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          Kaikkien aikojen
        </button>
        <button
          onClick={() => setTab("today")}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            tab === "today" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          Tänään
        </button>
      </div>

      {/* Table */}
      {displayEntries.length === 0 ? (
        <p className="text-center text-text-secondary text-sm py-4">
          Ei tuloksia vielä
        </p>
      ) : (
        <div className="space-y-1">
          {displayEntries.map((entry, i) => (
            <div
              key={`${entry.player_name}-${entry.created_at}-${i}`}
              className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white"
            >
              <span className="w-6 text-center font-bold text-text-secondary text-sm">
                {i + 1}.
              </span>
              <span className="flex-1 font-medium text-text-primary truncate text-sm">
                {entry.player_name}
              </span>
              <span className="text-sm text-text-secondary">
                {entry.correct_answers}/{entry.total_questions}
              </span>
              <span className="font-bold text-green-primary tabular-nums text-sm">
                {entry.score.toLocaleString("fi-FI")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
