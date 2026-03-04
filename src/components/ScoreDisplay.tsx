"use client";

import { useEffect, useState } from "react";

interface ScoreDisplayProps {
  score: number;
  duration?: number;
}

export default function ScoreDisplay({ score, duration = 1500 }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (score === 0) {
      setDisplayed(0);
      return;
    }

    const steps = 30;
    const increment = score / steps;
    const stepDuration = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setDisplayed(Math.min(Math.round(increment * step), score));
      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [score, duration]);

  return (
    <div className="text-center">
      <div className="font-[family-name:var(--font-press-start)] text-4xl sm:text-5xl text-green-glow glow-green tabular-nums">
        {displayed.toLocaleString("fi-FI")}
      </div>
      <p className="font-[family-name:var(--font-press-start)] text-[10px] text-text-dim mt-3 uppercase">
        Pistettä
      </p>
    </div>
  );
}
