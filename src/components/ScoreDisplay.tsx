"use client";

import { useEffect, useRef, useState } from "react";

interface ScoreDisplayProps {
  score: number;
  duration?: number;
  onTallyStart?: () => void;
  onTallyEnd?: () => void;
}

export default function ScoreDisplay({ score, duration = 1500, onTallyStart, onTallyEnd }: ScoreDisplayProps) {
  const [displayed, setDisplayed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (score === 0) {
      setDisplayed(0);
      return;
    }

    // Small delay to ensure sound is initialized before tally starts
    const startDelay = setTimeout(() => {
      onTallyStart?.();

      const steps = 30;
      const increment = score / steps;
      const stepDuration = duration / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        setDisplayed(Math.min(Math.round(increment * step), score));
        if (step >= steps) {
          clearInterval(interval);
          onTallyEnd?.();
        }
      }, stepDuration);

      intervalRef.current = interval;
    }, 300);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, duration, onTallyStart, onTallyEnd]);

  return (
    <div className="text-center arcade-panel rounded-xl px-10 py-8">
      <div className="font-[family-name:var(--font-press-start)] text-4xl sm:text-5xl text-white tabular-nums">
        {displayed.toLocaleString("fi-FI")}
      </div>
      <p className="font-[family-name:var(--font-press-start)] text-xs text-white/60 mt-4 uppercase tracking-widest">
        Pistettä
      </p>
    </div>
  );
}
