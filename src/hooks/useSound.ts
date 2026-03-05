"use client";

import { useRef, useCallback } from "react";
import { Howl } from "howler";

type SoundName = "correct" | "wrong" | "countdown" | "timeIsUp" | "pointsCounter" | "click";

const SOUND_CONFIG: Record<SoundName, { src: string; volume: number; loop?: boolean }> = {
  correct: { src: "/sounds/right-answer.wav", volume: 0.6 },
  wrong: { src: "/sounds/wrong-answer.wav", volume: 0.6 },
  countdown: { src: "/sounds/countdown.wav", volume: 0.5 },
  timeIsUp: { src: "/sounds/time-is-up.wav", volume: 0.5 },
  pointsCounter: { src: "/sounds/points-counter.wav", volume: 0.5, loop: true },
  click: { src: "/sounds/click.wav", volume: 0.4 },
};

export function useSound() {
  const sounds = useRef<Partial<Record<SoundName, Howl>>>({});
  const initialized = useRef(false);

  const initSounds = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;

    for (const [name, config] of Object.entries(SOUND_CONFIG)) {
      sounds.current[name as SoundName] = new Howl({
        src: [config.src],
        volume: config.volume,
        loop: config.loop || false,
        preload: true,
      });
    }
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!initialized.current) initSounds();
    sounds.current[name]?.play();
  }, [initSounds]);

  const stop = useCallback((name: SoundName) => {
    sounds.current[name]?.stop();
  }, []);

  return { play, stop, initSounds };
}
