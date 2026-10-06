"use client";
import { useState } from "react";
import type { QuizSettings as Settings } from "@/lib/quiz-types";
import { requestJSON } from "@/lib/client-api";
export default function QuizSettings({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState(initialSettings),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section id="settings" className="scroll-mt-6">
      <h2 className="text-2xl font-bold mb-2">Visan asetukset</h2>
      <p className="text-text-secondary mb-5">
        Muutokset koskevat uusia pelejä. Käynnissä oleva peli jatkuu samoilla
        asetuksilla.
      </p>
      <form
        className="admin-form arcade-panel p-5 rounded-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMessage("");
          try {
            setSettings(
              await requestJSON<Settings>("/api/admin/settings", {
                method: "PUT",
                body: JSON.stringify(settings),
              }),
            );
            setMessage("Asetukset tallennettu.");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid sm:grid-cols-3 gap-4">
          {settings.questionCounts.map((n, i) => (
            <label key={i}>
              Kysymysmäärä {i + 1}
              <input
                disabled={busy}
                type="number"
                required
                min={1}
                max={20}
                value={n}
                onChange={(e) => {
                  const counts = [...settings.questionCounts] as [
                    number,
                    number,
                  ];
                  counts[i] = Number(e.target.value);
                  setSettings({ ...settings, questionCounts: counts });
                  setMessage("");
                }}
              />
            </label>
          ))}
          <label>
            Aikaa / kysymys (sekuntia)
            <input
              disabled={busy}
              type="number"
              required
              min={5}
              max={120}
              value={settings.questionTimeSeconds}
              onChange={(e) => {
                setSettings({
                  ...settings,
                  questionTimeSeconds: Number(e.target.value),
                });
                setMessage("");
              }}
            />
          </label>
        </div>
        <p className="text-sm text-text-secondary">
          Kysymysmääriä varten on oltava tarpeeksi aktiivisia kysymyksiä.
          Enimmäispisteet: 2 000 / kysymys.
        </p>
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
        <div className="flex flex-wrap gap-3">
          <button className="arcade-btn p-3 rounded-lg" disabled={busy}>
            Tallenna asetukset
          </button>
          <button
            type="button"
            disabled={busy}
            className="admin-secondary"
            onClick={async () => {
              if (
                !confirm(
                  "Ladataanko tallennetut asetukset ja hylätään muutokset?",
                )
              )
                return;
              setBusy(true);
              try {
                setSettings(await requestJSON<Settings>("/api/admin/settings"));
                setError("");
                setMessage("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Lataa asetukset uudelleen
          </button>
        </div>
      </form>
    </section>
  );
}
