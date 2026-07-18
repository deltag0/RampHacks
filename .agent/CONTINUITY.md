# Workspace Continuity

[PLANS]

- 2026-07-18T16:18:52Z [USER] Build a house-swapping platform that reciprocally matches people seeking travel in each other's countries or regions.
- 2026-07-18T16:18:52Z [ASSUMPTION] Begin with the implementation sequence documented in `AGENTS.md`; no application scaffold exists yet.
- 2026-07-18T17:13:32Z [USER] Add private member messaging for exchange coordination and individual confirmation that each member found the exchanged home, entered, and settled in.
- 2026-07-18T16:25:57Z [USER] Implement Supabase-backed login, user tracking, member ratings, a trust factor, and histories of booked homes and visited places.
- 2026-07-18T16:25:57Z [ASSUMPTION] Proposed safe scope is authenticated account activity/audit tracking, ratings limited to completed exchanges, a derived explainable trust summary, and history derived from exchange records.
- 2026-07-18T17:00:00Z [USER] Implement authentication first, including member sign-up and Google sign-in.
- 2026-07-18T17:22:33Z [USER] Deploy the Next.js application on Vercel and preserve a fast production-launch checklist for a future turn.
- 2026-07-18T17:22:33Z [TOOL] Vercel launch checklist: import the Git repository; configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and production `NEXT_PUBLIC_SITE_URL`; deploy once to obtain the canonical URL; apply every pending Supabase migration; set Supabase Auth Site URL to production and allow exact production/local callback URLs; add the production origin to the Google Web OAuth client while retaining the Supabase callback URI; publish the Google OAuth audience when public access is intended; redeploy and smoke-test email, Google, reset, sign-out, protected routes, messaging, and RLS.

[DECISIONS]

- 2026-07-18T16:18:52Z [USER] Use Next.js, with Python permitted where useful.
- 2026-07-18T16:18:52Z [ASSUMPTION] Use a TypeScript-first Next.js modular monolith with PostgreSQL/PostGIS; defer Python to an optional matching service justified by ranking or data-processing needs.
- 2026-07-18T16:18:52Z [ASSUMPTION] Treat matching as reciprocal, explainable, privacy-aware, and based on compatible regions, dates, homes, and household needs.
- 2026-07-18T17:13:32Z [CODE] Scope one private conversation to each exchange; authorize only its two exchange participants and require each member to confirm only their own arrival.
- 2026-07-18T17:13:32Z [CODE] Advance a confirmed exchange to `in_progress` only after both arrival confirmations exist, with each confirmation recorded as an audit event.
- 2026-07-18T16:25:57Z [USER] Supabase will provide the backend platform.
- 2026-07-18T16:25:57Z [TOOL] Current official Supabase guidance uses `@supabase/ssr` with `@supabase/supabase-js` for cookie-based Next.js SSR authentication and recommends version-controlled CLI migrations with RLS on exposed tables.
- 2026-07-18T16:30:00Z [USER] “Tracking” means the member's history, not live location tracking or general analytics.
- 2026-07-18T17:15:00Z [CODE] Member history is derived from immutable exchange relationships; visited places expose completed-exchange regions rather than exact addresses. Ratings require a completed exchange, and the database-managed `trust-v1` summary preserves explainable component counts.
- 2026-07-18T17:10:00Z [CODE] Authentication uses current Supabase SSR cookie clients, PKCE callbacks, server-side `getClaims` identity validation, Next.js 16 `proxy.ts`, Zod boundary validation, and local-only redirect targets.
- 2026-07-18T17:22:33Z [USER] Vercel will host the production Next.js application; localhost Google OAuth setup may proceed before the production URL exists.

[PROGRESS]

- 2026-07-18T16:18:52Z [TOOL] Repository-specific contributor and agent guidance was created in `AGENTS.md`.
- 2026-07-18T17:13:32Z [CODE] Added conversation, message, and arrival-confirmation schema with RLS, authorship validation, realtime message publication, conversation backfill, and arrival RPC.
- 2026-07-18T17:13:32Z [CODE] Added authenticated inbox and conversation routes, realtime refresh, message composer, arrival check-in UI, and dashboard navigation.
- 2026-07-18T16:35:00Z [CODE] Added ignored `.env.local` placeholders for the Supabase URL and publishable key, added a committable `.env.example`, and explicitly allowed `.env.example` through `.gitignore`.
- 2026-07-18T16:45:00Z [TOOL] Configured the official hosted Supabase MCP globally in Codex, scoped to project `qrnyihklvqgfsysjfatv`, and completed OAuth authorization successfully.
- 2026-07-18T17:15:00Z [CODE] Added the first Supabase migration for members, households, homes, regions, exchanges, ratings, verification records, trust summaries, audit events, history views, constraints, triggers, indexes, grants, and RLS.
- 2026-07-18T17:15:00Z [CODE] Documented the member relationship, history, trust-scoring, and authorization model in `docs/architecture/member-data-model.md`.
- 2026-07-18T17:40:00Z [USER] User reported pasting and running the member migration in the hosted Supabase SQL Editor.
- 2026-07-18T17:50:00Z [TOOL] Confirmed the hosted migration through the Supabase REST API: `regions` and `homes` return HTTP 200 for the publishable/anonymous role, while member-private tables and history views exist and correctly return permission-denied responses without authentication.
- 2026-07-18T17:10:00Z [CODE] Added email/password sign-up and sign-in, Google OAuth initiation, PKCE callback exchange, password reset/update, sign-out, session refresh, protected dashboard routing, accessible auth pages, and an authenticated trust-summary dashboard.
- 2026-07-18T17:10:00Z [CODE] Added `@supabase/ssr`, `@supabase/supabase-js`, and Vitest; removed unused Prisma, bcrypt, and jose packages and pinned patched PostCSS 8.5.19.

[DISCOVERIES]

- 2026-07-18T16:18:52Z [TOOL] The repository contained no tracked project files or existing conventions when guidance was created.
- 2026-07-18T16:18:52Z [TOOL] Official documentation lookup was unavailable during stack validation; exact dependency versions remain UNCONFIRMED and intentionally unpinned in the guidance.
- 2026-07-18T17:13:32Z [TOOL] Container verification was blocked by Docker organization sign-in; existing workspace dependencies were used without host installation. Vitest (11 tests), ESLint, TypeScript, Next.js production build, Prettier check, and `git diff --check` passed.
- 2026-07-18T16:30:00Z [TOOL] No connected Supabase MCP capability is currently exposed in this workspace.
- 2026-07-18T16:45:00Z [TOOL] Supersedes the prior MCP discovery: the server is connected, but this already-running Codex session has not dynamically loaded its tools and requires a session restart.
- 2026-07-18T17:15:00Z [TOOL] Hosted REST schema inspection failed because the shell could not resolve the Supabase domain; the remote schema remains UNCONFIRMED.
- 2026-07-18T17:15:00Z [TOOL] Disposable PostgreSQL validation is blocked because Docker Desktop requires an organization-authorized sign-in. Static checks passed: Prettier, ESLint, TypeScript, and `git diff --check`.
- 2026-07-18T17:15:00Z [CODE] Static review caught and fixed mutable exchange ownership, skipped lifecycle transitions, an invalid mixed trigger event form, and cancellation scoring that initially penalized both members.
- 2026-07-18T17:40:00Z [TOOL] Superseded: the REST schema-description root requires a secret key and was not a valid publishable-key check.
- 2026-07-18T17:50:00Z [TOOL] The updated `.env.local` publishable key is valid for project `qrnyihklvqgfsysjfatv`; an anonymous `regions` query returned HTTP 200.
- 2026-07-18T17:10:00Z [TOOL] Superseded: Supabase Auth initially reported Google disabled.
- 2026-07-18T17:28:00Z [TOOL] Supabase Auth now reports both email signup and Google provider enabled for project `qrnyihklvqgfsysjfatv`.
- 2026-07-18T17:32:00Z [TOOL] Google OAuth currently returns `redirect_uri_mismatch`; Supabase is correctly sending the exact callback `https://qrnyihklvqgfsysjfatv.supabase.co/auth/v1/callback`, so the matching Google Web OAuth client configuration is missing or differs from that exact URI.
- 2026-07-18T17:10:00Z [TOOL] Local auth routes return HTTP 200, and unauthenticated `/dashboard` returns HTTP 307 to `/auth/login?next=%2Fdashboard`.

[OUTCOMES]

- 2026-07-18T16:18:52Z [CODE] `AGENTS.md` now defines product terminology, architecture, domain modeling, matching rules, security, privacy, containers, testing, documentation, workflow, and definition of done.
- 2026-07-18T17:13:32Z [CODE] The user-management worktree now includes a private, exchange-scoped messaging experience and database-enforced, two-party settled-in confirmation flow; the new migration has not been applied to remote Supabase.
- 2026-07-18T17:50:00Z [TOOL] The requested user schemas and relations are applied to hosted Supabase, and anonymous-access checks confirm the expected public/private RLS boundary.
- 2026-07-18T17:10:00Z [TOOL] Authentication implementation passes formatting, ESLint, strict TypeScript, 8 Vitest assertions, production build, `git diff --check`, and a production dependency audit with zero known vulnerabilities.
