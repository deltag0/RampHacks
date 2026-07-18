# Swapp

Swapp is a house-exchange platform for members who want to travel to each
other's regions without booking hotels. The initial product includes a polished
landing page, searchable home discovery, filters, and a typed API seam ready for
database-backed matching. Members can also prototype an interactive home tour
by connecting their own room images with navigable arrows.

## Interactive home tours

Open `http://localhost:3000/tour-builder` and add at least two room images.
Choose a scene, add a connection, select its destination, and place the arrow
on the source image. Preview mode shows the same navigation an exchange partner
would use, with the scene list acting as an accessible alternative.

The current tour builder is still a session-only interaction prototype:
selected images use temporary browser object URLs and are neither uploaded nor
persisted. It must not be described as saving a member listing. The Supabase
schema for durable tours and private images is defined in
`supabase/migrations/20260718180000_create_interactive_home_tours.sql`; wiring
the UI to it depends on the authentication/Supabase client branch so every
mutation is authorized against the existing home owner.

## Run locally

Project tooling runs in containers:

```bash
docker compose up --build
```

Open `http://localhost:3000`. PostgreSQL with PostGIS is available to the web
service through `DATABASE_URL`.

## Checks

```bash
docker compose run --rm --no-deps web npm run lint
docker compose run --rm --no-deps web npm run typecheck
docker compose build web
```

See `docs/architecture/README.md` for the frontend/backend boundaries.
