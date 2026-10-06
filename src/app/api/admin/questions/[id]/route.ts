import { requireAdmin, requireSameOrigin } from "@/lib/admin-auth";
import { updateQuestion } from "@/lib/quiz-store";
import { json, apiError, readBody } from "@/lib/api";
import { integer, object } from "@/lib/errors";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    requireSameOrigin(request);
    const body = object(await readBody(request));
    return json(
      await updateQuestion(
        (await params).id,
        body,
        integer(body.revision, 1, 2147483647, "revision"),
      ),
    );
  } catch (e) {
    return apiError(e, "Edit question");
  }
}
