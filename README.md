# VegeVisa

A Finnish quiz with a password-protected admin at `/admin`. Questions, settings, scores, and admin sessions live in Postgres. There is no runtime Upstash or Google Sheets dependency.

## Run locally

Use Node 24 and `npm ci`. Copy `.env.example` to `.env.local`, point it at your development Postgres database, and set `DATABASE_ENV=preview`. On Vercel, connect Neon through Marketplace and use its pooled `DATABASE_URL`; keep production and preview/development on separate databases. The app uses `pg` with Vercel's pool lifecycle helper, so the same SQL and transactions work locally and on Neon.

Schema changes are explicit, never part of the build:

```sh
npm run db:migrate -- --env-file .env.local --target preview --apply
npm run db:import -- --env-file .env.local --target preview --file backups/questions.csv
npm run db:import -- --env-file .env.local --target preview --file backups/questions.csv --apply
npm run admin:password
npm run dev
```

Import defaults to a dry run. The CSV columns are `id,question,option_a,option_b,option_c,option_d,correct,difficulty,active`. `correct` is a–d. Blank `active` means true; FALSE preserves an inactive question. IDs must be unique. Import refuses to overwrite existing questions. At least as many active questions as the largest quiz length are required. A fresh database defaults to 5/10 questions and 30 seconds; review the source's active count before import. Do not silently activate questions or substitute the bundled fallback content.

The password command prompts without echo and creates a new ignored `.env.admin.local` file with mode 0600. Securely copy its `ADMIN_PASSWORD_HASH` and `ADMIN_RATE_LIMIT_SECRET` values into the target's environment configuration, or `.env.local` for local development. It does not print the password or hash. Preserve an existing file before generating a replacement. Set `APP_ORIGIN` to the exact production origin. Leave it unset for preview to use the deployment's `VERCEL_URL`. Restart/redeploy after environment changes. Password rotation invalidates existing sessions. There is no public signup or password-reset email.

## Admin

- Questions: add, edit, activate or deactivate; stale edits cannot overwrite newer changes.
- Settings: two distinct quiz lengths (1–20) and time per question (5–120 seconds). Changes affect new games only. The maximum stays at 2,000 points per correct answer.
- Scores: reset today's list or both visible lists. Today uses Europe/Helsinki. Reset cutoffs hide records; they do not permanently delete them.
- Backup: download questions, settings, all score records and reset cutoffs as versioned JSON. Credentials and sessions are excluded.

Admin sessions last eight hours. Server handlers check authentication and request origin. Login throttling is stored in Postgres, so it works across function instances. The public quiz can be embedded on provege.fi; admin pages cannot be embedded.

Scores remain client-calculated, as in the original quiz. UUID submission IDs prevent duplicate Save retries; they are not an anti-cheat mechanism. Network/database failures show a retry message. A successful save is reported separately from a failed leaderboard refresh.

## Tests

Create two **dedicated local** databases ending in `_test`: one for the SQL tests and one for browser tests. Tests deliberately refuse remote databases and do not default to `DATABASE_URL`.

```sh
TEST_DATABASE_URL=postgresql://localhost:5432/vegevisa_test npm test
npm run lint
npm run typecheck
npm run build
TEST_DATABASE_URL=postgresql://localhost:5432/vegevisa_e2e_test npx tsx --conditions=react-server tests/e2e/seed.ts
npx playwright install chromium
npm run test:e2e
```

The browser fixture writes ignored `.env.e2e.local` and uses only its isolated local database. It installs a known **test-only** password, never a production password. Playwright starts its own server on port 3107. Do not run resets in browser tests against production. `npm run test:db` is a focused storage/auth/score test subset.

## Deployment and recovery

1. Connect a separate Neon resource to **preview/development only**, choose the plan and region deliberately, and confirm its limits. Connect a different resource to **production only**. Credentials must not cross scopes.
2. Set environment-specific auth and `DATABASE_ENV`; set production `APP_ORIGIN=https://vegevisa.vercel.app`. Verify the current source export, migrate explicitly, and import once. No automatic seeding or fallback is performed.
3. Verify login, editing, a full game, saving, and both reset scopes in preview. Verify persistence across a fresh deployment using the same database.
4. Before switching production, preserve a source export and database backup. Verify the provider's actual backup/recovery window and account limits; a free plan is not a promise of unlimited usage or recovery.
5. After deployment, verify public reads and an agreed controlled game plus admin login. Use preview for destructive reset checks. The unavailable old Upstash scores are not recoverable merely by deploying this version.

Restore a downloaded backup into an **empty, migrated** database:

```sh
npm run db:restore -- --env-file .env.restore.local --target preview --file backups/vegevisa.json
npm run db:restore -- --env-file .env.restore.local --target preview --file backups/vegevisa.json --apply
```

The first command validates and reports counts without writing. Restore refuses non-empty question/score tables and runs atomically. It does not restore admin credentials or sessions. Rehearse restoration into isolation before relying on it, compare question/score counts, and verify a real game.

Do not roll back to the old Redis build: its database is still broken. Preserve the new database and deploy a previously verified Postgres build or fix forward. To disable admin temporarily while keeping the game running, remove `ADMIN_PASSWORD_HASH` and redeploy; admin operations fail closed. Do not delete data during a code rollback.

Plan and design: `docs/superpowers/plans/2026-10-06-storage-admin.md` and `docs/superpowers/specs/2026-10-06-storage-admin-design.md`.
