# Swapp

Swapp is a house-exchange platform for members who want to travel to each
other's regions without booking hotels. The initial product includes a polished
landing page, searchable home discovery, filters, and a typed API seam ready for
database-backed matching.

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
