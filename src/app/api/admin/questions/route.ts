import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { listQuestions, createQuestion } from "@/lib/quiz-store";
import { json, apiError, readBody } from "@/lib/api";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return json(await listQuestions());
  } catch (e) {
    return apiError(e, "List questions");
  }
}
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    requireSameOrigin(request);
    return json(await createQuestion(await readBody(request)));
  } catch (e) {
    return apiError(e, "Create question");
  }
}
