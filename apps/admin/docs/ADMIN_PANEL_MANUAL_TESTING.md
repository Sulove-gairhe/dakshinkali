# Admin Panel — Manual Testing Checklist

## Prerequisites

1. Apply migration `20260527100000_admin_product_authoring.sql`
2. Ensure `profiles.role = 'admin'` for your test user
3. Run `pnpm install` from repo root
4. Start admin app: `pnpm --filter @dakshinkali/admin dev` (port 3001)
5. Ensure Supabase Storage bucket `product-images` exists (public)

## Auth & isolation

- [ ] Non-admin user is redirected from `/admin` to `/login`
- [ ] Admin user can access `/admin`, `/admin/products`, `/admin/categories`

## Categories

- [ ] List shows seeded categories (Televisions, Refrigerators, …)
- [ ] Create category with auto-slug; duplicate slug shows error
- [ ] Edit category; toggle active/inactive
- [ ] No delete — only deactivate

## Products

- [ ] Product list loads with skeleton, then data
- [ ] Search, category, status, publishing filters work
- [ ] Create Product → redirects to edit with draft row in DB
- [ ] Upload up to 5 images (JPEG/PNG/WebP, max 5MB); reorder; primary badge on order 0
- [ ] Save Draft persists without full storefront validation
- [ ] Publish without required fields → modal with missing fields
- [ ] Publish with slug, brand, short description, warranty, category, price, image → `live` + toast
- [ ] Deactivate and soft-delete show confirmation modals
- [ ] Preview panel (card + JSON) updates on form changes

## Storefront regression

- [ ] `apps/web` storefront pages still load (static `store-products.ts` unchanged)
- [ ] No changes to existing customer cart/wishlist flows in this pass

## Cross-customer (if testing cart from prior work)

- [ ] Customer A cart/wishlist not visible to Customer B after login switch
