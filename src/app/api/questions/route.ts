import { NextRequest, NextResponse } from "next/server";
import { fetchQuestionsFromSheets, RawQuestion } from "@/lib/google-sheets";
import { shuffle } from "@/lib/shuffle";
import fallbackQuestions from "@/data/questions-fallback.json";

export interface QuestionResponse {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

function formatQuestions(raw: RawQuestion[], count: number): QuestionResponse[] {
  const selected = shuffle(raw).slice(0, count);

  return selected.map((q) => {
    const optionMap: Record<string, string> = {
      a: q.option_a,
      b: q.option_b,
      c: q.option_c,
      d: q.option_d,
    };
    const correctAnswer = optionMap[q.correct];
    const options = shuffle([q.option_a, q.option_b, q.option_c, q.option_d]);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: q.id,
      question: q.question,
      options,
      correctIndex,
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get("count") || "10", 10), 20);

  let source: "sheets" | "fallback" = "sheets";
  let questions: QuestionResponse[];

  try {
    const raw = await fetchQuestionsFromSheets();
    questions = formatQuestions(raw, count);
  } catch {
    source = "fallback";
    const raw = fallbackQuestions as RawQuestion[];
    questions = formatQuestions(raw, count);
  }

  return NextResponse.json({ questions, source });
}
