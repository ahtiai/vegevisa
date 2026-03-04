"use client";

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-3 left-3 z-50 w-8 h-8 flex items-center justify-center rounded-md border-2 border-border-bright bg-bg-panel text-sm active:scale-95 transition-transform hover:border-green-glow"
      style={{ touchAction: "manipulation" }}
      aria-label={isMuted ? "Äänet päälle" : "Äänet pois"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
