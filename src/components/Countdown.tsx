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
        className="text-8xl font-bold text-green-primary animate-pulse"
      >
        {count > 0 ? count : ""}
      </div>
      <p className="mt-4 text-text-secondary text-lg">Valmistaudu...</p>
    </div>
  );
}
