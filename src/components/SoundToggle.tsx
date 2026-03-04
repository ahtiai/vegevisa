"use client";

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded border border-border-arcade bg-bg-panel text-lg active:scale-95 transition-transform hover:border-green-glow"
      style={{ touchAction: "manipulation" }}
      aria-label={isMuted ? "Äänet päälle" : "Äänet pois"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
