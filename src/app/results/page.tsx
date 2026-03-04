"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getScorePercentage, getRankTitle } from "@/lib/scoring";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import ScoreDisplay from "@/components/ScoreDisplay";
import NameInput from "@/components/NameInput";
import ShareButtons from "@/components/ShareButtons";
import Leaderboard from "@/components/Leaderboard";

function ResultsContent() {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0");
  const correct = parseInt(searchParams.get("correct") || "0");
  const total = parseInt(searchParams.get("total") || "10");
  const time = parseInt(searchParams.get("time") || "0");

  const percentage = getScorePercentage(score, total);
  const rank = getRankTitle(percentage);

  const { data, loading, fetchLeaderboard, submitScore } = useLeaderboard();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSubmitScore = async (name: string) => {
    setSubmitting(true);
    try {
      await submitScore({
        playerName: name,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        timePlayedSeconds: time,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit score:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-8 max-w-lg mx-auto w-full">
      {/* Header */}
      <h1 className="font-[family-name:var(--font-press-start)] text-sm text-green-glow glow-green mb-8">
        GAME OVER
      </h1>

      {/* Score */}
      <ScoreDisplay score={score} />

      {/* Stats */}
      <p className="font-[family-name:var(--font-press-start)] text-[10px] text-text-secondary mt-3">
        {correct}/{total} OIKEIN
      </p>

      {/* Rank */}
      <div className="mt-6 text-center arcade-panel rounded-lg px-6 py-4">
        <span className="text-3xl">{rank.emoji}</span>
        <p className="font-[family-name:var(--font-press-start)] text-xs text-accent glow-accent mt-2 leading-relaxed">
          {rank.title.toUpperCase()}
        </p>
      </div>

      {/* Name input */}
      <div className="w-full mt-8">
        <NameInput onSubmit={handleSubmitScore} loading={submitting} submitted={submitted} />
      </div>

      {/* Share */}
      <div className="w-full mt-6">
        <ShareButtons score={score} correct={correct} total={total} />
      </div>

      {/* Leaderboard peek */}
      {data && !loading && (
        <div className="w-full mt-8">
          <Leaderboard allTime={data.allTime} today={data.today} compact />
        </div>
      )}

      {/* Actions */}
      <div className="w-full mt-8 space-y-3">
        <Link
          href="/"
          className="arcade-btn block w-full h-14 rounded-lg font-[family-name:var(--font-press-start)] text-xs text-green-glow text-center leading-[3.5rem] uppercase tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          Pelaa uudelleen
        </Link>
        <Link
          href="/leaderboard"
          className="block w-full text-center font-[family-name:var(--font-press-start)] text-[9px] text-text-dim hover:text-green-glow transition-colors uppercase tracking-wider"
        >
          [ Tulostaulukko ]
        </Link>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="font-[family-name:var(--font-press-start)] text-xs text-green-glow glow-green animate-blink">
            LADATAAN...
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
