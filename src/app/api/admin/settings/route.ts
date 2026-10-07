import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { getSettings, saveSettings } from "@/lib/quiz-store";
import { json, apiError, readBody } from "@/lib/api";
import { integer, object } from "@/lib/errors";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return json(await getSettings());
  } catch (e) {
    return apiError(e, "Read settings");
  }
}
export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    requireSameOrigin(request);
    const body = object(await readBody(request));
    return json(
      await saveSettings(
        body,
        integer(body.revision, 1, 2147483647, "revision"),
      ),
    );
  } catch (e) {
    return apiError(e, "Save settings");
  }
}
