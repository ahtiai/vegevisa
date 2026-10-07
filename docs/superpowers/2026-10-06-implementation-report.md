# VegeVisa storage and admin: implementation and release report

Production released on 2026-10-07 at https://vegevisa.vercel.app. Admin: https://vegevisa.vercel.app/admin.

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
| Redeployment | Score persisted into the reviewed deployment; a second redeployment preserved all question edits, settings, score records and reset cutoffs exactly; 10-question API passed |
| Backup recovery | Hosted JSON restored into an empty isolated local database; 11 questions, 2 scores, settings, revisions and reset cutoffs matched exactly |
| Appearance | Hosted desktop and mobile admin screenshots inspected |

Full-flow preview: https://vegevisa-68vo31oqq-ahti.vercel.app
Deployment: `dpl_2FfU8S9YRYWoZucRiSwqcWPmUsSr`.
Second deployment used for persistence verification: https://vegevisa-5yu0l0d7x-ahti.vercel.app (`dpl_ATmdmedvhdKwPMvnaitHJVNAgycz`).
Pull request: https://github.com/ahtiai/vegevisa/pull/1 .
This preview is protected by the existing Vercel project protection. Use the owner's Vercel access. The preview admin password is in an ignored local file, `backups/preview-admin.txt`, with mode 0600.

## Production verification — 2026-10-07

The owner selected option 2: activate all 25 real questions and keep 5/10-question games. The 30-second timer is unchanged. Both lengths were played successfully with the real content in the hosted preview.

A production build was staged and checked before promotion. Deployment `dpl_7Crvj7FfKzv4fGesTbAJ8NvbmRMG` at https://vegevisa-6dtn0qbcn-ahti.vercel.app used production credentials and was promoted to the public domain. Staged checks confirmed both question lengths, empty initial score lists, owner login, secure cookies, exact imported content, cross-site rejection, anonymous denial and logout.

On the actual public domain, a browser completed a five-question game, saved its score, and a separate browser read that score. Owner login showed 25 active questions and the correct settings; backup and logout worked. Only the uniquely identified release-test score was removed afterwards; no production leaderboard was reset. A fresh production backup restored into a new local database with all 25 questions, score records, settings, revisions and reset state matching exactly.

The first production error-log scan returned three Postgres SSL-mode deprecation warnings, all attached to successful HTTP 200 requests. It found no application failure in that bounded scan. This does not establish future uptime or load capacity.

## Storage and source status

The preview resource is `vegevisa-preview`, store `store_5i1Q253SkfOCDJvB`, linked only to Preview/Development. The production resource is `vegevisa-production`, store `store_rqmziNYDtzwgwo7m`, linked only to Production. Both use `fra1` and the selected `free_v3` plan. The production resource was freshly inspected as available on the Free plan. Distinct database hosts, URLs and Neon project IDs were checked before migration.

All 25 source questions are active in both databases, with 5/10-question games and 30 seconds per question. Question text, answers, correct-answer mappings and IDs were preserved. The original CSV with 5 active questions and the approved all-active CSV remain under ignored `backups/`, together with before/after backups. Synthetic preview questions were replaced only after confirming that the test dataset had not changed.

Production has its own generated admin password and rate-limit secret. The password is stored locally in ignored `backups/production-admin.txt` with mode 0600. Production origin is exactly `https://vegevisa.vercel.app`. Preview login credentials cannot authenticate against production.

The current [Neon Free plan announcement](https://neon.com/blog/neon-free-plan-1-gb-per-project) documents 1 GB storage per project, 100 compute-unit hours per project per month and a six-hour restore window. No paid upgrade was selected. These are provider-documented limits, not a provider-recovery rehearsal; the application's manual backup/restore was tested. The older plans page still showed 0.5 GB, so the newer dated announcement is the cited limit.

The old Upstash resource remains unavailable and old scores have not been recovered. This release starts with an empty score history and preserves future scores in Postgres.

## Decisions made during implementation

1. Used `pg` with Vercel pool lifecycle management instead of the proposed Neon HTTP driver. This supports interactive transactions and the same real Postgres tests locally. If unsuitable under production traffic, pool settings may need adjustment.
2. Committed the connected storage/auth/routes/game implementation together after checks, rather than committing broken intermediate interfaces task by task. The cost is a larger initial review diff.
3. Updated Next.js within version 16 to 16.3.8 for security fixes, with compatible dependency updates. The risk is a framework regression; local and hosted builds and browser flows passed.
4. Retrying a historic score hidden by a reset returns no rank; new visible scores rank against the current list. Existing UI does not display the returned rank. Any future rank consumer must handle a null value.

Review minors were addressed: the CSV explicitly requires an `active` column, reset copy says records remain stored, and the browser test asserts the running timer's original maximum. No review findings were deferred.

## Operations and recovery

Production content migration and public browser checks are complete. Source exports, production backups and credentials remain ignored and were not committed. The public quiz has no runtime Upstash or Google Sheets dependency.

Score calculation remains client-side, as agreed; this is not an anti-cheat redesign. Hosted checks used separate requests and browsers but do not prove a specific number of simultaneous Vercel function instances. No recurring monitoring or backup schedule was created.

Keep the new database for rollback. The old Upstash build is not a working rollback target. See README for password rotation, manual backup/restore and disabling admin access while preserving data.
