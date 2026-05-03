# Token-Efficient Status

**Updated:** 2026-05-03

Completed locally:
- Backend: products, auth middleware, cart, orders, profile, admin dashboard stats, admin users, admin order management.
- Admin auth roles: `PATCH /api/v1/admin/users/:userId/role` updates Supabase Auth `app_metadata.role` through the backend-only Supabase Admin API, preserving existing app metadata before writing.
- Dev tooling: `node scripts/make-admin.js admin@example.com` promotes a Supabase Auth user by email using `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Order hardening: `create_order_from_cart` Supabase RPC added for atomic order creation, order items, status history, and cart item clearing.
- Tests: order service tests added for atomic creation, fallback creation, validation, cancellation, and invalid transitions.
- Frontend: web home now calls products/cart/profile/orders/checkout APIs; admin home now calls dashboard/orders/users APIs.
- Docs: Swagger includes the implemented API surface, Supabase Auth bearer-token instructions, and the admin role update endpoint examples.
- Product search: whitespace-only search terms are now ignored before repository filtering.

Verification passed:
- `pnpm test`
- `pnpm --filter @dakshinkali/api type-check`
- `pnpm --filter @dakshinkali/web type-check`
- `pnpm --filter @dakshinkali/admin type-check`
- OpenAPI YAML parse check.

Only environment-bound work remains:
1. Apply migrations to the real Supabase project.
2. Run `node scripts/make-admin.js admin@example.com` with real Supabase credentials to set `raw_app_meta_data.role = "admin"`.
3. Log in again with Supabase Auth so the admin user receives a fresh `session.access_token`.
4. Verify Swagger Authorize with `Bearer <fresh_token>`, `GET /api/v1/profile`, and protected admin routes.
5. Verify RLS and role claims with real admin/customer tokens.
6. Run live storage integration tests with Supabase credentials present.

Main risk:
- No known missing local implementation. Remaining risk is live Supabase configuration and credentials.
