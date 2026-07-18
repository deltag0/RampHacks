# Swapp

Swapp is a reciprocal house-swapping platform built with Next.js and Supabase.

## Local development

Copy `.env.example` to `.env.local` and add the Project URL and publishable key
from the Supabase project **Connect** dialog.

In Supabase **Authentication → URL Configuration**, set:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`

Then run:

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
2. The Supabase Auth callback URL from **Authentication → Providers → Google**
   added to Google Cloud's authorized redirect URIs.
3. `http://localhost:3000` added to Google Cloud's authorized JavaScript
   origins.
4. The Google Client ID and Client Secret saved and the provider enabled in
   Supabase.

Google credentials belong in Supabase and Google Cloud, not in this repository.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```
