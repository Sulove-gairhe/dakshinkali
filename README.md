# Dakshinkali Electronics Center

[![Storefront](https://img.shields.io/badge/storefront-dakshinkali.shop-0f766e)](https://dakshinkali.shop)
[![Admin](https://img.shields.io/badge/admin-admin.dakshinkali.shop-2563eb)](https://admin.dakshinkali.shop)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-f69220)](https://pnpm.io/workspaces)

Electronics e-commerce platform for Nepal, priced in NPR, with a customer storefront, admin panel, Express API, Supabase database/storage/auth, Fonepay QR proof upload, COD approval, SMTP email alerts, and Firebase Cloud Messaging push notifications for admins.

## Live URLs

| Surface | URL |
| --- | --- |
| Storefront | <https://dakshinkali.shop> |
| Admin panel | <https://admin.dakshinkali.shop> |

## Monorepo Structure

```text
dakshinkali/
|-- apps/
|   |-- web/                 # Customer storefront, cart, checkout, account, blogs
|   |-- admin/               # Admin dashboard, products, orders, coupons, staff, FCM
|   `-- api/                 # Express API, Swagger UI, internal order notifications
|-- packages/
|   |-- auth/                # Shared Supabase auth clients, provider, hooks, helpers
|   |-- database/            # Supabase client config, storage helpers, coupon logic
|   `-- admin-mail/          # SMTP/Resend admin order and OTP email helpers
|-- supabase/
|   `-- migrations/          # Database schema, RLS, storage buckets, realtime setup
|-- scripts/                 # Auth, migration, database verification helpers
|-- docs/                    # Project documentation suite
|-- pnpm-workspace.yaml      # apps/* and packages/* workspace definition
`-- package.json             # Root Turbo/pnpm scripts
```

## Tech Stack

| Area | Storefront `apps/web` | Admin `apps/admin` | API `apps/api` |
| --- | --- | --- | --- |
| Framework | Next.js 16, React 19, TypeScript | Next.js 16, React, TypeScript | Express 4, TypeScript |
| Styling/UI | Tailwind CSS 4, Radix, lucide-react, framer-motion | Tailwind CSS 3, lucide-react, TanStack Query, dnd | JSON REST, Swagger UI |
| Database | Supabase Postgres through `@supabase/ssr` | Supabase Postgres through SSR and service-role server actions | Supabase service client |
| Auth | Supabase Auth customer login/signup | Supabase Auth plus admin/staff role checks and setup OTP | Bearer JWT middleware, admin role middleware |
| Storage | Supabase Storage `order-proofs` for Fonepay proof uploads | Supabase Storage `product-images`, `blog-images`, `order-proofs` | Supabase Storage helpers for product images |
| Email | None implemented for customers yet | Admin setup OTP via mock, Resend, or SMTP | Admin order email through `@dakshinkali/admin-mail` |
| Push | None | Firebase Web FCM token registration and foreground/background push | Firebase Admin SDK multicast to `admin_fcm_tokens` |
| Payments | COD and Fonepay QR proof upload | COD approval and QR proof verification | Payment status fields exposed in order API |
| Deployment | Vercel app | Vercel app | Node service deployable from `dist/server.js` |

## Quick Start

### Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 20.x recommended; package manifests use `@types/node` 20 |
| pnpm | Root `packageManager` pins `pnpm@9.15.9`; app manifests also work with pnpm 10 |
| Supabase CLI | Root dev dependency `supabase@^2.101.0` or a globally installed CLI |

### Install

```bash
git clone <repo-url>
cd dakshinkali
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
```

### Environment Variables

Copy `.env.example` to the environment files each app expects. Never commit real secrets.

#### Storefront `apps/web`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by browser and server code. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon or publishable key for customer-facing access. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional fallback accepted by shared auth helpers. |
| `NEXT_PUBLIC_SITE_URL` | Storefront canonical URL and auth redirect base. |
| `NEXT_PUBLIC_API_URL` | Optional API base URL used for cart cleanup and order notify calls. |
| `NEXT_PUBLIC_ORDER_NOTIFY_SECRET` | Browser-exposed secret used by checkout to call the internal notify route. Verify this deployment choice before production hardening. |

#### Admin `apps/admin`

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon or publishable key. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional fallback accepted by admin clients. |
| `SUPABASE_URL` | Server-side Supabase URL fallback for service client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key for admin actions. |
| `NEXT_PUBLIC_WEB_URL` | Storefront URL used in admin links. |
| `NEXT_PUBLIC_ADMIN_URL` | Admin URL used in redirects and emails. |
| `NEXT_PUBLIC_API_URL` | API URL if admin needs to call the API service. |
| `ADMIN_EMAIL_PROVIDER` | `mock`, `resend`, or `smtp` for setup/order email delivery. |
| `ADMIN_EMAIL_OTP_SECRET` | HMAC secret for admin setup OTP hashes. |
| `ADMIN_EMAIL_OTP_RECIPIENT` | Admin recipient for setup OTP codes. |
| `ADMIN_EMAIL_TO` | Admin recipient for order email notifications. |
| `RESEND_API_KEY` | Resend API key when using the Resend provider. |
| `ADMIN_EMAIL_FROM` | From address for Resend or fallback SMTP sender. |
| `SMTP_HOST` | SMTP server host. |
| `SMTP_PORT` | SMTP port, usually `587` or `465`. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password or Gmail App Password. |
| `SMTP_FROM` | SMTP sender address. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID for FCM. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID. |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web push VAPID key used by `getToken()`. |

#### API `apps/api`

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Supabase anon key for API client initialization. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role key. |
| `JWT_SECRET` | JWT verification secret; defaults to service role key if unset. |
| `PORT` or `API_PORT` | API port, default `3002`. |
| `CORS_ORIGINS` | Comma-separated storefront/admin origins. |
| `RATE_LIMIT_ENABLED` | Set `false` to disable API rate limiting. |
| `ORDER_NOTIFY_SECRET` | Secret required by `X-Order-Notify-Secret` on internal notify routes. |
| `FIREBASE_PROJECT_ID` | Firebase Admin SDK project ID. |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email. |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key, with escaped newlines allowed. |
| `ADMIN_EMAIL_PROVIDER` | `mock`, `resend`, or `smtp` for order email delivery. |
| `ADMIN_EMAIL_TO` | Order notification recipient. |
| `RESEND_API_KEY` | Resend API key if using Resend. |
| `ADMIN_EMAIL_FROM` | Email sender for Resend/SMTP fallback. |
| `SMTP_HOST` | SMTP host. |
| `SMTP_PORT` | SMTP port. |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASS` | SMTP password. |
| `SMTP_FROM` | SMTP sender. |

### Development Servers

Run all workspace dev tasks through Turbo:

```bash
pnpm dev
```

Run individual apps:

```bash
pnpm --filter @dakshinkali/web dev
pnpm --filter @dakshinkali/admin dev
pnpm --filter @dakshinkali/api dev
```

Default local URLs:

| App | URL |
| --- | --- |
| Storefront | <http://localhost:3000> |
| Admin | <http://localhost:3001> |
| API | <http://localhost:3002> |
| API docs | <http://localhost:3002/api-docs> |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Mobile App Plan](docs/MOBILE_APP.md)
- [API Reference](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Contributing](docs/CONTRIBUTING.md)
