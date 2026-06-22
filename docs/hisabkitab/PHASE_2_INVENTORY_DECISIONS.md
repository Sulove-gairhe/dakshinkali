# HisabKitab Phase 2 Inventory Decisions

Date: 2026-06-22

Status: Phase 2A audit and decision record only. No inventory implementation, migrations, or database changes have been performed.

## Final Stock Model For Phase 2

Phase 2 uses the safer snapshot-plus-ledger model:

- `products.stock_quantity` remains the current stock snapshot.
- `stock_movements` will be added as the append-only stock ledger.
- `stock_movements` records every stock mutation with before/after quantity, delta, reason, actor, reference, and idempotency key.
- Current stock reads should use `products.stock_quantity`.
- Historical audit reads should use `stock_movements`.

## Deferred Model

`inventory_items` is deferred.

Do not create a full `inventory_items` source of truth in Phase 2 unless a later owner decision explicitly approves it. Phase 2 should avoid introducing a second current-stock authority.

## Migration Safety Decision

Supabase migration ledger drift still exists. Phase 2 must not run:

- `supabase db push`
- migration repair
- automatic remote migration apply

Before Phase 2B migration drafting is finalized, manually inspect production or target Supabase state through SQL Editor.

Required SQL checks:

```sql
SELECT version
FROM supabase_migrations.schema_migrations
ORDER BY version;
```

```sql
SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.products'::regclass
  AND contype = 'c'
ORDER BY conname;
```

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;
```

```sql
SELECT status, COUNT(*)
FROM public.products
GROUP BY status
ORDER BY status;
```

```sql
SELECT status, COUNT(*)
FROM public.orders
GROUP BY status
ORDER BY status;
```

```sql
SELECT proname
FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE nspname = 'public'
  AND proname IN ('is_admin', 'is_admin_or_staff', 'is_super_admin')
ORDER BY proname;
```

## Product Status Decision

Local migrations and storefront/admin code support `low_stock`, but the Express product module still has older three-status assumptions.

Phase 2 must treat this as a contract alignment task before stock automation:

- Preserve `low_stock` if production already supports it.
- If production does not support `low_stock`, add it only through a reviewed explicit migration.
- Update API product types, validators, DTO validation, and tests to include `low_stock`.
- Do not introduce additional product statuses in Phase 2.

Known local support for `low_stock`:

- `supabase/migrations/20260527100000_admin_product_authoring.sql`
- `apps/web/lib/db-products.ts`
- `apps/admin/lib/admin/types.ts`
- `apps/admin/lib/admin/actions/products.ts`
- `apps/admin/lib/admin/actions/notifications.ts`
- `apps/admin/lib/admin/notifications/use-low-stock-products.ts`

Known missing or stale `low_stock` support:

- `apps/api/src/modules/products/entities/product.entity.ts`
- `apps/api/src/modules/products/services/product.service.ts`
- `apps/api/src/modules/products/validators/product.validator.ts`
- `apps/api/src/modules/products/controllers/admin-product.controller.ts`
- `apps/api/src/modules/products/dto/product.dto.ts`
- API product tests and property generators using only `active`, `inactive`, `out_of_stock`
- API docs that still describe only the three original statuses

## Checkout Decision

Checkout stays direct Supabase for now during Phase 2A and Phase 2B.

Do not rewrite checkout blindly. Current checkout in `apps/web/components/checkout/checkout-page-content.tsx`:

- Reads the local cart from `CartProvider`.
- Uploads Fonepay proof if needed.
- Inserts directly into `orders`.
- Inserts directly into `order_items`.
- Inserts directly into `order_status_history`.
- Clears Supabase/API cart data where available.
- Does not call `apps/api` order service for normal checkout.
- Does not currently perform stock validation immediately before insert.

Minimum safe future change:

- Add a server-side validation step immediately before order insert.
- Validate product existence, `deleted_at`, `publishing_status`, sellable `status`, and `stock_quantity`.
- Do not deduct stock at checkout in Phase 2.
- Do not replace the checkout architecture until stock validation is stable.

## Cart Decision

The storefront cart in `apps/web/components/cart-provider.tsx` is localStorage-backed and user-keyed:

- `dakshinkali_cart:{userId}`
- `dakshinkali_cart:anon`

It does not call the API when adding items. It does not currently validate stock at add time.

Minimum safe future change:

- Keep localStorage cart behavior.
- Add a lightweight server validation endpoint or server action used by add-to-cart and quantity changes.
- Validate product sellability and requested quantity against `products.stock_quantity`.
- Keep checkout validation as the final authority because stock can change after add-to-cart.

## Order Stock Commit Gate Decision

Admin order transitions are split across admin server actions and API service methods. Stock deduction must not be wired until these paths are normalized around one commit gate.

Recommended stock-commit gate:

- Stock should be committed exactly once when an order transitions from an approval state to `confirmed`.
- Approval states are currently `pending` and `pending_admin_approval`.
- The durable stock commit must be idempotent by order id and product id.
- The safest implementation target is a database RPC that performs order status transition, product row locking, stock deduction, stock movement inserts, and status history in one transaction.
- Admin actions should call this single RPC/service path for COD confirm, QR/Fonepay approve, and any generic transition to `confirmed`.

Paths that must be handled:

- `apps/admin/lib/admin/actions/orders.ts`
  - `approveOrderPayment`: QR/Fonepay approve, sets `payment_status = paid`, `status = confirmed`.
  - `confirmCodOrder`: COD confirm, sets `status = confirmed`.
  - `updateOrderStatus`: generic status transition, can move approval states to `confirmed`.
  - `rejectOrderPayment`: QR/Fonepay reject, sets `payment_status = failed`, `status = cancelled`.
  - `cancelCodOrder`: COD cancel, sets `status = cancelled`.
  - `updateOrderPaymentStatus`: payment-only change, should not commit stock by itself.
- `apps/admin/lib/admin/order-utils.ts`
  - Defines admin status transition rules.
- `apps/api/src/modules/orders/order.service.ts`
  - Has parallel API transition rules and `updateOrderStatus`.
  - Creates API orders with `pending_admin_approval`.
- `apps/api/src/modules/orders/order.repository.ts`
  - Updates status and history outside the admin action path.
  - Uses `create_order_from_cart` RPC for API order creation.

## What Must Not Be Changed Yet

- Do not run `supabase db push`.
- Do not run migration repair.
- Do not apply remote migrations automatically.
- Do not create `inventory_items`.
- Do not rewrite checkout.
- Do not deduct stock in checkout.
- Do not wire stock deduction into admin order actions until the single commit gate exists.
- Do not add suppliers, purchases, payments, reports, accounting, or Quick POS.
- Do not build or modify `admin.dakshinkali.shop/karobar_features`.

## Phase Plan

- Phase 2A: Audit and decision record only.
- Phase 2B: Draft DB/RPC migration only.
- Phase 2C: Apply DB and internal stock core.
- Phase 2D: HisabKitab inventory UI.
- Phase 2E: Storefront validation.
- Phase 2F: Admin order integration.

## Phase 2B Entry Criteria

Phase 2B can start only as draft migration work after:

- Production migration ledger has been manually compared to local migrations.
- Current `products` constraints have been inspected.
- Current `orders` constraints have been inspected.
- Existing RLS helper functions have been verified in production.
- The migration draft is designed to be explicit, reviewed, and non-destructive.

Phase 2B must stop at a draft DB/RPC migration. It must not apply the migration automatically.
