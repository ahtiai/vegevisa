import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
export function option(name: string) {
  const at = process.argv.indexOf(name);
  return at < 0 ? undefined : process.argv[at + 1];
}
export function loadTarget() {
  const file = option("--env-file"),
    target = option("--target");
  if (!file || !target)
    throw Error(
      "Specify --env-file and --target (test, preview or production).",
    );
  Object.assign(process.env, parseEnv(readFileSync(file, "utf8")));
  if (
    !["test", "preview", "production"].includes(target) ||
    process.env.DATABASE_ENV !== target ||
    !process.env.DATABASE_URL
  )
    throw Error(
      "DATABASE_ENV must match the explicit target and DATABASE_URL must be set.",
    );
  return { target, apply: process.argv.includes("--apply") };
}
