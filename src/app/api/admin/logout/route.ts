import {
  SESSION_COOKIE,
  logout,
  requireSameOrigin,
  sessionToken,
} from "@/lib/admin-auth";
import { apiError, json } from "@/lib/api";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const token = await sessionToken(request);
    if (token) await logout(token);
    const response = json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (e) {
    return apiError(e, "Admin logout");
  }
}
