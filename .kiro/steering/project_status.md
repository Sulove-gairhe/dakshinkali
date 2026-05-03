---
inclusion: auto
---

# Project Status & Context

## Current State (May 3, 2026)

### Completed Backend Modules

#### Product Module
- Database schema, repository, service, admin/public controllers, routes, Swagger docs, Supabase storage support, and tests.

#### Auth Foundation
- Supabase JWT verification middleware, optional auth middleware, admin role middleware, profile migration, and auth helper package.
- Supabase Auth still owns login/register/refresh directly; the Express API verifies tokens and roles.

#### Cart Module
- Canonical cart migrations, repositories, service, controller, Express routes, Swagger docs, and tests.
- Supports guest carts via `X-Session-ID`, authenticated carts via bearer token, and guest-to-user merge.

#### Order Module
- `orders`, `order_items`, and `order_status_history` migration.
- Customer create/list/detail/cancel endpoints.
- Admin list/detail/stats/status-update endpoints.
- Creates orders from authenticated carts and snapshots product/price data.
- Includes `create_order_from_cart` RPC for atomic order creation, order item insert, status history insert, and cart item clearing.

#### Profile And Admin Support
- Current profile get/update endpoints.
- Admin dashboard stats endpoint.
- Admin user list and role update endpoints.

#### Web And Admin UI Wiring
- Web page calls product, cart, checkout/order, profile, and order history APIs.
- Admin page calls dashboard stats, order list/status update, user list, and role update APIs.

## Verification

Passed:
- `pnpm test`
- `pnpm --filter @dakshinkali/api type-check`
- `pnpm --filter @dakshinkali/web type-check`
- `pnpm --filter @dakshinkali/admin type-check`
- OpenAPI YAML parse check.

Local caveat:
- Live Supabase storage integration tests are skipped unless storage credentials are present.

## API Endpoint Status

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

## Remaining Priority Work

1. Apply and verify migrations in the target Supabase project.
2. Audit RLS policies for products, carts, orders, order items, order status history, and profiles.
3. Manually test with real admin/customer tokens.
4. Run live storage integration tests with Supabase credentials.

## Architecture

Layer pattern:
```text
Controller
Service
Repository
Database
```

Do not bypass the API from frontend apps. Frontends should call Express endpoints, and the API should own authorization, validation, and database access.
