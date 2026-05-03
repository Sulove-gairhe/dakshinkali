# Next Backend Decision

**Updated:** 2026-05-03  
**Purpose:** Token-efficient handoff for the next agent or developer.

## Current State

Implemented locally:
- Product, auth middleware, cart, order, profile, admin dashboard, admin users, and admin order APIs.
- Atomic order creation RPC in `supabase/migrations/20260503120000_create_orders_tables.sql`.
- Web storefront API client for products, cart, checkout, profile, and orders.
- Admin API client for dashboard stats, orders, order status updates, users, and role updates.

Verified:
- `pnpm test`
- `pnpm --filter @dakshinkali/api type-check`
- `pnpm --filter @dakshinkali/web type-check`
- `pnpm --filter @dakshinkali/admin type-check`
- OpenAPI YAML parse check.

## Remaining Work

Only live-environment verification remains:
1. Apply migrations to the target Supabase project.
2. Verify RLS policies for products, carts, orders, order items, order status history, and profiles.
3. Test with real customer and admin Supabase access tokens.
4. Run the skipped live storage integration suite with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Practical Next Step

Start API, web, and admin locally, set `NEXT_PUBLIC_API_URL=http://localhost:3002` for web/admin if needed, sign in through Supabase to get customer/admin tokens, then exercise the token fields in the web/admin pages.
