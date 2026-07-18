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
