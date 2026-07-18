# RampHacks Project Guidance

This file defines repository-specific working agreements for agents and contributors. It supplements the global `~/.codex/AGENTS.md`; the global guidance still applies.

## Product goal

Build a trusted house-swapping platform for people who want to travel without booking a hotel. The platform should match members who:

- want to visit each other's countries or regions during compatible date ranges;
- offer homes in reasonably comparable regions;
- have compatible home capacity, amenities, accessibility, and house rules; and
- satisfy the platform's trust, identity, safety, and communication requirements.

The product is an exchange marketplace, not a conventional rental marketplace. Do not introduce nightly pricing, bidding, or host/guest assumptions unless the product requirements explicitly change.

## Product language

Use these terms consistently:

- **Member**: a person using the platform.
- **Household**: one or more members traveling together.
- **Home**: a property offered for an exchange.
- **Travel intent**: a member's desired destination, date window, flexibility, and party requirements.
- **Exchange**: an agreed house swap between two households.
- **Match candidate**: a potential reciprocal pairing that has not been accepted.
- **Region**: a normalized geographic area used for search and matching.
- **Comparable region**: a region with similar characteristics; it does not imply identical property value.

Prefer neutral language such as "exchange partner" instead of treating one party as a host and the other as a guest.

## Recommended architecture

Start with a TypeScript modular monolith. Keep deployment and local development simple until actual load or team boundaries justify additional services.

### Web application

- Next.js with the App Router.
- TypeScript in strict mode.
- React Server Components by default; add Client Components only for browser APIs or genuine interactivity.
- Server Actions for small authenticated mutations and Route Handlers for public APIs, callbacks, uploads, or endpoints that need explicit HTTP semantics.
- Tailwind CSS for styling.
- An accessible component system built on Radix primitives or an equivalent headless library.
- Zod schemas at every untrusted boundary.
- React Hook Form for complex client-side forms.

Do not duplicate business rules inside React components. Put domain logic in framework-independent modules under `src/domain` or `src/server`.

### Data and platform services

- PostgreSQL as the source of truth.
- PostGIS for radius queries, regional boundaries, geographic containment, and distance calculations.
- Drizzle ORM for typed relational access and migrations; use reviewed parameterized SQL for PostGIS operations that the ORM cannot express cleanly.
- An S3-compatible object store for home photos. Local development may use MinIO.
- A transactional email provider behind an application-owned adapter.
- A map/geocoding provider behind an application-owned adapter so the provider can be changed later.
- Redis only when a demonstrated need exists for queues, rate limits, caching, or ephemeral coordination. Do not make Redis part of the initial domain model.

Keep vendor SDKs at infrastructure boundaries. Domain code must not depend directly on storage, email, geocoding, analytics, or identity vendors.

### Authentication and authorization

Use a maintained authentication provider or library that supports secure sessions, email verification, account recovery, and social login if required. Keep the member profile and authorization state in the application database.

- Authentication answers "who is this?"
- Authorization answers "may this member do this?"
- Enforce authorization on the server for every mutation and sensitive read.
- Never rely on hidden UI controls as access control.
- Model administrative and support access explicitly and audit privileged actions.

Select the concrete auth provider during project setup after checking its current Next.js support, deployment constraints, pricing, and data residency.

### Optional Python service

Do not add Python for basic matching. Implement the initial deterministic matcher in TypeScript and SQL.

Python becomes appropriate when the repository needs optimization, ranking experiments, geospatial/data pipelines, or machine-learning models that are materially easier to maintain in Python. If introduced:

- use a separate `services/matching` FastAPI service;
- manage dependencies with `uv`;
- use Pydantic for request and response schemas;
- expose a versioned internal API or asynchronous job contract;
- generate or validate shared contracts from a single schema source;
- keep PostgreSQL as the system of record; and
- make ranking reproducible, explainable, and observable.

The web app must remain functional with a deterministic fallback if the optional ranking service is unavailable.

## Suggested repository layout

```text
.
├── AGENTS.md
├── .agent/
│   └── CONTINUITY.md
├── app/ or src/app/
├── src/
│   ├── components/
│   ├── domain/
│   │   ├── exchanges/
│   │   ├── homes/
│   │   ├── matching/
│   │   ├── members/
│   │   └── travel-intents/
│   ├── server/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── integrations/
│   │   └── services/
│   └── test/
├── db/
│   ├── migrations/
│   └── seeds/
├── services/
│   └── matching/       # optional; add only when justified
├── docs/
│   ├── architecture/
│   └── product/
├── compose.yaml
└── Dockerfile
```

Follow the generated Next.js layout if it differs, but preserve the separation between UI, domain logic, persistence, and external integrations.

## Core domain model

At minimum, plan for:

- `members`: account linkage, display profile, locale, verification state, and lifecycle state.
- `households`: party composition and reusable travel requirements.
- `homes`: owner, approximate location, capacity, property type, amenities, accessibility, rules, and publication state.
- `home_photos`: ordered object references and moderation state.
- `home_availability`: exchangeable date ranges and constraints.
- `regions`: canonical identifiers, hierarchy, geometry, and normalized attributes.
- `travel_intents`: desired regions, date windows, flexibility, party size, and requirements.
- `match_candidates`: member/home/intent pair, scoring version, score components, explanation, and status.
- `exchanges`: both homes, both households, agreed dates, lifecycle state, and cancellation metadata.
- `conversations` and `messages`: communication scoped to authorized participants.
- `favorites` or `shortlists`: private member preferences.
- `reviews`: allowed only after a completed exchange; moderation and dispute state must be explicit.
- `verification_records`: provider references and status, not raw identity documents unless absolutely required.
- `audit_events`: security-sensitive and lifecycle-changing actions.

Use UUIDs or another non-sequential externally safe identifier. Store timestamps as timezone-aware UTC instants and preserve the user's timezone separately when calendar meaning matters.

## Matching rules

Matching is reciprocal. A candidate is eligible only when A's travel intent is compatible with B's home and B's travel intent is compatible with A's home.

Use hard filters before ranking:

- both members and homes are active and eligible;
- each party wants the other's region;
- availability/date windows overlap in both directions;
- each home satisfies the other household's minimum capacity and non-negotiable requirements;
- blocked members and policy-incompatible pairs are excluded; and
- a member is never matched with their own home.

Rank eligible candidates using explicit, versioned components such as:

- destination and region fit;
- date overlap and flexibility;
- home capacity and amenity fit;
- region comparability;
- accessibility and house-rule compatibility;
- travel distance or transport characteristics; and
- trust signals that are lawful, relevant, and non-discriminatory.

Persist the scoring version and component scores. Show members a plain-language explanation such as "Your destinations and dates align, and both homes fit each party's group size." Never present the score as objective property equivalence.

Do not use protected characteristics or obvious proxies for them in eligibility or ranking. Be careful with neighborhood value, postal code, language, nationality, family status, and demographic data. Any fairness-sensitive scoring change requires documentation, test fixtures, and human review.

## Geographic and privacy rules

- Store precise home coordinates only when needed and restrict access.
- Public search results must show an approximate area, never a precise address or coordinate.
- Reveal an exact address only at the appropriate confirmed-exchange stage.
- Geocoding results must be normalized and retain provider attribution where required.
- Use PostGIS geography types for earth-distance calculations when appropriate.
- Never log exact addresses, identity documents, private messages, session tokens, or raw geocoder payloads containing sensitive data.
- Define retention and deletion behavior before collecting identity or verification data.

Location sharing is a security boundary. Treat changes that expose exact locations as high-risk.

## Exchange lifecycle

Model exchange state transitions explicitly. A reasonable starting flow is:

```text
proposed -> discussing -> accepted -> confirmed -> in_progress -> completed
                         \-> declined
accepted/confirmed -------> cancelled
```

The exact state machine must be documented and enforced in domain code. Transitions should be idempotent, authorized, timestamped, and auditable. Confirmation must record both parties' agreement; one member cannot silently alter confirmed dates or homes.

## API and validation conventions

- Validate all input at the boundary with shared schemas.
- Return typed, stable errors; do not expose stack traces or database details.
- Mutations involving confirmation, cancellation, messaging, uploads, or verification must be idempotent where retries are plausible.
- Paginate unbounded collections.
- Apply rate limits to authentication, messaging, contact, geocoding, search, and upload endpoints.
- Use database transactions for multi-record invariants.
- Avoid floating-point values for money if deposits or fees are introduced.
- Version externally consumed APIs and asynchronous event payloads.

## Security and trust

- Follow OWASP guidance for authentication, access control, file uploads, request forgery, injection, and abuse prevention.
- Validate upload MIME type, extension, size, dimensions, and content; strip unsafe metadata where practical.
- Keep uploaded objects private by default and issue short-lived authorized URLs.
- Protect messages and exchange details from insecure direct object references.
- Add block, report, moderation, and account suspension primitives early.
- Audit exact-address reveals, verification changes, admin access, and exchange state changes.
- Use synthetic data in development and tests. Never copy production member data locally.
- Keep secrets in environment-specific secret stores. Commit only `.env.example` with placeholder names.

Do not claim that identity, homes, or members are "verified" unless the product records exactly what was checked and by whom.

## Accessibility and internationalization

- Target WCAG 2.2 AA.
- All flows must work with keyboard navigation and visible focus.
- Provide labels, error associations, semantic landmarks, and useful alternative text.
- Do not encode meaning using color alone.
- Design for localization from the start: avoid concatenated UI strings and hard-coded date, number, address, or measurement formats.
- Store locale and timezone preferences explicitly.
- Treat country, region, and address formats as international data, not US-only strings.

## Containers and local development

All project tooling runs in containers by default.

- Provide a multi-stage `Dockerfile` for the Next.js application.
- Provide `compose.yaml` for the app, PostgreSQL with PostGIS, and any required local object storage.
- Pin image versions deliberately; do not use `latest`.
- Run as a non-root user in production images.
- Include container health checks and persistent named volumes for local state.
- Put initialization and seed behavior in version-controlled scripts.
- Do not install Node.js, Python, PostgreSQL, or other system packages on the host.

Preferred command entry points should be documented in the README and exposed through `docker compose`, a `Makefile`, or task runner. Agents should use the repository's existing entry points rather than inventing host-specific commands.

## Code quality

- Keep TypeScript strict; do not use `any` without a narrow documented boundary.
- Prefer small pure functions and explicit domain types.
- Use server-only modules for secrets and privileged database access.
- Avoid generic `utils` dumping grounds; name modules by responsibility.
- Keep migrations forward-only after they have been shared.
- Use structured logs with request/job correlation IDs and automatic sensitive-field redaction.
- Add comments for business invariants and non-obvious tradeoffs, not line-by-line narration.

## Testing strategy

Use:

- Vitest for unit and service-level tests;
- Testing Library for interactive component behavior;
- Playwright for critical browser journeys;
- disposable PostgreSQL/PostGIS containers for integration tests; and
- contract tests for external provider adapters and any Python service boundary.

Required coverage should emphasize behavior and risk, not a percentage target:

- reciprocal match eligibility and scoring explanations;
- date range boundaries, timezones, and daylight-saving transitions;
- geographic containment and distance behavior;
- authorization and object ownership;
- exchange state transitions and concurrent acceptance/cancellation;
- address privacy and exact-location reveal rules;
- upload validation;
- block/report/moderation behavior; and
- the complete propose-to-confirm exchange journey.

Every production bug fix should include a regression test when feasible.

## Observability

- Use structured application logs without sensitive payloads.
- Capture errors with environment and release metadata.
- Track latency and failure rates for search, matching, messaging, geocoding, uploads, and exchange transitions.
- Record matcher version and aggregate outcome metrics.
- Do not send personal data to analytics by default.
- Add health and readiness endpoints for deployed services.

## Documentation and decisions

Keep:

- setup and common commands in `README.md`;
- durable architecture decisions in `docs/architecture/` as short ADRs;
- product vocabulary and state machines in `docs/product/`; and
- ongoing task state in `.agent/CONTINUITY.md`.

Document any new third-party service with its purpose, data sent, failure behavior, local substitute, pricing concern, and removal/migration path.

## Agent workflow

At the start of every turn:

1. Read `.agent/CONTINUITY.md`.
2. Inspect relevant files and existing conventions.
3. Define the goal, acceptance criteria, constraints, and verification.
4. Decide whether current external documentation is required.

When implementing:

1. Make the smallest coherent change.
2. Preserve architectural boundaries and domain terminology.
3. Add or update tests with behavior changes.
4. Update documentation for affected setup, APIs, data, or workflows.
5. Record meaningful plan, decision, progress, discovery, or outcome changes in `.agent/CONTINUITY.md`.

Before completion, run the applicable containerized checks:

- formatting;
- lint;
- TypeScript typecheck;
- unit and integration tests;
- Playwright tests for affected critical flows;
- production build; and
- migration validation when the schema changes.

Report commands run and any checks not run. Do not mark work complete when required checks fail unless the failure is clearly pre-existing or explicitly accepted as out of scope.

## Initial implementation order

Unless the user changes priorities:

1. Containerized Next.js foundation, PostgreSQL/PostGIS, migrations, CI, and test harness.
2. Authentication, member profiles, authorization helpers, and audit events.
3. Home creation, photo upload, approximate public location, and availability.
4. Travel intents and region search.
5. Deterministic reciprocal candidate generation with explainable scoring.
6. Shortlisting, proposals, exchange lifecycle, and notifications.
7. Secure messaging, blocking, reporting, and moderation.
8. Reviews, operational tooling, and measured ranking improvements.

Do not begin with machine learning, microservices, payments, or broad social features.

## Definition of done

A repository change is complete when:

- the requested behavior and acceptance criteria are satisfied;
- authorization, privacy, accessibility, internationalization, and failure cases were considered;
- relevant code, migrations, tests, fixtures, and documentation agree;
- applicable containerized format, lint, typecheck, test, and build checks pass;
- no secrets or sensitive personal/location data were introduced into source, logs, or fixtures;
- impact and remaining follow-ups are reported; and
- `.agent/CONTINUITY.md` contains any meaningful state change.
