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
      <div className="flex rounded-lg border-3 border-border-bright overflow-hidden mb-4">
        <button
          onClick={() => setTab("allTime")}
          className={`flex-1 py-3 px-4 font-[family-name:var(--font-press-start)] text-[10px] uppercase tracking-wider transition-colors ${
            tab === "allTime"
              ? "bg-bg-panel text-green-glow border-r-3 border-border-bright"
              : "bg-bg-secondary text-text-dim border-r-3 border-border-bright"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          All time
        </button>
        <button
          onClick={() => setTab("today")}
          className={`flex-1 py-3 px-4 font-[family-name:var(--font-press-start)] text-[10px] uppercase tracking-wider transition-colors ${
            tab === "today"
              ? "bg-bg-panel text-green-glow"
              : "bg-bg-secondary text-text-dim"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          Tänään
        </button>
      </div>

      {/* Table */}
      {displayEntries.length === 0 ? (
        <div className="arcade-panel rounded-lg p-6 text-center">
          <p className="text-text-dim text-base font-bold">Ei tuloksia vielä</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayEntries.map((entry, i) => (
            <div
              key={`${entry.player_name}-${entry.created_at}-${i}`}
              className={`flex items-center gap-4 py-3 px-4 rounded-lg border-2 ${
                i === 0
                  ? "bg-bg-panel border-green-glow/40"
                  : "bg-bg-secondary border-border-arcade"
              }`}
            >
              <span className={`font-[family-name:var(--font-press-start)] text-xs w-7 text-center ${
                i === 0 ? "text-white" : "text-white/50"
              }`}>
                {i + 1}
              </span>
              <span className="flex-1 font-bold text-white truncate text-base uppercase tracking-wide">
                {entry.player_name}
              </span>
              <span className="text-sm text-white/50 font-bold">
                {entry.correct_answers}/{entry.total_questions}
              </span>
              <span className={`font-[family-name:var(--font-press-start)] text-xs tabular-nums ${
                i === 0 ? "text-white" : "text-white/80"
              }`}>
                {entry.score.toLocaleString("fi-FI")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
