# Admin Orders — Manual Testing Checklist

## Prerequisites

1. Apply `supabase/migrations/20260527200000_admin_orders_support.sql`
2. Ensure Storage bucket `order-proofs` exists (public read optional)
3. Admin user with `profiles.role = 'admin'`
4. `pnpm --filter @dakshinkali/admin dev` on port 3001

## COD approval

- [ ] Create/find order: `payment_method = cash_on_delivery`, `status = pending_admin_approval`
- [ ] Open `/admin/orders/[id]` — standard layout, no proof pane
- [ ] Confirm COD → status `confirmed`, payment stays `pending`
- [ ] Cancel COD → status `cancelled`

## Proof verification (Fonepay / eSewa / Khalti / bank transfer)

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
- [ ] Sidebar badges for Awaiting Review / Awaiting Approval
- [ ] Highlight rows for `pending_verification` and `pending_admin_approval`

## Regression

- [ ] Storefront checkout unchanged
- [ ] `store-products.ts` unchanged
