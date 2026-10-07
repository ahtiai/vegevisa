import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { resetScores } from "@/lib/score-store";
import { json, apiError, readBody } from "@/lib/api";
import { object, AppError } from "@/lib/errors";
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    requireSameOrigin(request);
    const { scope } = object(await readBody(request));
    if (scope !== "today" && scope !== "all")
      throw new AppError(400, "Valitse nollattava lista.");
    await resetScores(scope);
    return json({ success: true });
  } catch (e) {
    return apiError(e, "Reset scores");
  }
}
