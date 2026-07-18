# Swapp

Swapp is a house-exchange platform for members who want to travel to each
other's regions without booking hotels. The initial product includes a polished
landing page, searchable home discovery, filters, and a typed API seam ready for
database-backed matching.

Search state is encoded in the `/search` URL using `destination`, `from`, `to`,
`travelers`, `type`, and repeated `amenity` parameters. Home cards link
to `/homes/[id]`; unknown or unpublished IDs receive a user-friendly 404.
Malformed or unsupported filter values are ignored, traveler counts are capped,
and browser back/forward navigation restores the visible controls.

## Run locally

Project tooling runs in containers:

```bash
docker compose up --build
```

Copy `.env.example` to `.env` and set the project URL and publishable key from
the Supabase project settings. Then open `http://localhost:3000`.

Published home discovery and detail pages read from the RLS-protected
`public.homes` and `public.regions` tables through Supabase. Missing database
configuration fails explicitly; the application does not fall back to
placeholder marketplace records.

## Checks

```bash
docker compose run --rm --no-deps web npm run lint
docker compose run --rm --no-deps web npm run typecheck
docker compose build web
```

See `docs/architecture/README.md` for the frontend/backend boundaries.
