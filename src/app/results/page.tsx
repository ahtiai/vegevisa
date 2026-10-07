"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getScorePercentage, getRankTitle } from "@/lib/scoring";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSound } from "@/hooks/useSound";
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

  const submissionId = searchParams.get("id") || "";
  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionId,
    );
  const [saveError, setSaveError] = useState("");

  const percentage = getScorePercentage(score, total);
  const rank = getRankTitle(percentage);

  const { data, loading, error, fetchLeaderboard, submitScore } =
    useLeaderboard();
  const { play, stop, initSounds } = useSound();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    initSounds();
  }, [fetchLeaderboard, initSounds]);

  const handleTallyStart = useCallback(() => {
    play("pointsCounter");
  }, [play]);

  const handleTallyEnd = useCallback(() => {
    stop("pointsCounter");
  }, [stop]);

  const handleSubmitScore = async (name: string) => {
    if (submitting || submitted || !validId) return;
    setSaveError("");
    setSubmitting(true);
    try {
      await submitScore({
        submissionId,
        playerName: name,
        score,
        correctAnswers: correct,
        totalQuestions: total,
        timePlayedSeconds: time,
      });
      setSubmitted(true);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Tallentaminen epäonnistui.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-10 max-w-lg mx-auto w-full">
      {/* Header */}
      <h1 className="font-[family-name:var(--font-press-start)] text-lg text-green-glow glow-green mb-10">
        GAME OVER
      </h1>

      {/* Score */}
      <ScoreDisplay
        score={score}
        onTallyStart={handleTallyStart}
        onTallyEnd={handleTallyEnd}
      />

      {/* Stats */}
      <p className="font-[family-name:var(--font-press-start)] text-xs text-white/70 mt-5">
        {correct}/{total} OIKEIN
      </p>

      {/* Rank */}
      <div className="mt-8 text-center arcade-panel rounded-lg px-8 py-6 w-full">
        <span className="text-4xl">{rank.emoji}</span>
        <p className="font-[family-name:var(--font-press-start)] text-sm text-white mt-3 leading-loose">
          {rank.title.toUpperCase()}
        </p>
      </div>

      {/* Name input */}
      <div className="w-full mt-10">
        {validId ? (
          <NameInput
            onSubmit={handleSubmitScore}
            loading={submitting}
            submitted={submitted}
          />
        ) : (
          <p role="alert">
            Pelin tunnus puuttuu. Aloita uusi peli tallentaaksesi tuloksen.
          </p>
        )}
        {saveError && (
          <p role="alert" className="text-red-300 mt-4">
            {saveError} Paina SAVE yrittääksesi uudelleen.
          </p>
        )}
      </div>

      {/* Share */}
      <div className="w-full mt-8">
        <ShareButtons score={score} correct={correct} total={total} />
      </div>

      {/* Leaderboard peek */}
      {error && (
        <div className="mt-6 text-center space-y-3">
          <p role="alert">Tuloslistan lataaminen epäonnistui. {error}</p>
          <button className="arcade-btn p-3" onClick={fetchLeaderboard}>
            Päivitä tuloslista
          </button>
        </div>
      )}
      {data && !loading && !error && (
        <div className="w-full mt-10">
          <Leaderboard allTime={data.allTime} today={data.today} compact />
        </div>
      )}

      {/* Actions */}
      <div className="w-full mt-10 space-y-4">
        <Link
          href="/"
          className="arcade-btn block w-full h-16 rounded-lg font-[family-name:var(--font-press-start)] text-sm text-green-glow text-center leading-[3.8rem] uppercase tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          Pelaa uudelleen
        </Link>
        <Link
          href="/leaderboard"
          className="arcade-btn block w-full py-3 rounded-lg text-center font-[family-name:var(--font-press-start)] text-[10px] text-text-secondary hover:text-green-glow transition-colors uppercase tracking-wider"
        >
          [ HIGH SCORES ]
        </Link>
      </div>

      {/* Pro Vege logo */}
      <footer className="mt-10 flex justify-center">
        <a
          href="https://provege.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          <Image
            src="/images/provege-pixel.svg"
            alt="Pro Vege"
            width={160}
            height={32}
            className="opacity-70 hover:opacity-100 transition-opacity"
          />
        </a>
      </footer>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="font-[family-name:var(--font-press-start)] text-sm text-green-glow glow-green animate-blink">
            LADATAAN...
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
