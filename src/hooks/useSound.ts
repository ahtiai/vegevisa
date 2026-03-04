"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Howl } from "howler";

type SoundName = "correct" | "wrong" | "countdown" | "tick" | "gameover" | "buttonTap" | "highscore" | "bgMusic";

const SOUND_CONFIG: Record<SoundName, { src: string; volume: number; loop?: boolean }> = {
  correct: { src: "/sounds/correct.mp3", volume: 0.6 },
  wrong: { src: "/sounds/wrong.mp3", volume: 0.6 },
  countdown: { src: "/sounds/countdown.mp3", volume: 0.5 },
  tick: { src: "/sounds/tick.mp3", volume: 0.4 },
  gameover: { src: "/sounds/gameover.mp3", volume: 0.6 },
  buttonTap: { src: "/sounds/button-tap.mp3", volume: 0.3 },
  highscore: { src: "/sounds/highscore.mp3", volume: 0.7 },
  bgMusic: { src: "/sounds/bg-music.mp3", volume: 0.15, loop: true },
};

export function useSound() {
  const sounds = useRef<Partial<Record<SoundName, Howl>>>({});
  const [isMuted, setIsMuted] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("vegevisa-muted");
    if (saved === "false") setIsMuted(false);
  }, []);

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
    const sound = sounds.current[name];
    if (sound && !isMuted) {
      sound.play();
    }
  }, [isMuted, initSounds]);

  const stopBgMusic = useCallback(() => {
    sounds.current.bgMusic?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("vegevisa-muted", String(next));
      if (next) {
        Howler.volume(0);
      } else {
        Howler.volume(1);
        if (!initialized.current) initSounds();
      }
      return next;
    });
  }, [initSounds]);

  return { play, stopBgMusic, isMuted, toggleMute, initSounds };
}
