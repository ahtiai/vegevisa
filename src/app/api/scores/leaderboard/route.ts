import { getLeaderboard } from "@/lib/score-store";
import { json, apiError } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return json(await getLeaderboard());
  } catch (e) {
    return apiError(e, "Read leaderboard");
  }
}
