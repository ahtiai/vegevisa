"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export function useTimer(onTimeUp: () => void, totalTime: number) {
  const [timeRemaining, setTimeRemaining] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const pausedAtRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    pausedAtRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const runInterval = useCallback(
    (fromTime: number) => {
      clearTimer();
      startTimeRef.current = Date.now();
      const baseRemaining = fromTime;

      intervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const remaining = Math.max(0, baseRemaining - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          stop();
          onTimeUpRef.current();
        }
      }, 50);
    },
    [clearTimer, stop],
  );

  const start = useCallback(() => {
    stop();
    setTimeRemaining(totalTime);
    setIsRunning(true);
    pausedAtRef.current = null;
    runInterval(totalTime);
  }, [stop, runInterval, totalTime]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    setIsRunning(false);
    pausedAtRef.current = timeRemaining;
  }, [isRunning, timeRemaining, clearTimer]);

  const resume = useCallback(() => {
    if (pausedAtRef.current === null) return;
    setIsRunning(true);
    runInterval(pausedAtRef.current);
    pausedAtRef.current = null;
  }, [runInterval]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    pause,
    resume,
    totalTime: totalTime,
  };
}
