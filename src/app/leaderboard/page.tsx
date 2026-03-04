"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  const { data, loading, fetchLeaderboard } = useLeaderboard();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-8 max-w-lg mx-auto w-full">
      <h1 className="text-2xl font-bold text-green-primary mb-6">🌿 Tulostaulukko</h1>

      {loading && <p className="text-text-secondary">Ladataan...</p>}

      {data && !loading && (
        <div className="w-full">
          <Leaderboard allTime={data.allTime} today={data.today} />
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block px-8 h-12 rounded-2xl bg-green-primary text-white font-bold text-center leading-[3rem] active:scale-[0.97] transition-transform"
        style={{ touchAction: "manipulation" }}
      >
        Pelaa
      </Link>
    </main>
  );
}
