import { getGameData } from "@/lib/quiz-store";
import { shuffle } from "@/lib/shuffle";
import { json, apiError } from "@/lib/api";
import { AppError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export interface QuestionResponse {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}
export async function GET(request: Request) {
  try {
    const { settings, questions } = await getGameData();
    const raw = new URL(request.url).searchParams.get("count");
    const count = raw === null ? settings.questionCounts[1] : Number(raw);
    if (
      (raw !== null && !/^\d+$/.test(raw)) ||
      !settings.questionCounts.includes(count)
    )
      throw new AppError(400, "Valitse etusivulta visan pituus.");
    if (questions.length < count)
      throw new AppError(
        503,
        "Visassa ei ole tarpeeksi aktiivisia kysymyksiä.",
      );
    const selected = shuffle(questions)
      .slice(0, count)
      .map((q) => {
        const options = shuffle(q.options);
        return {
          id: q.id,
          question: q.question,
          options,
          correctIndex: options.indexOf(q.options[q.correctIndex]),
        };
      });
    return json({
      questions: selected,
      settings: { questionTimeSeconds: settings.questionTimeSeconds },
    });
  } catch (e) {
    return apiError(e, "Load game");
  }
}
