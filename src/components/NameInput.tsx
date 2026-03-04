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
      <p className="font-[family-name:var(--font-press-start)] text-[10px] text-correct glow-green text-center uppercase">
        Tulos tallennettu!
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
      className="flex gap-2 w-full"
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="NIMESI"
        maxLength={30}
        className="flex-1 h-12 px-4 rounded-lg border-2 border-border-arcade bg-bg-panel text-text-primary placeholder:text-text-dim focus:outline-none focus:border-green-glow font-semibold uppercase tracking-wide"
      />
      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="arcade-btn h-12 px-5 rounded-lg text-green-glow font-[family-name:var(--font-press-start)] text-[10px] disabled:opacity-30 uppercase"
        style={{ touchAction: "manipulation" }}
      >
        {loading ? "..." : "OK"}
      </button>
    </form>
  );
}
