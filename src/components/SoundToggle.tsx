"use client";

import { useState, useEffect } from "react";
import { Howler } from "howler";

export default function SoundToggle() {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("vegevisa-muted");
    const muted = saved !== "false";
    setIsMuted(muted);
    Howler.volume(muted ? 0 : 1);
  }, []);

  const toggle = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("vegevisa-muted", String(next));
      Howler.volume(next ? 0 : 1);
      return next;
    });
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center rounded-md border-2 border-border-bright bg-bg-panel text-sm active:scale-95 transition-transform hover:border-green-glow"
      style={{ touchAction: "manipulation" }}
      aria-label={isMuted ? "Äänet päälle" : "Äänet pois"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
