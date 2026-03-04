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
      <p className="text-green-primary font-medium text-center">
        &#10003; Tulos tallennettu!
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
        placeholder="Nimesi"
        maxLength={30}
        className="flex-1 h-12 px-4 rounded-xl border border-green-light/50 bg-white text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-green-primary/30"
      />
      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="h-12 px-5 rounded-xl bg-green-primary text-white font-medium disabled:opacity-50 active:scale-95 transition-transform"
        style={{ touchAction: "manipulation" }}
      >
        {loading ? "..." : "Tallenna"}
      </button>
    </form>
  );
}
