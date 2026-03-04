"use client";

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-lg border-3 border-border-bright bg-bg-panel text-xl active:scale-95 transition-transform hover:border-green-glow"
      style={{ touchAction: "manipulation" }}
      aria-label={isMuted ? "Äänet päälle" : "Äänet pois"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
