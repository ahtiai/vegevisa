"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  onComplete: () => void;
}

export default function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);

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
      <div
        key={count}
        className="font-[family-name:var(--font-press-start)] text-7xl text-green-glow glow-green animate-pulse"
      >
        {count > 0 ? count : ""}
      </div>
      <p className="mt-6 font-[family-name:var(--font-press-start)] text-[10px] text-text-dim uppercase tracking-widest">
        Valmistaudu...
      </p>
    </div>
  );
}
