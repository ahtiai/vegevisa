# VegeVisa storage and admin design

Status: approved by the user on 2026-10-06. Implementation is on `codex/vegevisa-admin`; production cutover awaits source-content confirmation.

## Outcome

Keep the existing Vercel site and game. Replace the broken Upstash connection with one durable database attached to this project. Add `/admin`, protected by login, so the owner can maintain questions, change quiz settings, and reset high-score lists without changing code or a Google Sheet.

The user approved staying on Vercel with project-linked storage. The provider, login details, and exact setting limits below are proposed implementation decisions, not claims of existing configuration.

## Storage choice

Use **Neon Postgres through Vercel Marketplace**, with the standard `pg` driver and Vercel pool lifecycle management, parameterized SQL, and small versioned SQL migrations. No ORM or separate backend service is needed.

This is project-linked managed storage, not a file in the Git repository. The schema, migrations, import tools, and application code live in this project; changing database provider later remains possible because the stored data is ordinary Postgres data.

Alternatives considered:

| Option | Fit |
| --- | --- |
| Neon Postgres attached through Vercel | Recommended: one database for editing, concurrent score submissions, login sessions, and backups. |
| Vercel Blob with JSON files | Useful for files, but score sorting, simultaneous edits, and safe resets would require extra coordination code. |
| Local SQLite | Simple on a persistent server, but would require changing the agreed Vercel hosting. |

Use separate production and non-production databases or branches with separate credentials. Never infer isolation from `NODE_ENV`: Vercel previews also run production builds. Local work and tests must not use the production database. Confirm the selected plan, cost limits, region, and available recovery window before provisioning. Do not assume a free plan includes backups or permits the expected traffic.

## Admin experience

One password-protected admin, with three sections and a logout button. Keep the existing green visual style, but use the readable body font for editing forms. Keep the public game and its Finnish copy. Admin copy will also be Finnish.

**Questions:** searchable list with active/inactive filter; add, edit, activate, or deactivate a question. Each question has text, four distinct non-empty answers, one correct answer, and an active switch. Preserve imported IDs and difficulty metadata, but do not introduce difficulty-based gameplay. Deactivation replaces permanent deletion in this first version. Show the active count. Refuse a change that leaves fewer active questions than the largest configured quiz size.

**Quiz settings:** two distinct quiz lengths, each an integer from 1–20, default `[5, 10]`; time per question, an integer from 5–120 seconds, default `30`. Keep the 1.5-second answer feedback and current scoring maximum of 2,000 points per question. Recalculate the speed bonus against the selected time limit. Show validation inline and a clear success message. Changes apply to new games; a game already started keeps its questions and time limit.

**High scores:** view today's and all-time lists, then choose “Reset today” or “Reset all scores.” Reset today clears only the daily list; the all-time list stays intact. Reset all clears both lists. Require an explicit confirmation explaining that scope. Store reset cutoffs rather than deleting score rows, so records can be recovered by the operator if necessary. Label this as clearing the displayed lists, not permanently deleting stored records. Include one authenticated JSON download of questions, settings, score records, and reset cutoffs for a portable backup; never include credentials, login attempts, or session tokens.

The public leaderboard keeps its existing tabs and ranking style. Remove its reset button, and remove the public DELETE handler entirely. Reset must only exist as a protected admin operation.

## Login and access

Single owner login with no signup, email delivery, roles, or external identity service. Configure `ADMIN_PASSWORD_HASH` using a local password-hashing command that prompts without echoing the password. Use Node's asynchronous scrypt with a 16-byte random salt, 64-byte derived key, N=131072, r=8, p=1, and maxmem=256 MiB; compare derived keys in constant time. Require at least 12 characters when setting the password and reject inputs longer than 256 UTF-8 bytes before hashing. Never put a password in source, a command argument, logs, or the plan.

Create a random 32-byte session token on successful login. Store only its SHA-256 digest in Postgres and place the raw token in a host-only, HttpOnly, SameSite=Lax cookie, Secure on HTTPS. Session lifetime is eight hours with no automatic extension. Logout deletes the session record and cookie. Bind sessions to a fingerprint of the configured password hash, so password rotation invalidates old sessions. Reject access if auth configuration or the database is unavailable.

Check the session inside every protected server page and every admin API handler. Hiding navigation or checking a layout alone is insufficient. For login and all state-changing admin requests, require a matching request Origin against the deployment's configured origin; do not accept arbitrary forwarded hosts. Public embedding on provege.fi must keep working, while `/admin` and its login must be top-level pages with `frame-ancestors 'none'`.

Limit login attempts using an atomic database counter: five attempts per 15-minute window per platform-trusted client IP. Hash the IP with a server secret before storing it; reject the sixth attempt before password verification and return a retry time. Counters must work across separate function instances. Use a documented Vercel-provided client-address source, not an arbitrary client-supplied forwarding header. Test expiry and concurrent attempts. Expired sessions and throttle rows can be pruned during login; no scheduled job is needed.

## Data and behavior

Keep the data model small:

| Table | Purpose |
| --- | --- |
| `questions` | Existing stable ID, text, four answers, correct choice, active flag, optional difficulty, integer revision, timestamps. |
| `quiz_settings` | Single row: two quiz lengths, question duration, integer revision, timestamps. |
| `scores` | UUID submission ID, name, points, correct/total answers, duration, server creation time. |
| `leaderboard_state` | Single row: daily and all-time reset cutoffs. |
| `admin_sessions` | Token digest, password fingerprint, expiry. |
| `login_attempts` | Hashed client address, fixed window start, attempt count. |
| `schema_migrations` | Which schema changes have run. |

Acquire an exclusive row lock (`SELECT ... FOR UPDATE`) on the same settings row first in every question/status/settings mutation transaction, before checking the active count or writing. This serializes those small admin changes; a shared/read lock would not prevent two deactivations from passing the same stale count. Question and setting updates include the revision the editor loaded; return HTTP 409 rather than silently overwriting a newer edit.

At game start, the existing question endpoint returns the selected questions plus a snapshot of the time setting. The start screen gets the configured quiz lengths from a small public settings endpoint. Do not count down into an empty game: handle loading, failed requests, invalid requested counts, and insufficient questions explicitly. Shuffle and scoring continue to use the existing functions.

Scores retain the current client-calculated gameplay model. Validate all submitted numbers as finite integers, name length 1–30 after trimming, total questions 1–20, correct answers 0–total, points 0–2,000 times correct answers, and non-negative elapsed seconds. Accept a finished game with an earlier quiz length after an admin changes the lengths. A per-game UUID generated once and carried through results makes Save retries idempotent: the same payload returns the existing result; a different payload using the same ID gets HTTP 409. This is duplicate protection, not proof that a game was played honestly. Full server-side anti-cheat is outside this change.

Rank by score descending, then creation time ascending, then submission ID ascending. Keep the public top-ten response fields and compact results view. Define “today” using **Europe/Helsinki**, as a proposed product default for this Finnish quiz, independently of the server's time zone. Store timestamps in UTC and calculate local day boundaries with a DST-aware database conversion.

Read each leaderboard using the applicable reset cutoff; daily reads also apply local day boundaries. Reset today advances only the daily cutoff; reset all advances both in one atomic update. Use database-generated timestamps for submissions and cutoffs. A score committed before a completed reset is hidden; a submission started after that reset remains visible. A request overlapping the reset follows its database insertion timestamp. Each list refreshes after the reset succeeds.

Return HTTP 400 for invalid inputs, 401 for missing/expired sessions, 403 for origin failures, 409 for stale edits or conflicting submission IDs, 429 for throttling, and 503 for unavailable storage. Server logs identify the failed operation without passwords, tokens, database URLs, or full submitted payloads. Public pages show Finnish error text and a retry action; no empty leaderboard or “saved” confirmation may conceal a failed request. Admin errors preserve unsaved form input. Use no-store responses for settings, questions, scores, and admin data so completed edits and resets are reflected by subsequent requests.

## Import, backup, and rollout

1. Export the currently configured Google Sheet to an ignored local backup file. Parse all valid rows, including inactive questions; the current runtime parser drops inactive rows and must not be reused unchanged. Report malformed rows, duplicate IDs, missing answers, and invalid correct choices before importing. Do not silently replace live questions with the 20 bundled fallback questions.
2. Import into the non-production database using an explicit, rerunnable tool. Preserve stable IDs. The seed/import must refuse to overwrite existing admin edits and must never run during build, deployment, or normal requests. The bundled questions are an explicit fallback only if the live source cannot be recovered and the owner accepts that content choice.
3. Verify the admin and game against the non-production database, including a real save/read/reset sequence and a fresh deployment reading the same data.
4. Provision and configure production, import the agreed questions, and take a backup before switching the production deployment. Start with empty high scores unless old Upstash records are actually recovered and checked. Do not describe a new empty leaderboard as a successful migration of old scores.
5. Verify production with a controlled game and admin login; do destructive reset checks in preview only. Remove only explicitly identified test data if a production smoke test is authorized. Preserve the old export and configuration references until acceptance.
6. Record the deployed commit, database target, import counts, test evidence, plan/recovery limits, and operator backup/restore steps. A provider's READY deployment is not evidence of working saves or admin protection.

Rollback must retain the new database and its scores. The old deployment still depends on broken Upstash and is not a working rollback target. If the new admin fails, temporarily remove `ADMIN_PASSWORD_HASH` and redeploy to make admin access fail closed while retaining the public game, then fix forward or deploy a previously verified build that uses the new database. Do not promote the old Redis build as a recovery step. Verify backup restoration into an isolated database before release.

## Scope limits

No game redesign, multi-user management, paid subscriptions, image uploads, question version-history UI, scheduling, generic CMS, continuous Google Sheets sync, or full anti-cheat system. Add only the storage driver and the test tooling needed to verify this change. Provisioning and production deployment happen during implementation after the concrete resource and any costs are known, not as part of writing this plan.

## Basis and references

Repository inspected at `73235ed3570e22158fafe2f96088f45c52a5f963`. Current code uses Upstash for scores, Google Sheets with bundled fallback for questions, hardcoded quiz lengths and timers, and an unauthenticated leaderboard DELETE route. The repository has no test runner configured.

- [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage): project attachment and environment configuration.
- [Vercel SQLite limitation](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel): local writable files are not durable application storage on Vercel.
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver): parameterized queries and transaction support.
- [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication): server authorization and database-backed sessions.
