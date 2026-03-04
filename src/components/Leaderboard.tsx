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
      <div className="flex rounded-lg border-2 border-border-arcade overflow-hidden mb-3">
        <button
          onClick={() => setTab("allTime")}
          className={`flex-1 py-2 px-3 font-[family-name:var(--font-press-start)] text-[9px] uppercase tracking-wider transition-colors ${
            tab === "allTime"
              ? "bg-bg-panel text-green-glow"
              : "bg-bg-secondary text-text-dim"
          }`}
          style={{ touchAction: "manipulation" }}
        >
          All time
        </button>
        <button
          onClick={() => setTab("today")}
          className={`flex-1 py-2 px-3 font-[family-name:var(--font-press-start)] text-[9px] uppercase tracking-wider transition-colors border-l-2 border-border-arcade ${
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
        <p className="text-center text-text-dim text-sm py-6">
          Ei tuloksia vielä
        </p>
      ) : (
        <div className="space-y-1">
          {displayEntries.map((entry, i) => (
            <div
              key={`${entry.player_name}-${entry.created_at}-${i}`}
              className={`flex items-center gap-3 py-2 px-3 rounded border border-border-arcade/50 ${
                i === 0 ? "bg-bg-panel border-green-glow/30" : "bg-bg-secondary"
              }`}
            >
              <span className={`font-[family-name:var(--font-press-start)] text-[10px] w-6 text-center ${
                i === 0 ? "text-accent-glow" : "text-text-dim"
              }`}>
                {i + 1}
              </span>
              <span className="flex-1 font-semibold text-text-primary truncate text-sm uppercase tracking-wide">
                {entry.player_name}
              </span>
              <span className="text-xs text-text-dim">
                {entry.correct_answers}/{entry.total_questions}
              </span>
              <span className={`font-[family-name:var(--font-press-start)] text-[10px] tabular-nums ${
                i === 0 ? "text-green-glow glow-green" : "text-green-primary"
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
