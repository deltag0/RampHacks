# Swapp

Swapp is a house-exchange platform for members who want to travel to each
other's regions without booking hotels. The initial product includes a polished
landing page, searchable home discovery, filters, and a typed API seam ready for
database-backed matching.

Search state is encoded in the `/search` URL using `destination`, `from`, `to`,
`travelers`, `type`, repeated `amenity`, and `sort` parameters. Home cards link
to `/homes/[id]`; unknown or unpublished IDs receive a user-friendly 404.
Malformed or unsupported filter values are ignored, traveler counts are capped,
and browser back/forward navigation restores the visible controls.

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
