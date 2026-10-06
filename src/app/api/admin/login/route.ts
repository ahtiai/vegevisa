import {
  SESSION_COOKIE,
  clientAddress,
  login,
  requireSameOrigin,
} from "@/lib/admin-auth";
import { apiError, json, readBody } from "@/lib/api";
import { object } from "@/lib/errors";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = object(await readBody(request));
    const session = await login(
      typeof body.password === "string" ? body.password : "",
      clientAddress(request),
    );
    const response = json({ success: true });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch (e) {
    return apiError(e, "Admin login");
  }
}
