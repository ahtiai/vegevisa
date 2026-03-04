"use client";

import { useEffect, useState } from "react";

interface ScoreDisplayProps {
  score: number;
  duration?: number; // ms for roll-up animation
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
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setDisplayed(current);
      if (step >= steps) clearInterval(interval);
    }, stepDuration);

    return () => clearInterval(interval);
  }, [score, duration]);

  return (
    <div className="text-center">
      <div className="text-6xl font-bold text-green-primary tabular-nums">
        {displayed.toLocaleString("fi-FI")}
      </div>
      <p className="text-text-secondary mt-1">pistettä</p>
    </div>
  );
}
