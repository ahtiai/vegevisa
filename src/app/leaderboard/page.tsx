"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  const { data, loading, fetchLeaderboard, resetLeaderboard } = useLeaderboard();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  const handleReset = async () => {
    const confirmed = window.confirm("Nollataanko high score -lista?");
    if (!confirmed) return;

    setResetting(true);
    try {
      await resetLeaderboard();
    } catch (err) {
      console.error("Failed to reset leaderboard:", err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
      <h1 className="font-[family-name:var(--font-press-start)] text-lg text-green-glow glow-green mb-10">
        HIGH SCORES
      </h1>

      {loading && (
        <p className="font-[family-name:var(--font-press-start)] text-xs text-text-dim animate-blink">
          LADATAAN...
        </p>
      )}

      {data && !loading && (
        <div className="w-full">
          <Leaderboard allTime={data.allTime} today={data.today} />
        </div>
      )}

      <Link
        href="/"
        className="arcade-btn mt-10 px-10 h-14 rounded-lg font-[family-name:var(--font-press-start)] text-xs text-green-glow text-center leading-[3.2rem] uppercase tracking-wider inline-block"
        style={{ touchAction: "manipulation" }}
      >
        Pelaa
      </Link>

      <button
        type="button"
        onClick={handleReset}
        disabled={resetting}
        className="mt-4 px-6 py-3 rounded-lg border-2 border-border-arcade bg-bg-secondary font-[family-name:var(--font-press-start)] text-[10px] text-text-secondary hover:text-green-glow disabled:opacity-50 transition-colors uppercase tracking-wider"
        style={{ touchAction: "manipulation" }}
      >
        {resetting ? "Nollataan..." : "Nollaa high score"}
      </button>
    </main>
  );
}
