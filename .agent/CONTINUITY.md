# Workspace Continuity

[PLANS]

- 2026-07-18T16:18:52Z [USER] Build a house-swapping platform that reciprocally matches people seeking travel in each other's countries or regions.
- 2026-07-18T16:18:52Z [ASSUMPTION] Begin with the implementation sequence documented in `AGENTS.md`; no application scaffold exists yet.
- 2026-07-18T16:25:52Z [USER] Build the initial professional website with distinct frontend/backend structure, landing page, search, and filters.
- 2026-07-18T16:43:45Z [USER] Develop the home detail page and URL-driven search filters in a dedicated worktree.

[DECISIONS]

- 2026-07-18T16:18:52Z [USER] Use Next.js, with Python permitted where useful.
- 2026-07-18T16:18:52Z [ASSUMPTION] Use a TypeScript-first Next.js modular monolith with PostgreSQL/PostGIS; defer Python to an optional matching service justified by ranking or data-processing needs.
- 2026-07-18T16:18:52Z [ASSUMPTION] Treat matching as reciprocal, explainable, privacy-aware, and based on compatible regions, dates, homes, and household needs.
- 2026-07-18T16:25:52Z [CODE] Kept the initial application as a TypeScript modular monolith: UI in `src/app`/`src/components`, backend seam in `src/app/api`/`src/server`, and reserved framework-independent rules in `src/domain`.
- 2026-07-18T16:43:01Z [USER] Remove synthetic marketplace data without changing contracts that may intersect with in-progress user management.
- 2026-07-18T16:51:22Z [CODE] Search URLs use validated canonical parameters and detail pages use `/homes/[id]`; precise addresses are never rendered.
- 2026-07-18T17:08:44Z [CODE] Public discovery reads only published homes and normalized regions through Supabase RLS; unavailable member trust, photo, bedroom, bathroom, and description fields are not fabricated in the UI.

[PROGRESS]

- 2026-07-18T16:18:52Z [TOOL] Repository-specific contributor and agent guidance was created in `AGENTS.md`.
- 2026-07-18T16:25:52Z [CODE] Added responsive landing and search experiences, interactive filters, reusable home cards, synthetic listings, and a typed read-only homes API.
- 2026-07-18T16:25:52Z [CODE] Added containerized Next.js/PostGIS foundation and documented local commands and architectural boundaries.
- 2026-07-18T16:43:45Z [TOOL] Created branch `home-detail-url-filters` at worktree `/Users/termev/RampHacks-home-detail-url-filters`, seeded with the current uncommitted `swapp` working state.
- 2026-07-18T16:43:01Z [CODE] Removed all synthetic home/member records and fake destination inventory counts; landing and search now render explicit empty states.
- 2026-07-18T16:51:22Z [CODE] Added URL-synchronized destination, date, traveler, home type, amenity, and sort filters plus a responsive home detail surface and unpublished-home 404.
- 2026-07-18T16:51:22Z [CODE] Reused the same validated filter contract in `/api/homes` so browser and API filtering cannot drift.
- 2026-07-18T16:57:49Z [TOOL] Committed the completed work as `2b5d0aa` and pushed branch `home-detail-url-filters` to `origin`.
- 2026-07-18T17:02:08Z [TOOL] Merged `home-detail-url-filters` into `swapp` with merge commit `a4c9f27`; overlapping independently committed files were resolved to the complete feature tree.
- 2026-07-18T17:08:44Z [CODE] Replaced the in-memory home repository with a Zod-validated Supabase REST repository shared by landing, search, detail, and `/api/homes`; removed hard-coded destination inventory and unsupported sort/trust claims.
- 2026-07-18T17:12:10Z [TOOL] Committed the Supabase integration as `b00ff5d` on new branch `supabase-data-integration` and pushed it to `origin` without merging into `swapp`.

[DISCOVERIES]

- 2026-07-18T16:18:52Z [TOOL] The repository contained no tracked project files or existing conventions when guidance was created.
- 2026-07-18T16:18:52Z [TOOL] Official documentation lookup was unavailable during stack validation; exact dependency versions remain UNCONFIRMED and intentionally unpinned in the guidance.
- 2026-07-18T16:26:07Z [TOOL] Expedia's Travel Redirect API supports flight and lodging discovery followed by an Expedia redirect, but its official onboarding guide currently says new API applications are paused.
- 2026-07-18T16:26:07Z [TOOL] Expedia Rapid supports an embedded lodging booking path but adds booking, payment, itinerary, and cancellation responsibilities that are outside the initial exchange-marketplace scope.
- 2026-07-18T16:25:52Z [TOOL] `docker compose build web` was attempted but Docker was unavailable at `/Users/termev/.docker/run/docker.sock`; lint, typecheck, and production build remain UNCONFIRMED.
- 2026-07-18T16:25:52Z [TOOL] `git diff --check` completed without whitespace errors.
- 2026-07-18T16:43:01Z [TOOL] Confirmed synthetic member names, listing IDs, ratings, badges, and inventory counts no longer occur in source; `git diff --check` passed.
- 2026-07-18T16:51:22Z [TOOL] Container checks were blocked because Docker Desktop requires organization sign-in; workspace dependencies are absent, so lint, typecheck, and build remain UNCONFIRMED.
- 2026-07-18T16:57:49Z [TOOL] The no-mistakes gate was initialized but failed before creating a run with `no previous run for branch`; remote push dry-run and remote commit verification succeeded.
- 2026-07-18T17:02:08Z [TOOL] The no-mistakes gate repeated the same pre-run failure for `swapp`; the merge tree matched `home-detail-url-filters` before the continuity update and the `swapp` push dry-run succeeded.
- 2026-07-18T17:08:44Z [TOOL] Supabase public schema has 8 RLS-enabled tables and 0 rows; public anonymous reads are permitted for published `homes` and `regions`, while member/trust reads require authentication.
- 2026-07-18T17:08:44Z [TOOL] Supabase advisors reported externally callable SECURITY DEFINER functions and several unindexed foreign keys; no remote schema changes were made.
- 2026-07-18T17:08:44Z [TOOL] Local lint, TypeScript typecheck, production build, and `git diff --check` passed after Supabase integration; direct local REST networking was unavailable, while MCP schema/policy reads succeeded.
- 2026-07-18T17:12:10Z [TOOL] Runtime smoke tests subsequently passed for `/`, `/search`, `/api/homes`, and the unknown-home 404 using the ignored local Supabase configuration; the no-mistakes gate still failed before creating a run.

[OUTCOMES]

- 2026-07-18T16:18:52Z [CODE] `AGENTS.md` now defines product terminology, architecture, domain modeling, matching rules, security, privacy, containers, testing, documentation, workflow, and definition of done.
- 2026-07-18T16:25:52Z [CODE] Initial Swapp product surface is implemented with a professional discovery flow and an explicit path from in-memory prototype data to PostgreSQL/PostGIS.
- 2026-07-18T16:43:01Z [CODE] `/api/homes` now returns an honest empty collection until real persistence is connected, without changing home/member types.
- 2026-07-18T16:51:22Z [CODE] Search filters are shareable and browser-navigation aware; home cards now target a privacy-safe, responsive detail route that handles missing inventory without exposing synthetic data.
- 2026-07-18T17:08:44Z [CODE] Marketplace reads no longer use placeholder records; the empty UI now reflects the connected Supabase database having no regions, members, or homes.
