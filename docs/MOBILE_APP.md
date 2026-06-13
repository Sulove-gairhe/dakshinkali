# Mobile App

## Overview

The mobile app should start as a customer-facing commerce app:

- Browse live products, categories, curated sections, search, and product details.
- Manage cart, apply coupons, choose COD or Fonepay QR, upload proof, and place orders.
- Track order history and status changes.
- Manage account/profile and saved addresses.

An admin companion app is optional but recommended after the customer app is stable:

- Receive new order alerts.
- Approve COD orders.
- Verify/reject QR payment proofs.
- View order details and low-stock alerts.

## Recommended Stack

Use **React Native with Expo**.

Reasons for this codebase:

- Existing apps are TypeScript and React/Next.js.
- `@supabase/supabase-js` works in React Native.
- Existing shared packages can be reused or adapted from the pnpm workspace.
- Expo gives fast iteration, camera/image picker support, deep linking, OTA updates, and straightforward Android/iOS builds.
- Firebase Cloud Messaging has React Native support through `@react-native-firebase/app` and `@react-native-firebase/messaging` when the app moves beyond Expo Go.

Flutter is viable if the team strongly prefers Dart, but it would not share as much code with the current monorepo.

## What Already Works For Mobile

| Existing asset | Mobile reuse |
| --- | --- |
| Supabase project | Use the same `SUPABASE_URL` and anon key. |
| Supabase Auth | Works with `supabase-js` in React Native for login, signup, sessions, and profile fetches. |
| Database schema | Products, categories, carts, orders, coupons, wishlists, profiles, and RLS already exist. |
| Storage URLs | Product/blog/order proof buckets are public, so product images and QR proof URLs can render in mobile. |
| FCM project | Same Firebase project can issue Android/iOS mobile tokens. |
| Admin push sender | `sendAdminOrderPush` sends to all rows in `admin_fcm_tokens`; mobile admin tokens can work once saved in the same table. |
| Coupon logic | `@dakshinkali/database` contains reusable coupon calculation and validation helpers. |
| Order status model | Admin order statuses and payment statuses are already defined. |

## What Needs To Be Built

### Customer App Screens

| Screen | Purpose |
| --- | --- |
| Home | Curated sections, featured categories, banners, store highlights. |
| Category Browse | Products grouped by category with basic sorting/filtering. |
| Product Detail | Image gallery, price, description, specs, similar products, add to cart. |
| Search | Product search with recent queries and filters. |
| Cart | Quantity changes, remove items, subtotal, coupon entry. |
| Checkout | Address, COD/Fonepay selection, order review. |
| Fonepay QR Payment | Show QR, launch image picker/camera, validate proof file. |
| Order Confirmation | Order number, total, next steps. |
| Order History | List current and past customer orders. |
| Order Detail + Tracking | Items, status timeline, payment status, delivery details. |
| Account/Profile | Name, email, phone, sign out. |
| Login/Register | Supabase Auth email/password flows. |
| Address Management | Saved delivery addresses for checkout reuse. |

### Admin Companion App Screens

| Screen | Purpose |
| --- | --- |
| New Order Alert | Push-driven landing screen for fresh orders. |
| Approval Queue | COD and QR verification queues. |
| Quick Approve/Reject | Confirm COD, verify payment, reject proof, cancel order. |
| Order Detail View | Customer info, items, totals, proof preview, status history. |
| Low Stock Alert | Products with `status = low_stock`. |

## FCM Setup For Mobile

1. Add an Android app in Firebase Console. Choose the package name before implementation, for example `com.dakshinkali.electronics`.
2. Add an iOS app in Firebase Console. Choose the bundle ID before implementation, for example `com.dakshinkali.electronics`.
3. Download `google-services.json` for Android and `GoogleService-Info.plist` for iOS.
4. Install native Firebase packages:

```bash
pnpm --filter @dakshinkali/mobile add @react-native-firebase/app @react-native-firebase/messaging
```

5. Configure Expo dev builds or a bare React Native build, because FCM is not available inside Expo Go.
6. Configure APNs for iOS in Firebase. This requires an Apple Developer account.
7. Request notification permission in-app and call `messaging().getToken()`.
8. Save admin companion tokens into `admin_fcm_tokens` with `admin_user_id` and `token`.
9. The existing API `sendAdminOrderPush()` sends to all rows in `admin_fcm_tokens`, so mobile admin tokens will receive the same new-order push once registered with the same Firebase project.

## Supabase Realtime On Mobile

- `supabase-js` supports Realtime over WebSockets in React Native.
- Use the same pattern as the admin notification bell: subscribe to `postgres_changes`.
- Customer order tracking should subscribe to `orders` updates filtered by the current user/order where possible.
- Admin companion alerts can subscribe to `orders` inserts/updates and `products` changes for low stock.

Example shape:

```ts
const channel = supabase
  .channel("mobile-order-status")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "orders" },
    (payload) => {
      // Update local order status cache.
    },
  )
  .subscribe();
```

## Payment Integration On Mobile

### COD

COD is straightforward:

- Use the same checkout fields as web.
- Insert an order with `payment_method = cash_on_delivery`.
- Set `payment_status = pending`.
- Set `status = pending_admin_approval`.

### Fonepay QR

Recommended first version:

- Display the existing static merchant QR assets or fetch QR metadata from a backend config endpoint.
- Customer pays through a banking app or wallet.
- Customer uploads screenshot or PDF proof from camera/gallery.
- Upload proof to `order-proofs/orders/{userId}/...`.
- Insert proof metadata into `orders`.
- Set `payment_method = fonepay_qr`, `payment_status = pending_verification`, and `status = pending_admin_approval`.

Use `expo-image-picker` for Expo or `react-native-image-picker` for bare React Native. Confirm Fonepay Nepal production SDK/API requirements before replacing the static QR flow. <!-- TODO: verify Fonepay vendor API requirements. -->

## Environment Variables

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Same Supabase project URL used by web/admin. |
| `SUPABASE_ANON_KEY` | Same anon/publishable key used by client apps. |
| `API_URL` | Deployed `apps/api` base URL, for notification and any future server routes. |
| Firebase config files | `google-services.json` and `GoogleService-Info.plist`; do not model these as plain env vars. |

## Step By Step: Start Mobile Development

1. Confirm package name, bundle ID, Firebase project, and app display name.
2. Create the Expo app inside the monorepo:

```bash
pnpm create expo apps/mobile --template blank-typescript
```

3. Add `apps/mobile` to `pnpm-workspace.yaml` if the existing `apps/*` glob is not enough for the generated manifest.
4. Rename the app package to `@dakshinkali/mobile`.
5. Install Supabase and navigation dependencies:

```bash
pnpm --filter @dakshinkali/mobile add @supabase/supabase-js @react-navigation/native @react-navigation/native-stack react-native-url-polyfill
```

6. Create a mobile Supabase client using `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
7. Configure Firebase only after the first customer catalog flow works.
8. First screen to build: product list -> product detail -> add to cart.
9. Reuse types and pure helpers from `packages/database` where possible. If React/Next-specific code blocks reuse, extract mobile-safe pure functions into a new shared package.
10. Add mobile-specific storage upload utilities for proof files.

## Known Gotchas

- Supabase Realtime requires WebSocket support, which works in React Native but should be tested on real devices.
- iOS FCM push requires an Apple Developer account, APNs configuration, and a physical device for reliable testing.
- Android notification permissions differ across API levels.
- Expo Go will not support native Firebase Messaging; use a development build.
- Fonepay QR integration may require vendor docs or an SDK from Fonepay Nepal before production automation.
- Deep linking for order notifications needs Android intent filters and iOS associated domains or URL schemes.
- Do not expose service role keys in the mobile app.
- The current checkout notification trigger uses a shared secret from client-side web code; mobile should eventually call a server-side checkout/notify endpoint instead.
