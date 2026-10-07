"use client";
import { useState } from "react";
import type { Question, QuestionInput } from "@/lib/quiz-types";
import { requestJSON } from "@/lib/client-api";
const empty: QuestionInput = {
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  active: true,
  difficulty: null,
};
export default function QuestionsEditor({
  initialQuestions,
}: {
  initialQuestions: Question[];
}) {
  const [questions, setQuestions] = useState(initialQuestions),
    [selected, setSelected] = useState<Question | null>(null),
    [draft, setDraft] = useState<QuestionInput>(empty),
    [editing, setEditing] = useState(false),
    [dirty, setDirty] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  function choose(q: Question | null) {
    if (dirty && !confirm("Hylätäänkö tallentamattomat muutokset?")) return;
    setSelected(q);
    setDraft(q ?? { ...empty, options: [...empty.options] });
    setEditing(true);
    setDirty(false);
    setError("");
    setMessage("");
  }
  function edit(values: Partial<QuestionInput>) {
    setDraft({ ...draft, ...values });
    setDirty(true);
    setMessage("");
  }
  async function reload() {
    if (
      dirty &&
      !confirm(
        "Ladataanko tallennetut tiedot? Tallentamattomat muutokset menetetään.",
      )
    )
      return;
    setBusy(true);
    try {
      setQuestions(await requestJSON<Question[]>("/api/admin/questions"));
      setEditing(false);
      setDirty(false);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="questions" className="scroll-mt-6">
      <div className="flex flex-wrap justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold">Kysymykset</h2>
          <p className="text-text-secondary">
            {questions.filter((q) => q.active).length} aktiivista ·{" "}
            {questions.length} yhteensä
          </p>
        </div>
        <button
          className="admin-secondary"
          disabled={busy}
          onClick={() => choose(null)}
        >
          Lisää kysymys
        </button>
      </div>
      <div className="admin-form grid sm:grid-cols-2 gap-4 mb-5">
        <label>
          Hae kysymyksiä
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Näytä
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Kaikki</option>
            <option value="active">Aktiiviset</option>
            <option value="inactive">Ei aktiiviset</option>
          </select>
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="max-h-[32rem] overflow-auto space-y-2 pr-1">
          {questions
            .filter(
              (q) =>
                q.question.toLowerCase().includes(search.toLowerCase()) &&
                (filter === "all" || q.active === (filter === "active")),
            )
            .map((q) => (
              <button
                type="button"
                key={q.id}
                disabled={busy}
                onClick={() => choose(q)}
                className={`text-left w-full p-4 rounded-lg border ${selected?.id === q.id ? "border-green-glow bg-bg-panel" : "border-border-arcade bg-bg-secondary"}`}
              >
                <span className="block font-bold">{q.question}</span>
                <span className="text-sm text-text-secondary">
                  {q.active ? "Aktiivinen" : "Ei aktiivinen"}
                </span>
              </button>
            ))}
        </div>
        {editing ? (
          <form
            className="admin-form arcade-panel rounded-xl p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              setMessage("");
              try {
                const saved = await requestJSON<Question>(
                  selected
                    ? `/api/admin/questions/${encodeURIComponent(selected.id)}`
                    : "/api/admin/questions",
                  {
                    method: selected ? "PUT" : "POST",
                    body: JSON.stringify({
                      ...draft,
                      revision: selected?.revision,
                    }),
                  },
                );
                setQuestions((qs) =>
                  selected
                    ? qs.map((q) => (q.id === saved.id ? saved : q))
                    : [...qs, saved],
                );
                setSelected(saved);
                setDraft(saved);
                setDirty(false);
                setMessage("Kysymys tallennettu.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <h3 className="font-bold text-xl">
              {selected ? "Muokkaa kysymystä" : "Uusi kysymys"}
            </h3>
            <label>
              Kysymys
              <textarea
                disabled={busy}
                required
                maxLength={1000}
                rows={3}
                value={draft.question}
                onChange={(e) => edit({ question: e.target.value })}
              />
            </label>
            {draft.options.map((o, i) => (
              <label key={i}>
                Vastaus {"ABCD"[i]}
                <input
                  disabled={busy}
                  required
                  maxLength={300}
                  value={o}
                  onChange={(e) => {
                    const options = [
                      ...draft.options,
                    ] as QuestionInput["options"];
                    options[i] = e.target.value;
                    edit({ options });
                  }}
                />
              </label>
            ))}
            <label>
              Oikea vastaus
              <select
                disabled={busy}
                value={draft.correctIndex}
                onChange={(e) => edit({ correctIndex: Number(e.target.value) })}
              >
                {draft.options.map((_, i) => (
                  <option key={i} value={i}>
                    {"ABCD"[i]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3">
              <input
                disabled={busy}
                className="!w-auto"
                type="checkbox"
                checked={draft.active}
                onChange={(e) => edit({ active: e.target.checked })}
              />
              Käytössä visassa
            </label>
            <p className="text-sm text-text-secondary">
              Poista kysymys käytöstä säilyttämällä se listassa.
            </p>
            <button disabled={busy} className="arcade-btn p-3 rounded-lg">
              {busy ? "Tallennetaan…" : "Tallenna kysymys"}
            </button>
          </form>
        ) : (
          <p className="p-5 text-text-secondary">
            Valitse kysymys tai lisää uusi.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-300 mt-4">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-green-glow mt-4">
          {message}
        </p>
      )}
      <button className="admin-secondary mt-4" disabled={busy} onClick={reload}>
        Lataa kysymykset uudelleen
      </button>
    </section>
  );
}
