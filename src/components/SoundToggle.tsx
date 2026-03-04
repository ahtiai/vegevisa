"use client";

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ isMuted, onToggle }: SoundToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur shadow-sm text-xl active:scale-95 transition-transform"
      style={{ touchAction: "manipulation" }}
      aria-label={isMuted ? "Äänet päälle" : "Äänet pois"}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}
