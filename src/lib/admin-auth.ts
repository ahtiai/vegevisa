import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { isIP } from "node:net";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { AppError } from "./errors";
export const SESSION_COOKIE = "vegevisa_admin";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
}
function configuredHash() {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash))
    throw new AppError(503, "Ylläpidon kirjautumista ei ole määritetty.");
  return hash;
}
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || Buffer.byteLength(password) > 256)
    throw new AppError(
      400,
      "Salasanassa pitää olla vähintään 12 merkkiä ja enintään 256 tavua.",
    );
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = configuredHash();
  if (
    typeof password !== "string" ||
    !password ||
    Buffer.byteLength(password) > 256
  )
    return false;
  const [, salt, key] = hash.split(":");
  return timingSafeEqual(
    await derive(password, Buffer.from(salt, "hex")),
    Buffer.from(key, "hex"),
  );
}
export function requireSameOrigin(request: Request) {
  const allowed =
    process.env.APP_ORIGIN ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (!allowed)
    throw new AppError(503, "Ylläpidon osoitetta ei ole määritetty.");
  if (request.headers.get("origin") !== new URL(allowed).origin)
    throw new AppError(403, "Pyyntö ei ole sallittu.");
}
export function clientAddress(request: Request) {
  if (!process.env.VERCEL) return "local";
  // Vercel overwrites this header at its edge. Never trust forwarded headers off Vercel.
  const address = request.headers.get("x-forwarded-for")?.trim();
  if (!address || !isIP(address))
    throw new AppError(403, "Asiakkaan osoitetta ei voitu vahvistaa.");
  return address;
}
export async function login(password: string, address: string) {
  const fingerprint = digest(configuredHash());
  const secret = process.env.ADMIN_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new AppError(503, "Ylläpidon kirjautumista ei ole määritetty.");
  const addressHash = createHmac("sha256", secret)
    .update(address)
    .digest("hex");
  const { rows } = await getDb().query<{ attempts: number }>(
    `INSERT INTO login_attempts(address_hash,window_start,attempts) VALUES($1,clock_timestamp(),1) ON CONFLICT(address_hash) DO UPDATE SET attempts=CASE WHEN login_attempts.window_start<=clock_timestamp()-interval '15 minutes' THEN 1 ELSE login_attempts.attempts+1 END,window_start=CASE WHEN login_attempts.window_start<=clock_timestamp()-interval '15 minutes' THEN clock_timestamp() ELSE login_attempts.window_start END RETURNING attempts`,
    [addressHash],
  );
  if (rows[0].attempts > 5)
    throw new AppError(
      429,
      "Liian monta yritystä. Yritä uudelleen 15 minuutin kuluttua.",
    );
  if (!(await verifyPassword(password)))
    throw new AppError(401, "Virheellinen salasana.");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await getDb().query(
    "INSERT INTO admin_sessions(token_hash,password_fingerprint,expires_at) VALUES($1,$2,$3)",
    [digest(token), fingerprint, expiresAt],
  );
  await getDb().query(
    "DELETE FROM admin_sessions WHERE expires_at<=clock_timestamp()",
  );
  await getDb().query(
    "DELETE FROM login_attempts WHERE window_start<clock_timestamp()-interval '1 day'",
  );
  return { token, expiresAt };
}
export async function validateSession(
  token: string | undefined,
): Promise<boolean> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const hash = configuredHash();
  return Boolean(
    (
      await getDb().query(
        "SELECT 1 FROM admin_sessions WHERE token_hash=$1 AND password_fingerprint=$2 AND expires_at>clock_timestamp()",
        [digest(token), digest(hash)],
      )
    ).rowCount,
  );
}
export async function sessionToken(request?: Request) {
  if (request) {
    const match = request.headers
      .get("cookie")
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(SESSION_COOKIE + "="));
    return match?.slice(SESSION_COOKIE.length + 1);
  }
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
export async function requireAdmin(request?: Request) {
  if (!(await validateSession(await sessionToken(request))))
    throw new AppError(401, "Kirjaudu sisään.");
}
export async function logout(token: string) {
  await getDb().query("DELETE FROM admin_sessions WHERE token_hash=$1", [
    digest(token),
  ]);
}
