"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartScreen() {
  const router = useRouter();

  const handleStart = (count: 5 | 10) => {
    router.push(`/play?count=${count}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {/* Logo area */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-green-primary font-[var(--font-quicksand)]">
          🌿 VegeVisa 🌿
        </h1>
        <p className="mt-3 text-text-secondary text-lg">
          Testaa kasvistietosi!
        </p>
      </div>

      {/* Start buttons */}
      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => handleStart(5)}
          className="w-full h-16 rounded-2xl bg-green-primary text-white text-xl font-bold shadow-md active:scale-[0.97] transition-transform"
          style={{ touchAction: "manipulation" }}
        >
          5 kysymystä
        </button>
        <button
          onClick={() => handleStart(10)}
          className="w-full h-16 rounded-2xl bg-accent text-text-primary text-xl font-bold shadow-md active:scale-[0.97] transition-transform"
          style={{ touchAction: "manipulation" }}
        >
          10 kysymystä
        </button>
      </div>

      {/* Leaderboard link */}
      <Link
        href="/leaderboard"
        className="mt-8 text-text-secondary underline underline-offset-2 text-sm"
      >
        Katso tulostaulukko
      </Link>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-xs text-text-secondary/60">
        Powered by{" "}
        <a
          href="https://provege.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Pro Vege
        </a>
      </footer>
    </main>
  );
}
