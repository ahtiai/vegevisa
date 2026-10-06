"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Question,
  QuizSettings as Settings,
  LeaderboardData,
} from "@/lib/quiz-types";
import { requestJSON } from "@/lib/client-api";
import QuestionsEditor from "./QuestionsEditor";
import QuizSettings from "./QuizSettings";
import HighScoreAdmin from "./HighScoreAdmin";
export default function AdminPanel({
  initialQuestions,
  initialSettings,
  initialScores,
}: {
  initialQuestions: Question[];
  initialSettings: Settings;
  initialScores: LeaderboardData;
}) {
  const router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="w-full max-w-5xl mx-auto px-5 py-10">
      <header className="flex justify-between items-start gap-4 mb-8">
        <div>
          <Link href="/" className="text-green-glow">
            ← VegeVisa
          </Link>
          <h1 className="text-3xl font-bold mt-3">Ylläpito</h1>
        </div>
        <button
          className="admin-secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await requestJSON("/api/admin/logout", { method: "POST" });
              router.replace("/admin/login");
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          Kirjaudu ulos
        </button>
      </header>
      {error && <p role="alert">{error}</p>}
      <nav aria-label="Ylläpidon osiot" className="flex flex-wrap gap-4 mb-10">
        <a href="#questions" className="admin-secondary">
          Kysymykset
        </a>
        <a href="#settings" className="admin-secondary">
          Visan asetukset
        </a>
        <a href="#scores" className="admin-secondary">
          Tulokset
        </a>
      </nav>
      <div className="space-y-12">
        <QuestionsEditor initialQuestions={initialQuestions} />
        <QuizSettings initialSettings={initialSettings} />
        <HighScoreAdmin initialScores={initialScores} />
      </div>
    </main>
  );
}
