import { loadTarget } from "./environment";
import { migrate } from "./migrations";
async function main() {
  const { target, apply } = loadTarget();
  if (!apply) {
    console.log(`Dry run: migrations target ${target}. Add --apply to run.`);
    return;
  }
  await migrate();
  console.log(`Migrations completed: ${target}.`);
}
main().catch(() => {
  console.error("Migration failed. Check target and database access.");
  process.exitCode = 1;
});
