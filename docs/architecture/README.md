# Application structure

Swapp starts as a TypeScript modular monolith so the product can move quickly without duplicating business rules across services.

- `src/app` contains Next.js routes, pages, and public HTTP endpoints.
- `src/components` contains reusable interface components.
- `src/server` owns server-side data access and application services.
- `src/domain` is reserved for framework-independent matching, exchange, home, and member rules.
- `services/matching` should only be added if optimization or ranking experiments justify a separate Python service.

The landing page, search route, home detail route, and `/api/homes` endpoint use
the shared server-only repository in `src/server/data/homes.ts`. That repository
reads published homes and their normalized regions from Supabase through its
REST API and validates every response with Zod. Supabase RLS remains the
authorization boundary; there is no in-memory marketplace fallback.
