import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, expect, test, vi } from "vitest";
import { loadTarget } from "../scripts/environment";

const originalArgs = process.argv;
const directory = mkdtempSync(join(tmpdir(), "vegevisa-environment-"));
afterAll(() => rmSync(directory, { recursive: true, force: true }));
afterEach(() => {
  process.argv = originalArgs;
  vi.unstubAllEnvs();
  rmSync(join(directory, "target.env"), { force: true });
});
function targetFile(content: string) {
  const file = join(directory, "target.env");
  writeFileSync(file, content);
  process.argv = ["node", "script", "--env-file", file, "--target", "preview", "--apply"];
}
test("database tools reject target files without their own URL", () => {
  vi.stubEnv("DATABASE_URL", "postgresql://production.invalid/database");
  targetFile("DATABASE_ENV=preview\n");
  expect(() => loadTarget()).toThrow(/DATABASE_URL/);
  expect(process.env.DATABASE_URL).toBe("postgresql://production.invalid/database");
});
test("database tools reject target files without their own environment marker", () => {
  vi.stubEnv("DATABASE_ENV", "preview");
  targetFile("DATABASE_URL=postgresql://preview.invalid/database\n");
  expect(() => loadTarget()).toThrow(/DATABASE_ENV/);
});
