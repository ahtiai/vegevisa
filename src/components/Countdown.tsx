"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  onComplete: () => void;
  onStart?: () => void;
}

export default function Countdown({ onComplete, onStart }: CountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    onStart?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="arcade-panel rounded-xl px-16 py-12">
        <div
          key={count}
          className="font-[family-name:var(--font-press-start)] text-8xl text-green-glow glow-green animate-pulse text-center"
        >
          {count > 0 ? count : ""}
        </div>
        <p className="mt-8 font-[family-name:var(--font-press-start)] text-xs text-text-dim uppercase tracking-widest text-center">
          Valmistaudu...
        </p>
      </div>
    </div>
  );
}
