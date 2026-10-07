import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, listQuestions } from "@/lib/quiz-store";
import { getLeaderboard } from "@/lib/score-store";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import AdminPanel from "@/components/admin/AdminPanel";
export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AppError && e.status === 401) redirect("/admin/login");
    throw new Error("Ylläpidon tietoja ei voitu ladata.");
  }
  const [questions, settings, scores] = await Promise.all([
    listQuestions(),
    getSettings(),
    getLeaderboard(),
  ]);
  return (
    <AdminPanel
      initialQuestions={questions}
      initialSettings={settings}
      initialScores={scores}
    />
  );
}
