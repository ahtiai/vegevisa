# VegeVisa Storage and Admin Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task in this chat. Steps use checkboxes for tracking. This document is a plan, not authorization to provision paid services or publish a production deployment.

**Goal:** Replace broken Upstash score storage and Google Sheets runtime questions with project-linked storage, then let the owner manage questions, quiz settings, and high scores behind login.

**Architecture:** Keep the existing Next.js app on Vercel. Use one Neon Postgres database per environment, small SQL-backed modules, and one password-protected admin with database sessions. Reuse the existing public game and leaderboard components.

**Tech stack:** Existing Next.js 16, React 19, TypeScript, Tailwind, and Node 24; `pg` and `@vercel/functions`; Node crypto; Vitest and Playwright for focused verification. Select supported package versions at implementation time and commit `package-lock.json`.

**Spec:** [Storage and admin design](../specs/2026-10-06-storage-admin-design.md). Read it before execution. Provider choice, Helsinki day boundaries, single-owner login, and the precise setting ranges are proposed defaults for review.

## Implementation status — 2026-10-07

Application implementation and production release are complete. The owner approved all 25 questions active with 5/10-question games. Local, hosted preview and public production flows passed; production backup restoration was verified. See [implementation report](../2026-10-06-implementation-report.md) for exact checks, review fixes, decisions and release evidence and operating limits. The detailed checkboxes below preserve the original planned sequence rather than asserting every production step has run.

## Global constraints

- Keep the existing game design and Finnish copy; use Finnish admin copy.
- Default quiz lengths `[5, 10]`, configurable to two distinct integers from 1–20; question time `30`, configurable from 5–120 seconds.
- Keep 1.5-second feedback and a maximum of 2,000 points per question.
- New settings affect new games only. Never overwrite live questions with fallback data automatically.
- Public players cannot edit questions, settings, or reset scores; every admin handler checks authorization on the server.
- Use separate production and non-production credentials. Never use `NODE_ENV` as database isolation.
- Use no-store responses for settings, questions, scores, and admin data. No credentials, private exports, database dumps, or session tokens in Git or logs.
- Keep this as one app with small purpose-specific modules; no ORM, generic storage adapters, or extra service.

## Review focus

- Two admins save or deactivate questions at once: preserve newer edits and enough playable questions. Task 1 and Task 4.
- A player retries Save after a network failure: one score only, with no false success. Task 3.
- An admin changes timing during a game: the running game keeps its original timer and scoring. Task 5.
- Today crosses Finnish midnight or daylight-saving time: the correct records appear, independently of the server clock zone. Task 3.
- Preview reset, login expiry, or direct API calls: production scores remain untouched and protected writes remain blocked. Tasks 2 and 6.

## File map and boundaries

| Area | Planned files |
| --- | --- |
| Database and types | `db/migrations/001_initial.sql`, `src/lib/db.ts`, `src/lib/quiz-types.ts`, `src/lib/quiz-store.ts`, `src/lib/score-store.ts` |
| Imports and operations | `scripts/migrate.ts`, `scripts/import-questions.ts`, `scripts/hash-admin-password.ts`, `scripts/restore-backup.ts`, `src/lib/question-import.ts` |
| Authentication | `src/lib/admin-auth.ts`, `src/app/api/admin/login/route.ts`, `src/app/api/admin/logout/route.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/(protected)/layout.tsx` |
| Admin data and pages | `src/app/api/admin/questions/route.ts`, `src/app/api/admin/questions/[id]/route.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/scores/reset/route.ts`, `src/app/api/admin/backup/route.ts`, `src/app/admin/(protected)/page.tsx`, `src/components/admin/{QuestionsEditor,QuizSettings,HighScoreAdmin}.tsx` |
| Existing public flow | `src/app/api/questions/route.ts`, `src/app/api/scores/route.ts`, `src/app/api/scores/leaderboard/route.ts`, `src/app/api/settings/route.ts` (new), `src/hooks/{useGameState,useTimer,useLeaderboard}.ts`, `src/lib/scoring.ts`, `src/app/{page,play/page,results/page,leaderboard/page}.tsx`, `src/components/NameInput.tsx` |
| Verification and setup | `vitest.config.ts`, `playwright.config.ts`, `tests/{storage,auth,scores,admin,game}.test.ts`, `tests/e2e/admin-game.spec.ts`, `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `next.config.ts`, `README.md` |

Delete `src/lib/redis.ts` and remove `@upstash/redis` after the score routes are replaced. Remove `src/lib/google-sheets.ts` after the CSV parser is moved into the one-time import module. Keep the bundled questions as explicit seed material, not a runtime fallback.

## Task 1: Durable storage and safe question import

**Deliverable:** An isolated database can be migrated and seeded, edited safely, and read after process restart.

**Files:** Database/types, migration/import scripts, question-import module, test configuration, `tests/storage.test.ts`, environment documentation.

**Interfaces:**
- `QuizSettings = { questionCounts: [number, number]; questionTimeSeconds: number; revision: number }`.
- `Question = { id: string; question: string; options: [string, string, string, string]; correctIndex: number; active: boolean; difficulty: string | null; revision: number }`.
- `getSettings(): Promise<QuizSettings>`; `listQuestions(): Promise<Question[]>`; `getActiveQuestions(): Promise<Question[]>`.
- `createQuestion(input: QuestionInput): Promise<Question>`; `updateQuestion(id: string, input: QuestionInput, expectedRevision: number): Promise<Question>`; `saveSettings(input: SettingsInput, expectedRevision: number): Promise<QuizSettings>`. Inputs omit generated IDs/revisions; update preserves IDs. Export the types from `quiz-types.ts`.
- Typed failures: validation, revision conflict, insufficient active questions, and storage unavailable. Routes map them to the status codes in the spec.

- [ ] Add Vitest with TypeScript path aliases and scripts `test`, `test:db`, `typecheck`, `db:migrate`, and `db:import`. Database tests use a dedicated `TEST_DATABASE_URL`, refuse a value matching `DATABASE_URL`, and run against an isolated disposable database/schema.
- [ ] Write failing tests: two score IDs can coexist; migration reruns do not destroy records; import includes inactive CSV rows; malformed/duplicate IDs produce row-numbered errors before writes; rerunning import refuses to replace edits; two concurrent deactivations cannot reduce the active count below the largest quiz size; a stale revision cannot overwrite a change. Use explicit fixture settings `[5, 10]` and 11 active questions for the concurrent deactivation case.
- [ ] Run `npm run test -- tests/storage.test.ts`; confirm failures exercise the missing behavior, not unrelated setup problems.
- [ ] Implement the seven tables in the spec, database constraints, score sort/day indexes, versioned migration bookkeeping, and a lazy database client. Missing database configuration must not crash module import during `next build`.
- [ ] Implement parameterized operations and atomic constraints. For dependent writes use one database transaction with the appropriate locking/isolation; do not read in one request and rely on that value in a later write. Exercise the chosen driver transaction behavior against real Postgres.
- [ ] Implement CSV parsing/import and JSON restore with dry-run summaries. Define backup version 1 as `{ version: 1, exportedAt, questions, settings, scores, leaderboardState }`; export one consistent database snapshot. Require explicit target/environment; restore only into an empty database, validate format/version first, and never import auth tables. Load `.env.local` safely through an environment loader, never shell-evaluate it. Use explicit tooling for TypeScript scripts if needed.
- [ ] Export and validate the live Sheet during implementation; retain the raw export under an ignored `backups/` path. Show source, total/active counts, and validation failures without logging whole rows. Do not seed production yet.
- [ ] Run unit and real database tests, restart the process, and verify the same records remain. Commit only this task's source/tests/docs after checks pass.

## Task 2: Owner login and server-side protection

**Deliverable:** The owner can log in/out; unauthenticated or cross-site requests cannot change admin data.

**Files:** Auth module, login/logout routes and pages, protected layout, password setup script, `tests/auth.test.ts`, `next.config.ts`.

**Interfaces:** `requireAdmin(request?: Request): Promise<void>`; `requireSameOrigin(request: Request): void`; `login(password: string, clientAddress: string): Promise<{ token: string; expiresAt: Date }>`; `logout(token: string): Promise<void>`. Read raw tokens only from the session cookie. All modules using credentials are server-only.

- [ ] Write failing tests for correct/incorrect passwords, missing/malformed hashes, tampered/expired cookies, password rotation, logout replay, database outage, absent/foreign Origin, and sixth login attempt within 15 minutes. Concurrent attempts must not bypass the limit.
- [ ] Run `npm run test -- tests/auth.test.ts`; confirm the expected failures.
- [ ] Implement scrypt setup/verification, random session creation, digest-only session storage, eight-hour expiry, cookie flags, and database-backed throttling. Add `ADMIN_PASSWORD_HASH`, `ADMIN_RATE_LIMIT_SECRET`, and deployment-scoped `APP_ORIGIN` examples without real values. Resolve preview origin from trusted deployment configuration at setup time.
- [ ] Build the login form and protected admin shell. Use generic Finnish login errors, preserve safe return navigation within `/admin`, and redirect expired sessions to login. Logout is a POST action with Origin validation.
- [ ] Set `/admin` frame policy to deny embedding while preserving the existing provege.fi policy on public routes. Verify actual response headers, including overlapping Next.js header rules.
- [ ] Run auth tests against the isolated database; verify anonymous page navigation redirects and direct API mutation calls fail without changing any rows. Commit the checked task.

## Task 3: Reliable scores and protected resets

**Deliverable:** Scores save once, lists load correctly, and only the admin can clear them.

**Files:** Score store, existing score routes, new admin reset route, leaderboard hook/pages, results page, `NameInput.tsx`, `tests/scores.test.ts`.

**Interfaces:**
- `ScoreInput = { submissionId: string; playerName: string; score: number; correctAnswers: number; totalQuestions: number; timePlayedSeconds: number }`.
- `saveScore(input: ScoreInput): Promise<{ success: true; rank: number }>`; `getLeaderboard(): Promise<LeaderboardData>`; `resetScores(scope: 'today' | 'all'): Promise<void>`.
- Public response fields remain those in `src/hooks/useLeaderboard.ts`; keep server modules free of client-module runtime imports.

- [ ] Write failing tests for finite/integer validation, names, points exceeding correct-answer limits, simultaneous distinct saves, identical retry, conflicting retry, deterministic ties, Helsinki midnight/DST boundaries, daily-only reset, reset-all, and a save after reset. A storage outage returns 503; the removed public DELETE route cannot clear anything.
- [ ] Run `npm run test -- tests/scores.test.ts`; confirm the expected failures.
- [ ] Replace Redis calls with inserts and ordered SQL reads. Apply time/day/reset boundaries in the database. Use a unique UUID submission ID and reject changed payloads on reuse. Reset cutoffs update atomically behind `requireAdmin` and `requireSameOrigin`.
- [ ] Remove the public reset button and DELETE handler. Add visible loading/error/retry states; treat non-2xx responses as failures. When a save succeeds but leaderboard refresh fails, show that the score was saved and separately offer a leaderboard retry.
- [ ] Generate a submission UUID once per started game, carry it into the results state/URL, and reuse it for all Save attempts. A results page missing a valid game submission ID offers replay rather than inventing one on each render. UUIDs are not auth credentials or anti-cheat proof.
- [ ] Remove the Upstash module/package and obsolete Redis variables from the example configuration. Run score tests against real storage, including concurrent requests and a failed-response retry. Commit the checked task.

## Task 4: Questions, settings, and high-score admin

**Deliverable:** Each requested admin operation works from a usable form through the protected API into stored data.

**Files:** Admin pages/components and data routes, `tests/admin.test.ts`, backup endpoint, supporting store methods from Tasks 1 and 3.

**Interfaces:** Question list/create at `/api/admin/questions`; question update at `/api/admin/questions/[id]`; settings GET/PUT at `/api/admin/settings`; reset POST with `{ scope: 'today' | 'all' }`; backup GET returning versioned JSON. Mutations include expected revision where applicable.

- [ ] Write failing route tests for anonymous access to every endpoint, direct cross-site writes, invalid answer choices, blank/duplicate answer text after trim, counts outside 1–20, duplicate quiz lengths, time outside 5–120, insufficient active questions, and stale revisions. Backup responses must exclude secrets, session digests, and login counters.
- [ ] Run `npm run test -- tests/admin.test.ts`; confirm expected failures.
- [ ] Build the three admin sections using simple forms, labels, status messages, active counts, search/filter, and explicit Save buttons. Avoid autosave. On a conflict, preserve the form and offer reload instead of overwriting.
- [ ] Wire all server handlers through the shared auth, Origin, validation, and store functions. Admin data responses are private/no-store. Return structured field errors without raw SQL details.
- [ ] Add reset confirmations that clearly distinguish today's visible list from both lists. Refresh the lists only after success; preserve an actionable error on failure. Add authenticated backup download and a versioned format accepted by the restore tool.
- [ ] Test keyboard/mobile use, failed saves, two tabs editing the same question, question activation limits, and backup round-trip into an empty test database. Commit the checked task.

## Task 5: Run the public quiz from stored questions and settings

**Deliverable:** The existing quiz uses the admin's saved content and settings without changing a game halfway through.

**Files:** Public settings/questions routes, start/play/results pages, game/timer hooks, scoring helper, `tests/game.test.ts`.

**Interfaces:** `GET /api/settings` returns the two quiz lengths; `GET /api/questions?count=n` returns `{ questions: QuestionResponse[]; settings: { questionTimeSeconds: number } }`. `calculateScore(timeRemaining: number, totalTime: number): number`; `useTimer(onTimeUp, totalTime)` uses the per-game snapshot. Extend `GameState` with `questionTimeSeconds` and `submissionId`.

- [ ] Write failing tests that stored active questions are the only source, invalid counts fail rather than truncate silently, insufficient questions produce an error, countdown waits for successful loading, and retry recovers from failed loading. A setting edit from 30 to 60 seconds must not change an already-started 30-second game.
- [ ] Add score assertions: `calculateScore(30, 30) === 2000`, `calculateScore(15, 30) === 1500`, `calculateScore(30, 60) === 1500`, `calculateScore(0, 60) === 1000`; clamp timing inputs to the valid range. Validate pause/resume and timer cleanup.
- [ ] Run `npm run test -- tests/game.test.ts`; confirm expected failures.
- [ ] Replace runtime Google Sheets/fallback reads with the question store and return a time snapshot at game start. Populate home-screen buttons from saved settings; keep current labels/style, navigation, sounds, and sharing behavior.
- [ ] Update timer and scoring consumers to use that snapshot. Handle direct `/play` navigation, settings loading failures, missing result IDs, and all request failures visibly. Do not add a second settings source or silently default to bundled content after a database failure.
- [ ] Run focused tests and play both default quiz lengths. Change settings in another tab during play and verify old/new games use the respective values. Commit the checked task.

## Task 6: Verify, document, and release

**Deliverable:** Evidence that the real hosted game and admin work, plus a repeatable setup and recovery procedure.

**Files:** Playwright configuration, `tests/e2e/admin-game.spec.ts`, README, final environment and package cleanup.

- [ ] Configure Playwright and the `test:e2e` script, then add end-to-end tests using the isolated database: login → create/edit question → change settings → play → save → open leaderboard from another browser context → reset today → reset all → logout → reject a direct admin write. Use stable accessible selectors; do not exercise destructive tests against production.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build`, and `npm run test:e2e`. Pin down pre-existing failures before attributing them to this work. Record exact passing checks and any limitations.
- [ ] Verify a deployed preview with real Neon storage. Confirm score/edit persistence after a new deployment and multiple function instances; confirm preview credentials and a preview reset cannot affect production. Check logs for handled outages and verify public pages show useful errors.
- [ ] Document database setup/migration/import commands, admin password creation/rotation, environment separation, explicit backup/restore commands, and the verified recovery window/cost settings. Keep `.env.example` tracked with placeholders; keep all local backups and secrets ignored.
- [ ] Prepare the production resource and deployment configuration with exact scope and costs visible for the owner before any required final approval. Import the validated question set and default settings, recording counts. Do not run import automatically during deployment.
- [ ] Publish only after the preview evidence and production target are ready. Verify production leaderboard GET, controlled score save/read, owner login, and anonymous write rejection. Do not reset real production lists as a smoke test.
- [ ] Record the release commit, deployment URL, database identity without credentials, imported counts, whether any old scores were recoverable, and the non-destructive rollback/recovery path from the spec. Take a fresh backup; restore it into isolation and verify counts/content. Commit remaining checked documentation and tests.

## Completion criteria

- No runtime Upstash or Google Sheets dependency remains.
- Questions, settings, and scores survive browser sessions and redeployments.
- Owner edits and both reset scopes work through the real admin UI; anonymous requests cannot perform them.
- New games use saved settings, running games remain stable, and failed requests are visible.
- Preview and production are isolated; backup restoration has been demonstrated.
- Evidence distinguishes automated checks, rendered preview tests, and actual production checks. Old scores are either verified as imported or explicitly reported as unavailable.

## Suggested execution

Implement in this chat, in the order above. These changes share a small number of interfaces, so serial implementation keeps the work simple. Review the plan's proposed defaults before starting; no product code, database provisioning, or deployment is part of this planning change.

Implementation note: the standard Postgres driver replaced the proposed Neon HTTP driver to support interactive transactions and identical real-Postgres tests locally. Neon remains the hosted provider. Next.js was updated within version 16 to 16.3.8 for security fixes. See the implementation report for verification and rollout status.
