# Features

## Completed

- [x] Product catalog with categories, JSONB images, public storage URLs, soft delete, status, low-stock status, and `draft`/`live` publishing state.
- [x] Customer storefront with homepage sections, product detail pages, categories, brands, search page, cart, checkout, account, blogs, and wishlist route.
- [x] Cart support for authenticated users and guest sessions through `carts` and `cart_items`.
- [x] COD checkout with admin approval before fulfillment.
- [x] Fonepay QR checkout with QR display, required proof upload, and admin payment verification.
- [x] Order management pages: all orders, awaiting approval, order detail, and drag/drop fulfillment board.
- [x] Admin password login for existing admin/staff accounts.
- [x] Admin setup OTP email flow for granted or requested staff/admin setup.
- [x] Admin order email notifications through `@dakshinkali/admin-mail`, with mock, Resend, and raw Node.js `net`/`tls` SMTP support.
- [x] Firebase Cloud Messaging web push notifications for new admin orders.
- [x] Admin notification bell with Supabase Realtime subscriptions for orders and low-stock products.
- [x] Notification bell stores order notification/read state in localStorage with 48-hour retention.
- [x] Bell order cards display first product name plus remaining item count when item details are available.
- [x] Supabase Realtime publication includes `orders` and `products`.
- [x] Order proof upload to Supabase Storage bucket `order-proofs`.
- [x] Coupon/discount system with fixed/percentage discounts, validity windows, applicability rules, minimum order amount, usage limits, and order discount persistence.
- [x] Admin FCM token registration and token cleanup for invalid Firebase tokens.
- [x] RLS policies on customer, admin, catalog, order, coupon, wishlist, blog, storefront, OTP, grant, and FCM-token tables.
- [x] Shared `@dakshinkali/auth` package for Supabase clients, auth provider, hooks, and helpers.
- [x] Shared `@dakshinkali/database` package for Supabase clients, storage helpers, and coupon logic.
- [x] Shared `@dakshinkali/admin-mail` package for order email and SMTP delivery.
- [x] Swagger UI mounted at `/api-docs` in `apps/api`.

## In Progress / Known Issues

- [ ] FCM web push requires HTTPS or a supported secure context. Localhost is allowed by browsers, but real-device/staging testing should use HTTPS.
- [ ] Checkout uses `NEXT_PUBLIC_ORDER_NOTIFY_SECRET` to call the internal notify route from the browser. Verify whether this is acceptable for production; otherwise move notification triggering server-side.
- [ ] `ORDER_NOTIFY_SECRET` must match between storefront/admin deployment settings and `apps/api`, or order notifications return 401.
- [ ] API order status validation only accepts `pending`, `confirmed`, `processing`, `shipped`, `delivered`, and `cancelled`; database/admin code also use `pending_admin_approval`. Align before relying on API status updates for approval workflows.
- [ ] Profile/admin role API controllers only accept `customer` and `admin`, while migrations and admin auth support `staff`. Align before using the API for staff role management.
- [ ] Payment proof cleanup is a skeleton stub and does not delete expired files yet.
- [ ] `apps/web/app/api/storefront-products/route.ts` logs the Supabase URL for debugging. Remove this before production logging review.
- [ ] `products.model_name` was requested as a known bug, but no active source reference was found. <!-- TODO: verify against production logs or older branch before documenting as current. -->
- [ ] Multiple GoTrueClient instance warning was requested as a known issue, but no source reference was found. <!-- TODO: reproduce in admin runtime before documenting as current. -->

## Remaining / Not Yet Built

- [ ] Mobile app; see [Mobile App Plan](MOBILE_APP.md).
- [ ] Customer email notifications for order confirmation and status updates.
- [ ] Admin analytics dashboard beyond existing order/product/user summary counts.
- [ ] Inventory quantity tracking and automatic low-stock thresholds. Current low-stock handling is status-based.
- [ ] Product reviews and ratings.
- [ ] Search and filtering improvements, including Postgres full-text search for admin order search.
- [ ] SMS notifications.
- [ ] Webhook retry mechanism for failed notifications.
- [ ] Full admin role and permission management for multiple staff/admin users.
- [ ] Automated end-to-end test suite for checkout, approval, push, and email flows.
