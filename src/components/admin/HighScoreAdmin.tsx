"use client";
import { useState } from "react";
import type { LeaderboardData } from "@/lib/quiz-types";
import Leaderboard from "@/components/Leaderboard";
import { requestJSON } from "@/lib/client-api";
export default function HighScoreAdmin({
  initialScores,
}: {
  initialScores: LeaderboardData;
}) {
  const [scores, setScores] = useState(initialScores),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function reset(scope: "today" | "all") {
    if (
      !confirm(
        scope === "today"
          ? "Tyhjennetäänkö tämän päivän lista? All time -lista säilyy."
          : "Tyhjennetäänkö molemmat tuloslistat? Tallennetut tulokset säilyvät varmuuskopiossa.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await requestJSON("/api/admin/scores/reset", {
        method: "POST",
        body: JSON.stringify({ scope }),
      });
      setMessage("Valittu lista nollattu.");
      setScores(await requestJSON<LeaderboardData>("/api/scores/leaderboard"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="scores" className="scroll-mt-6">
      <h2 className="text-2xl font-bold mb-2">Tulokset</h2>
      <p className="text-text-secondary mb-5">
        Päivä vaihtuu Suomen ajassa. Nollaus tyhjentää näkyvän listan;
        tallennetut tulokset säilyvät.
      </p>
      <div className="max-w-xl">
        <Leaderboard allTime={scores.allTime} today={scores.today} />
      </div>
      <div className="flex flex-wrap gap-3 my-5">
        <button
          className="admin-secondary"
          disabled={busy}
          onClick={() => reset("today")}
        >
          Nollaa tänään
        </button>
        <button
          className="admin-secondary !border-red-400"
          disabled={busy}
          onClick={() => reset("all")}
        >
          Nollaa kaikki
        </button>
        <button
          className="admin-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              setScores(
                await requestJSON<LeaderboardData>("/api/scores/leaderboard"),
              );
              setError("");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Päivitä tulokset
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-green-glow">
          {message}
        </p>
      )}
      <div className="border-t border-border-arcade pt-5 mt-8">
        <h3 className="text-xl font-bold">Varmuuskopio</h3>
        <p className="text-text-secondary my-3">
          Lataa kysymykset, asetukset ja kaikki tallennetut tulokset
          JSON-tiedostona.
        </p>
        <button
          disabled={busy}
          className="admin-secondary"
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const data = await requestJSON("/api/admin/backup");
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = `vegevisa-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Lataa varmuuskopio
        </button>
      </div>
    </section>
  );
}
