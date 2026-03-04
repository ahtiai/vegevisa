"use client";

import { useState } from "react";

interface NameInputProps {
  onSubmit: (name: string) => void;
  loading: boolean;
  submitted: boolean;
}

export default function NameInput({ onSubmit, loading, submitted }: NameInputProps) {
  const [name, setName] = useState("");

  if (submitted) {
    return (
      <div className="arcade-panel rounded-lg p-4 text-center">
        <p className="font-[family-name:var(--font-press-start)] text-xs text-white uppercase">
          Tulos tallennettu!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
      className="flex gap-3 w-full"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NIMESI"
        maxLength={30}
        className="flex-1 h-14 px-5 rounded-lg border-3 border-border-bright bg-bg-panel text-text-primary text-lg placeholder:text-text-dim focus:outline-none focus:border-green-glow font-bold uppercase tracking-wide"
      />
      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="arcade-btn h-14 px-6 rounded-lg text-green-glow font-[family-name:var(--font-press-start)] text-xs disabled:opacity-30 uppercase"
        style={{ touchAction: "manipulation" }}
      >
        {loading ? "..." : "SAVE"}
      </button>
    </form>
  );
}
