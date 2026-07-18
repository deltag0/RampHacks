# Swapp

Swapp is a reciprocal house-exchange platform. It includes Supabase-backed
home discovery, URL-driven search filters, privacy-safe home details,
interactive home-tour prototyping, member authentication, trust history, and
private exchange messaging.

Search state is encoded in `/search` using `destination`, `from`, `to`,
`travelers`, `type`, and repeated `amenity` parameters. Home cards link to
`/homes/[id]`; unknown or unpublished IDs receive a user-friendly 404.

## Configuration

Copy `.env.example` to `.env.local` for direct local development or `.env` for
Docker Compose. Add the Project URL and publishable key from the Supabase
project **Connect** dialog.

In Supabase **Authentication → URL Configuration**, set:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

## Run locally

Project tooling runs in containers by default:

```bash
docker compose up --build
```

When Docker is unavailable, the same application can connect to hosted
Supabase directly:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

Email/password authentication uses Supabase Auth. Email confirmation and
password reset links return through `/auth/callback`.

Google sign-in additionally requires:

1. A Google Cloud OAuth Web client.
2. The Supabase callback shown under **Authentication → Providers → Google**
   added to Google Cloud's authorized redirect URIs.
3. `http://localhost:3000` added to Google Cloud's authorized JavaScript
   origins.
4. The Google Client ID and Client Secret saved and Google enabled in
   Supabase.

Google credentials belong in Supabase and Google Cloud, not in this repository.

## Interactive home tours

Open **My homes** from the member dashboard and choose **Tour** for an owned
home. Room images upload directly to private Storage. Saving replaces the
scene-and-connection graph transactionally while preview mode shows the
navigation an exchange partner will use.

## Member listing workflow

Authenticated members manage homes at `/dashboard/homes`. New homes begin as
private drafts, photos upload directly to private Supabase Storage, and a home
must have at least one photo before it can be published.

## Database migrations

Apply the migrations under `supabase/migrations` in filename order. The
member, messaging, and interactive-tour migrations are applied to the current
hosted development project. Apply
`20260718190000_create_home_photos.sql` before using listing photos or saving
tours through the application.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

See `docs/architecture/README.md` and
`docs/architecture/member-data-model.md` for application boundaries and member
relationships.
