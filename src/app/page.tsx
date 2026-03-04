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
      <div className="text-center mb-12">
        <h1 className="font-[family-name:var(--font-press-start)] text-2xl sm:text-3xl text-green-glow glow-green leading-relaxed">
          VEGEVISA
        </h1>
        <div className="mt-3 font-[family-name:var(--font-press-start)] text-[10px] text-text-secondary tracking-wider">
          KASVISTIETOVISA
        </div>
        <p className="mt-4 text-text-secondary text-base">
          Testaa kasvistietosi!
        </p>
      </div>

      {/* Start buttons */}
      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => handleStart(5)}
          className="arcade-btn w-full h-16 rounded-lg text-green-glow font-[family-name:var(--font-press-start)] text-xs tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          5 KYSYMYSTÄ
        </button>
        <button
          onClick={() => handleStart(10)}
          className="arcade-btn w-full h-16 rounded-lg text-accent font-[family-name:var(--font-press-start)] text-xs tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          10 KYSYMYSTÄ
        </button>
      </div>

      {/* Leaderboard link */}
      <Link
        href="/leaderboard"
        className="mt-10 font-[family-name:var(--font-press-start)] text-[10px] text-text-dim hover:text-green-glow transition-colors uppercase tracking-wider"
      >
        [ Tulostaulukko ]
      </Link>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-center text-xs text-text-dim">
        <a
          href="https://provege.fi"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-text-secondary transition-colors"
        >
          provege.fi
        </a>
      </footer>
    </main>
  );
}
