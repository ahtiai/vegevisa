"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const TOTAL_TIME = 15;

export function useTimer(onTimeUp: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    setTimeRemaining(TOTAL_TIME);
    setIsRunning(true);

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, TOTAL_TIME - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        stop();
        onTimeUpRef.current();
      }
    }, 50); // update frequently for smooth bar
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { timeRemaining, isRunning, start, stop, totalTime: TOTAL_TIME };
}
