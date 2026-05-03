# Backend Implementation Roadmap

**Updated:** 2026-05-03

## Completed Locally

- Product module: schema, repository, service, controllers, routes, image storage, Swagger docs, and tests.
- Auth foundation: Supabase JWT verifier, optional/required auth middleware, admin role middleware, profile migration, and auth helper package.
- Cart module: canonical migrations, repositories, service, controller, Express routes, Swagger docs, and tests.
- Order module: schema, customer APIs, admin APIs, status transitions, stats, order tests, and atomic cart-to-order RPC.
- Profile/admin support: current profile get/update, admin dashboard stats, admin user list, and admin role update.
- Web storefront: products, cart, checkout, profile, and order API wiring.
- Admin app: dashboard, orders, status update, users, and role update API wiring.

## Verification

Passed:
- `pnpm test`
- `pnpm --filter @dakshinkali/api type-check`
- `pnpm --filter @dakshinkali/web type-check`
- `pnpm --filter @dakshinkali/admin type-check`
- OpenAPI YAML parse check for `apps/api/docs/openapi.yaml`

Skipped locally by design:
- Live Supabase storage integration tests when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are absent.

## Remaining Work

This is no longer missing local implementation. Remaining work requires the target Supabase environment:
- Apply all migrations.
- Verify RLS policies and role claims.
- Exercise real customer/admin token flows.
- Run live storage integration tests.
- Confirm web/admin pages against the live API and real tokens.
