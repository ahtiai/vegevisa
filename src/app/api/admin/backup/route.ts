import { requireAdmin } from "@/lib/admin-auth";
import { createBackup } from "@/lib/backup";
import { json, apiError } from "@/lib/api";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const response = json(await createBackup());
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="vegevisa-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    return response;
  } catch (e) {
    return apiError(e, "Export backup");
  }
}
