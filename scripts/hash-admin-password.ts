import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { writeFile } from "node:fs/promises";
import { scrypt, randomBytes } from "node:crypto";
async function main() {
  if (!process.stdin.isTTY)
    throw Error("Run this command in an interactive terminal.");
  const output = new Writable({
    write(_chunk, _enc, next) {
      next();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  process.stdout.write("New admin password (hidden): ");
  const password = await new Promise<string>((resolve) =>
    rl.question("", resolve),
  );
  rl.close();
  process.stdout.write("\n");
  if (password.length < 12 || Buffer.byteLength(password) > 256)
    throw Error("Use at least 12 characters, at most 256 UTF-8 bytes.");
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 },
      (e, b) => (e ? reject(e) : resolve(b)),
    ),
  );
  const file = ".env.admin.local";
  await writeFile(
    file,
    `ADMIN_PASSWORD_HASH=scrypt$${salt.toString("hex")}$${hash.toString("hex")}\nADMIN_RATE_LIMIT_SECRET=${randomBytes(32).toString("hex")}\n`,
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    `Saved ${file}. Set these values in Vercel; do not commit this file.`,
  );
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Password setup failed");
  process.exitCode = 1;
});
