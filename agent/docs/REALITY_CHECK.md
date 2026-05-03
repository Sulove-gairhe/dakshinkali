# Reality Check

**Updated:** 2026-05-03

## What Exists Now

Implemented and wired:
- Product public/admin APIs.
- Supabase-authenticated middleware and admin role checks.
- Cart guest/auth APIs with merge support.
- Customer order APIs: create from cart, list, detail, cancel.
- Admin order APIs: list, detail, stats, status update.
- Profile APIs: get/update current profile.
- Admin support APIs: dashboard stats, user list, role update.
- Swagger/OpenAPI docs for the above backend surface.
- Atomic order creation RPC for order, order items, status history, and cart item clearing.
- Web storefront API wiring for products, cart, checkout/orders, profile, and order history.
- Admin API wiring for dashboard, orders, order status updates, users, and role updates.

## Current API Surface

Public/customer:
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PUT /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/items/:id`
- `DELETE /api/v1/cart`
- `POST /api/v1/cart/merge`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `PUT /api/v1/orders/:id/cancel`
- `GET /api/v1/profile`
- `PUT /api/v1/profile`

Admin:
- Product CRUD under `/api/v1/admin/products`
- `GET /api/v1/admin/orders/stats`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PUT /api/v1/admin/orders/:id/status`
- `GET /api/v1/admin/dashboard/stats`
- `GET /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id/role`

## What Still Needs Work

- Live Supabase migration/RLS verification.
- Manual real-token testing for admin and customer flows.
- Payment gateway integration beyond the initial cash-on-delivery-ready fields.

## Verification Status

Passed:
- `pnpm test`
- `pnpm --filter @dakshinkali/api type-check`
- `pnpm --filter @dakshinkali/web type-check`
- `pnpm --filter @dakshinkali/admin type-check`
- OpenAPI YAML parse check.

Skipped locally:
- Live Supabase storage integration tests when storage credentials are absent.
