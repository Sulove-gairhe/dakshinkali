# Admin Orders — Manual Testing Checklist

## Prerequisites

1. Apply `supabase/migrations/20260527200000_admin_orders_support.sql`
2. Apply `supabase/migrations/20260608120000_order_proofs_storage.sql`
3. Admin user with `profiles.role = 'admin'`
4. `pnpm --filter @dakshinkali/admin dev` on port 3001

## COD approval

- [ ] Create/find order: `payment_method = cash_on_delivery`, `status = pending_admin_approval`
- [ ] Open `/admin/orders/[id]` — standard layout, no proof pane
- [ ] Confirm COD → status `confirmed`, payment stays `pending`
- [ ] Cancel COD → status `cancelled`

## Fonepay / QR payment approval

- [ ] Order with `payment_status = pending_verification`
- [ ] Split view on desktop; tabs on mobile
- [ ] Image proof renders in `<img>` (not PDF as image)
- [ ] PDF proof shows iframe + open link
- [ ] Null proof shows empty state + manual upload
- [ ] Approve → `paid` + `confirmed`, `proof_cleanup_status = pending`
- [ ] Reject → `failed` + `cancelled`, `proof_cleanup_status = pending`
- [ ] `admin_notification_status` unchanged after approve/reject

## Shipping guard

- [ ] Unpaid non-COD order in `processing`
- [ ] Try Update Status → Shipped — blocked with error
- [ ] Kanban drag to Shipped — toast error, card reverts

## Kanban invalid drag

- [ ] Drag `delivered` order — cannot move to cancelled
- [ ] Toast shows invalid transition message

## List & navigation

- [ ] `/admin/orders` pagination (25 per page)
- [ ] Search by order number prefix and customer email
- [ ] Sidebar shows one Awaiting Approval entry
- [ ] Awaiting Approval separates COD and Fonepay / QR payment sections
- [ ] Highlight rows for staff action without exposing raw status values

## Regression

- [ ] Storefront checkout creates COD and QR orders in Awaiting Approval
- [ ] `store-products.ts` unchanged
