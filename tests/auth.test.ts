import { beforeAll, beforeEach, afterAll, expect, test } from "vitest";
import {
  setupDatabase,
  resetDatabase,
  closeDatabase,
} from "./support/database";
import {
  hashPassword,
  verifyPassword,
  login,
  validateSession,
  logout,
  requireSameOrigin,
} from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
beforeAll(async () => {
  await setupDatabase();
  process.env.ADMIN_PASSWORD_HASH = await hashPassword(
    "a strong test password",
  );
  process.env.ADMIN_RATE_LIMIT_SECRET = "test-only-rate-secret-32-characters";
  process.env.APP_ORIGIN = "https://quiz.test";
});
beforeEach(resetDatabase);
afterAll(closeDatabase);
test("password validation and hash configuration fail closed", async () => {
  expect(await verifyPassword("wrong")).toBe(false);
  expect(await verifyPassword("a strong test password")).toBe(true);
  const saved = process.env.ADMIN_PASSWORD_HASH;
  process.env.ADMIN_PASSWORD_HASH = "broken";
  await expect(verifyPassword("any")).rejects.toMatchObject({ status: 503 });
  process.env.ADMIN_PASSWORD_HASH = saved;
});
test("sessions expire, are revocable and cannot survive password rotation", async () => {
  const session = await login("a strong test password", "127.0.0.1");
  expect(await validateSession(session.token)).toBe(true);
  expect(await validateSession(session.token + "bad")).toBe(false);
  await logout(session.token);
  expect(await validateSession(session.token)).toBe(false);
  const other = await login("a strong test password", "127.0.0.1");
  await getDb().query(
    "UPDATE admin_sessions SET expires_at=now()-interval '1 second'",
  );
  expect(await validateSession(other.token)).toBe(false);
  const third = await login("a strong test password", "127.0.0.1");
  process.env.ADMIN_PASSWORD_HASH = await hashPassword("another test password");
  expect(await validateSession(third.token)).toBe(false);
  process.env.ADMIN_PASSWORD_HASH = await hashPassword(
    "a strong test password",
  );
});
test("sixth login attempt is blocked atomically across concurrent requests", async () => {
  const attempts = await Promise.allSettled(
    Array.from({ length: 6 }, () => login("wrong", "127.0.0.2")),
  );
  expect(
    attempts.filter((x) => x.status === "rejected" && x.reason.status === 429),
  ).toHaveLength(1);
  await getDb().query(
    "UPDATE login_attempts SET window_start=now()-interval '16 minutes'",
  );
  await expect(login("wrong", "127.0.0.2")).rejects.toMatchObject({
    status: 401,
  });
});
test("origin must match trusted configuration, not request headers", () => {
  expect(() =>
    requireSameOrigin(
      new Request("https://quiz.test/api/admin/login", {
        headers: {
          origin: "https://evil.test",
          "x-forwarded-host": "evil.test",
        },
      }),
    ),
  ).toThrow();
  expect(() =>
    requireSameOrigin(new Request("https://quiz.test/api/admin/login")),
  ).toThrow();
  expect(() =>
    requireSameOrigin(
      new Request("https://quiz.test/api/admin/login", {
        headers: { origin: "https://quiz.test" },
      }),
    ),
  ).not.toThrow();
});
