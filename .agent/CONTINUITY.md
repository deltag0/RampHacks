# Workspace Continuity

[PLANS]

- 2026-07-18T16:18:52Z [USER] Build a house-swapping platform that reciprocally matches people seeking travel in each other's countries or regions.
- 2026-07-18T16:18:52Z [ASSUMPTION] Begin with the implementation sequence documented in `AGENTS.md`; no application scaffold exists yet.

[DECISIONS]

- 2026-07-18T16:18:52Z [USER] Use Next.js, with Python permitted where useful.
- 2026-07-18T16:18:52Z [ASSUMPTION] Use a TypeScript-first Next.js modular monolith with PostgreSQL/PostGIS; defer Python to an optional matching service justified by ranking or data-processing needs.
- 2026-07-18T16:18:52Z [ASSUMPTION] Treat matching as reciprocal, explainable, privacy-aware, and based on compatible regions, dates, homes, and household needs.

[PROGRESS]

- 2026-07-18T16:18:52Z [TOOL] Repository-specific contributor and agent guidance was created in `AGENTS.md`.

[DISCOVERIES]

- 2026-07-18T16:18:52Z [TOOL] The repository contained no tracked project files or existing conventions when guidance was created.
- 2026-07-18T16:18:52Z [TOOL] Official documentation lookup was unavailable during stack validation; exact dependency versions remain UNCONFIRMED and intentionally unpinned in the guidance.

[OUTCOMES]

- 2026-07-18T16:18:52Z [CODE] `AGENTS.md` now defines product terminology, architecture, domain modeling, matching rules, security, privacy, containers, testing, documentation, workflow, and definition of done.
