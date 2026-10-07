"use client";
import { useState } from "react";
import Link from "next/link";
import { requestJSON } from "@/lib/client-api";
export default function LoginPage() {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="w-full max-w-md mx-auto px-6 py-16">
      <Link href="/" className="text-green-glow">
        ← VegeVisa
      </Link>
      <h1 className="text-3xl font-bold mt-8 mb-3">Ylläpito</h1>
      <p className="text-text-secondary mb-8">Kirjaudu muokkaamaan visaa.</p>
      <form
        className="admin-form arcade-panel p-6 rounded-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await requestJSON("/api/admin/login", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            window.location.replace("/admin");
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Kirjautuminen epäonnistui.",
            );
            setBusy(false);
          }
        }}
      >
        <label>
          Salasana
          <input
            autoComplete="current-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-300">
            {error}
          </p>
        )}
        <button className="arcade-btn px-6 py-3 rounded-lg" disabled={busy}>
          {busy ? "Kirjaudutaan…" : "Kirjaudu"}
        </button>
      </form>
    </main>
  );
}
