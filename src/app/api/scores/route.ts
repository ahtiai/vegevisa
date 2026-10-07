import { saveScore } from "@/lib/score-store";
import { json, apiError, readBody } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    return json(await saveScore(await readBody(request)));
  } catch (e) {
    return apiError(e, "Save score");
  }
}
