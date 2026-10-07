import { getSettings } from "@/lib/quiz-store";
import { json, apiError } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return json({ questionCounts: (await getSettings()).questionCounts });
  } catch (e) {
    return apiError(e, "Read public settings");
  }
}
