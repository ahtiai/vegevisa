"use client";

import { useEffect } from "react";
import { useSound } from "@/hooks/useSound";

export default function ClickSound() {
  const { play, initSounds } = useSound();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, [role='button']")) {
        initSounds();
        play("click");
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [play, initSounds]);

  return null;
}
