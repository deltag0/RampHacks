# Application structure

Swapp starts as a TypeScript modular monolith so the product can move quickly without duplicating business rules across services.

- `src/app` contains Next.js routes, pages, and public HTTP endpoints.
- `src/components` contains reusable interface components.
- `src/server` owns server-side data access and application services.
- `src/domain` is reserved for framework-independent matching, exchange, home, and member rules.
- `services/matching` should only be added if optimization or ranking experiments justify a separate Python service.

The current `/api/homes` route returns an empty collection until home creation
is implemented. Replace its data module with a repository backed by
PostgreSQL/PostGIS while keeping the route contract stable for frontend
consumers.

## Interactive home tours

The initial tour prototype separates framework-independent graph types and
edge-cleanup rules in `src/domain/home-tours` from the interactive editor in
`src/components`. A tour consists of scenes and directed connections. Each
connection stores a destination, an accessible label, and percentage-based
coordinates so hotspots remain aligned as an image resizes.

`supabase/migrations/20260718180000_create_interactive_home_tours.sql` defines
the intended persistence model: one tour per existing `homes.id`, ordered
scenes with private Storage paths, directed connections constrained to scenes
in the same tour, owner-based RLS, and published-tour read policies. The
`home-tour-images` bucket remains private and accepts only constrained image
types and sizes.

The current UI still uses browser-session object URLs and must not be presented
as a saved listing workflow. Database actions should be connected only after
the Supabase authentication/client work is merged, so every write carries the
member session and is checked against `homes.owner_member_id`.
