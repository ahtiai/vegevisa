# VegeVisa storage and admin: implementation report

## Delivered

Implemented on `codex/vegevisa-admin`, based on `73235ed3570e22158fafe2f96088f45c52a5f963`.
Application commits: `466a2ea80b0598cb5c028712b65b1f080b0c3cc7` and `f9d0345`.

- Postgres stores questions, settings, scores, reset cutoffs, and admin sessions. Runtime Upstash and Google Sheets dependencies are removed.
- `/admin` provides owner login, question creation/editing/activation, quiz length/time settings, today's/all-list reset, and backup download.
- Settings changes apply to new games. Score retries are idempotent. Save failures and leaderboard refresh failures are shown separately.
- Anonymous and cross-site admin writes are rejected. Passwords are hashed, session cookies are protected, and login attempts are limited in the database.
- Migration, import, password setup and backup restoration have explicit commands documented in the README.

## Evidence

| Check | Result |
| --- | --- |
| Full Vitest suite using real isolated Postgres | 35 passed |
| ESLint, TypeScript, production build | Passed |
| Local browser tests | 2 passed, including delayed admin saves, lost score response/retry, failed leaderboard refresh, running timer snapshot and resets |
| Independent code review | Three important findings fixed with regression tests: env-file password expansion, fields editable during saves, inherited database credentials |
| Hosted preview | Login, edit question, edit settings, full game, score save, separate-page leaderboard read, daily/all resets, backup and logout passed |
| Hosted protection | Secure/HttpOnly/SameSite cookie, admin frame policy, anonymous rejection and foreign-origin rejection passed |
| Redeployment | Score persisted from first deployment into the reviewed deployment |
| Backup recovery | Hosted JSON restored into an empty isolated local database; 11 questions, 2 scores, settings, revisions and reset cutoffs matched exactly |
| Appearance | Hosted desktop and mobile admin screenshots inspected |

Full-flow preview: https://vegevisa-68vo31oqq-ahti.vercel.app
Deployment: `dpl_2FfU8S9YRYWoZucRiSwqcWPmUsSr`.
This preview is protected by the existing Vercel project protection. Use the owner's Vercel access. The preview admin password is in an ignored local file, `backups/preview-admin.txt`, with mode 0600.

## Storage and source status

Neon resource `vegevisa-preview`, store `store_5i1Q253SkfOCDJvB`, region `fra1`, selected plan `free_v3`. Linked to Preview and Development only. New database/auth variables are absent from Production. Preview tests and resets therefore cannot operate on the current production Redis data.

The real CSV was exported and validated: **25 questions, 5 active**. The raw export is retained under ignored `backups/`. It has not been imported. The preview contains **11 clearly labelled synthetic questions**, default lengths 5/10 and a 30-second timer. Test score records remain stored but are hidden by the tested reset cutoffs.

The source choice is still open: preserve the 5 active questions and start with 3/5-question games, or approve activation of all 25 and retain 5/10-question games. Do not activate inactive content automatically. For a 3/5 launch, set the reviewed initial settings before the one-time source import; do not import against the default 10-question requirement.

Production has **not** been deployed or migrated. The existing Upstash endpoint failed DNS resolution during investigation, and old scores have not been recovered. This change does not recover them.

## Decisions made during implementation

1. Used `pg` with Vercel pool lifecycle management instead of the proposed Neon HTTP driver. This supports interactive transactions and the same real Postgres tests locally. If unsuitable under production traffic, pool settings may need adjustment.
2. Committed the connected storage/auth/routes/game implementation together after checks, rather than committing broken intermediate interfaces task by task. The cost is a larger initial review diff.
3. Updated Next.js within version 16 to 16.3.8 for security fixes, with compatible dependency updates. The risk is a framework regression; local and hosted builds and browser flows passed.
4. Retrying a historic score hidden by a reset returns no rank; new visible scores rank against the current list. Existing UI does not display the returned rank. Any future rank consumer must handle a null value.

Review minors were addressed: the CSV explicitly requires an `active` column, reset copy says records remain stored, and the browser test asserts the running timer's original maximum. No review findings were deferred.

## Remaining release work

1. Resolve the real question set and starting quiz lengths.
2. Prepare a separate production database, confirm production plan limits and actual provider recovery settings, configure a fresh production admin password and exact public origin, then migrate/import explicitly.
3. Verify the imported counts and playable content; take a backup. Obtain the final production publishing decision after the concrete target is ready.
4. Build/deploy specifically for Production. Do not promote a build carrying preview database credentials.
5. Verify a controlled production game/save/read, owner login, and anonymous write rejection. Do not reset production lists for testing.

Manual export/restore is verified. Provider-managed recovery settings and production costs are not claimed as verified. Score calculation remains client-side, as agreed; this is not an anti-cheat redesign. Hosted tests used separate requests and browser contexts, but did not prove a particular number of simultaneous Vercel function instances or production load capacity.

Keep the new database for rollback. The old Upstash build is not a working rollback target. See README for password rotation, backup/restore and disabling admin access while preserving data.
