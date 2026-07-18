# Workspace Continuity

[PLANS]

- 2026-07-18T17:10:33Z [USER] Verify the tour feature against the updated Supabase schema and replace placeholder actions with correctly authorized database operations.
- 2026-07-18T16:18:52Z [USER] Build a house-swapping platform that reciprocally matches people seeking travel in each other's countries or regions.
- 2026-07-18T16:18:52Z [ASSUMPTION] Begin with the implementation sequence documented in `AGENTS.md`; no application scaffold exists yet.
- 2026-07-18T16:25:52Z [USER] Build the initial professional website with distinct frontend/backend structure, landing page, search, and filters.
- 2026-07-18T16:43:45Z [USER] Develop the home detail page and URL-driven search filters in a dedicated worktree.
- 2026-07-18T16:49:40Z [USER] Develop an interactive home-tour graph, with image scenes connected by navigable arrows, in a dedicated worktree.

[DECISIONS]

- 2026-07-18T17:10:33Z [CODE] Added a local, unapplied Supabase migration for tours rather than mutating the connected remote project; remote writes require an explicit dry-run workflow.
- 2026-07-18T17:10:33Z [CODE] Tour rows reference existing `homes.id`; authorization derives from `homes.owner_member_id`, and image rows store private Storage paths rather than public or object URLs.
- 2026-07-18T16:55:52Z [CODE] Implemented the first interactive-tour slice as a browser-session builder with directed scene connections and percentage-based hotspots; persistence and private object storage remain deferred until the home/upload backend exists.
- 2026-07-18T16:55:52Z [CODE] Kept tour graph types and edge cleanup in `src/domain/home-tours`; the React editor owns only temporary image selection and interaction state.
- 2026-07-18T16:18:52Z [USER] Use Next.js, with Python permitted where useful.
- 2026-07-18T16:18:52Z [ASSUMPTION] Use a TypeScript-first Next.js modular monolith with PostgreSQL/PostGIS; defer Python to an optional matching service justified by ranking or data-processing needs.
- 2026-07-18T16:18:52Z [ASSUMPTION] Treat matching as reciprocal, explainable, privacy-aware, and based on compatible regions, dates, homes, and household needs.
- 2026-07-18T16:25:52Z [CODE] Kept the initial application as a TypeScript modular monolith: UI in `src/app`/`src/components`, backend seam in `src/app/api`/`src/server`, and reserved framework-independent rules in `src/domain`.
- 2026-07-18T16:43:01Z [USER] Remove synthetic marketplace data without changing contracts that may intersect with in-progress user management.

[PROGRESS]

- 2026-07-18T17:10:33Z [CODE] Added `home_tours`, `home_tour_scenes`, `home_tour_connections`, same-tour foreign-key invariants, owner/published RLS policies, and a constrained private `home-tour-images` bucket migration.
- 2026-07-18T16:55:52Z [CODE] Added `/tour-builder` with multi-image scene creation, room names and image descriptions, positioned connections, scene/connection removal, and visitor preview navigation.
- 2026-07-18T16:55:52Z [CODE] Added tour entry points to the global header and documented privacy and persistence boundaries.
- 2026-07-18T16:18:52Z [TOOL] Repository-specific contributor and agent guidance was created in `AGENTS.md`.
- 2026-07-18T16:25:52Z [CODE] Added responsive landing and search experiences, interactive filters, reusable home cards, synthetic listings, and a typed read-only homes API.
- 2026-07-18T16:25:52Z [CODE] Added containerized Next.js/PostGIS foundation and documented local commands and architectural boundaries.
- 2026-07-18T16:43:45Z [TOOL] Created branch `home-detail-url-filters` at worktree `/Users/termev/RampHacks-home-detail-url-filters`, seeded with the current uncommitted `swapp` working state.
- 2026-07-18T16:43:01Z [CODE] Removed all synthetic home/member records and fake destination inventory counts; landing and search now render explicit empty states.
- 2026-07-18T16:49:40Z [TOOL] Created branch `interactive-home-tour` at worktree `/Users/termev/RampHacks-interactive-home-tour`, seeded with the current uncommitted `swapp` working state.

[DISCOVERIES]

- 2026-07-18T17:10:33Z [TOOL] The connected Supabase project has RLS-enabled member/home/exchange/trust tables but zero `homes` rows, no tour/photo tables, no Storage buckets, and no recorded migrations.
- 2026-07-18T17:10:33Z [TOOL] Supabase authentication/client code exists only as uncommitted work in `/Users/termev/RampHacks-user-management`; integrating it here would overwrite or duplicate another contributor's in-progress files. Tour UI persistence remains BLOCKED on that work being merged or otherwise handed off.
- 2026-07-18T16:55:52Z [TOOL] Containerized checks were blocked because Docker Desktop requires organization sign-in; local project tooling is absent, so format, lint, typecheck, and build remain UNCONFIRMED. `git diff --check` passed.
- 2026-07-18T16:18:52Z [TOOL] The repository contained no tracked project files or existing conventions when guidance was created.
- 2026-07-18T16:18:52Z [TOOL] Official documentation lookup was unavailable during stack validation; exact dependency versions remain UNCONFIRMED and intentionally unpinned in the guidance.
- 2026-07-18T16:26:07Z [TOOL] Expedia's Travel Redirect API supports flight and lodging discovery followed by an Expedia redirect, but its official onboarding guide currently says new API applications are paused.
- 2026-07-18T16:26:07Z [TOOL] Expedia Rapid supports an embedded lodging booking path but adds booking, payment, itinerary, and cancellation responsibilities that are outside the initial exchange-marketplace scope.
- 2026-07-18T16:25:52Z [TOOL] `docker compose build web` was attempted but Docker was unavailable at `/Users/termev/.docker/run/docker.sock`; lint, typecheck, and production build remain UNCONFIRMED.
- 2026-07-18T16:25:52Z [TOOL] `git diff --check` completed without whitespace errors.
- 2026-07-18T16:43:01Z [TOOL] Confirmed synthetic member names, listing IDs, ratings, badges, and inventory counts no longer occur in source; `git diff --check` passed.

[OUTCOMES]

- 2026-07-18T16:55:52Z [CODE] Members can now construct and preview a session-only interactive home tour without uploading images to a server; the UI includes non-hotspot scene navigation and image descriptions for accessibility.
- 2026-07-18T16:18:52Z [CODE] `AGENTS.md` now defines product terminology, architecture, domain modeling, matching rules, security, privacy, containers, testing, documentation, workflow, and definition of done.
- 2026-07-18T16:25:52Z [CODE] Initial Swapp product surface is implemented with a professional discovery flow and an explicit path from in-memory prototype data to PostgreSQL/PostGIS.
- 2026-07-18T16:43:01Z [CODE] `/api/homes` now returns an honest empty collection until real persistence is connected, without changing home/member types.
