"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StartScreen() {
  const router = useRouter();

  const handleStart = (count: 5 | 10) => {
    router.push(`/play?count=${count}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="text-center mb-14">
        <h1 className="font-[family-name:var(--font-press-start)] text-3xl sm:text-4xl text-green-glow glow-green leading-relaxed">
          VEGEVISA
        </h1>
        <div className="mt-4 font-[family-name:var(--font-press-start)] text-xs text-text-secondary tracking-widest">
          KASVISTIETOVISA
        </div>
        <p className="mt-5 text-text-secondary text-xl font-bold">
          Testaa kasvistietosi!
        </p>
      </div>

      {/* Start buttons */}
      <div className="w-full max-w-sm space-y-5">
        <button
          onClick={() => handleStart(5)}
          className="arcade-btn w-full h-20 rounded-lg text-green-glow font-[family-name:var(--font-press-start)] text-sm tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          5 KYSYMYSTÄ
        </button>
        <button
          onClick={() => handleStart(10)}
          className="arcade-btn w-full h-20 rounded-lg text-accent font-[family-name:var(--font-press-start)] text-sm tracking-wider"
          style={{ touchAction: "manipulation" }}
        >
          10 KYSYMYSTÄ
        </button>
      </div>

      {/* Leaderboard link */}
      <Link
        href="/leaderboard"
        className="mt-12 arcade-btn px-8 py-3 rounded-lg font-[family-name:var(--font-press-start)] text-[11px] text-text-secondary hover:text-green-glow transition-colors uppercase tracking-wider"
      >
        [ HIGH SCORES ]
      </Link>

      {/* Footer */}
      <footer className="mt-auto pt-10 text-center text-sm text-text-dim font-bold">
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
