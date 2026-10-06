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
  const values = parseEnv(readFileSync(file, "utf8"));
  if (
    !["test", "preview", "production"].includes(target) ||
    values.DATABASE_ENV !== target ||
    !values.DATABASE_URL?.trim()
  )
    throw Error(
      "DATABASE_ENV must match the explicit target and DATABASE_URL must be set.",
    );
  Object.assign(process.env, values);
  return { target, apply: process.argv.includes("--apply") };
}
