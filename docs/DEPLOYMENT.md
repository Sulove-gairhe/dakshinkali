# Deployment

## Current Setup

| Surface | Deployment evidence | Notes |
| --- | --- | --- |
| Storefront `apps/web` | `apps/web/vercel.json`, Next.js app | Production URL is `https://dakshinkali.shop`. |
| Admin `apps/admin` | `apps/admin/vercel.json`, Next.js app | Production URL is `https://admin.dakshinkali.shop`. |
| API `apps/api` | Express server with `build` -> `dist/server.js` | Deploy as a Node service. Production base URL is not stored in repo. <!-- TODO: verify deployed API URL. --> |
| Root | `vercel.json` install command | Enables Corepack, prepares pnpm `9.15.9`, installs with frozen lockfile. |
| Database | `supabase/migrations/*.sql` | Supabase Postgres, Auth, Storage, Realtime, RLS. |

## Production Environment Checklist

### Storefront `apps/web`

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Must match the project used by the anon key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase key. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Use `https://dakshinkali.shop`. |
| `NEXT_PUBLIC_API_URL` | Yes for notification/cart API use | Point to the deployed `apps/api` service. |
| `NEXT_PUBLIC_ORDER_NOTIFY_SECRET` | Required by current checkout notify flow | Must match API `ORDER_NOTIFY_SECRET`; consider moving this server-side. |

### Admin `apps/admin`

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe key. |
| `SUPABASE_URL` | Recommended | Server-side service client fallback. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; required for admin actions. |
| `NEXT_PUBLIC_WEB_URL` | Yes | `https://dakshinkali.shop`. |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | `https://admin.dakshinkali.shop`. |
| `NEXT_PUBLIC_API_URL` | If API calls are enabled | Deployed API URL. |
| `ADMIN_EMAIL_PROVIDER` | Yes | `smtp`, `resend`, or controlled `mock`. |
| `ADMIN_EMAIL_OTP_SECRET` | Yes | Strong random value. |
| `ADMIN_EMAIL_OTP_RECIPIENT` | Yes | Recipient for admin setup OTP approval. |
| `ADMIN_EMAIL_TO` | Yes for order emails | Recipient for admin order notifications. |
| `RESEND_API_KEY` | If provider is `resend` | Server-only. |
| `ADMIN_EMAIL_FROM` | If email enabled | Sender for Resend/SMTP fallback. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | If provider is `smtp` | Use Gmail App Password or SMTP provider credential, not a normal password. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes for push | Restrict HTTP referrers in Firebase/Google Cloud. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes for push | Firebase web config. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes for push | Firebase project ID. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes for push | Sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes for push | Web app ID. |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Yes for push | Web push VAPID key. |

### API `apps/api`

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | API client initialization. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only. |
| `JWT_SECRET` | Recommended | Defaults to service role key if unset. |
| `PORT` or `API_PORT` | Platform dependent | Default is `3002`. |
| `CORS_ORIGINS` | Yes | Include storefront and admin origins. |
| `RATE_LIMIT_ENABLED` | Optional | Set `false` only for controlled environments. |
| `ORDER_NOTIFY_SECRET` | Yes | Required in production for internal notify/test routes. |
| `FIREBASE_PROJECT_ID` | Yes for push | Firebase Admin SDK project ID. |
| `FIREBASE_CLIENT_EMAIL` | Yes for push | Service account client email. |
| `FIREBASE_PRIVATE_KEY` | Yes for push | Preserve newlines or use escaped `\n`. |
| `ADMIN_EMAIL_PROVIDER` | Yes for order emails | `smtp`, `resend`, or controlled `mock`. |
| `ADMIN_EMAIL_TO` | Yes for order emails | Recipient. |
| `RESEND_API_KEY` | If provider is `resend` | Server-only. |
| `ADMIN_EMAIL_FROM` | If email enabled | Sender. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | If provider is `smtp` | Gmail requires App Password. |

## Supabase Migration Deployment

Do not run `supabase db push` blindly against production. It diffs local state against the remote database and can produce changes that are hard to review in a repo with hand-written migrations, RLS policies, storage policies, and repeated constraint repairs.

Preferred production flow:

1. Open the migration file in `supabase/migrations/`.
2. Read it end to end.
3. Confirm it is idempotent where possible (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, constraint replacement).
4. Apply it in order through Supabase SQL Editor or a controlled CI migration job.
5. Verify tables, constraints, policies, storage buckets, and Realtime publication after each migration.
6. Run app-level smoke tests for affected workflows.

Naming convention:

```text
YYYYMMDDHHMMSS_descriptive_name.sql
```

Examples:

```text
20260607000000_create_coupons.sql
20260608120000_order_proofs_storage.sql
20260611000000_admin_fcm_tokens.sql
```

## Firebase Production Checklist

- [ ] Create one Firebase project for production.
- [ ] Add a web app for `admin.dakshinkali.shop`.
- [ ] Restrict `NEXT_PUBLIC_FIREBASE_API_KEY` HTTP referrers to the admin domain and approved staging domains.
- [ ] Generate and configure `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
- [ ] Add `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` to the API environment.
- [ ] Confirm `apps/admin/public/firebase-messaging-sw.js` is served at `/firebase-messaging-sw.js`.
- [ ] Open the admin app over HTTPS and grant notification permission.
- [ ] Confirm `/api/admin/fcm-token` inserts a row in `admin_fcm_tokens`.
- [ ] Place a test order and confirm push opens `/admin/orders/{id}`.

## SMTP Production Checklist

- [ ] Use a provider account dedicated to transactional/admin mail.
- [ ] For Gmail, create a Gmail App Password; do not use the regular account password.
- [ ] Set `ADMIN_EMAIL_PROVIDER=smtp`.
- [ ] Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.
- [ ] Set `ADMIN_EMAIL_TO` for order notifications.
- [ ] Set `ADMIN_EMAIL_OTP_RECIPIENT` for setup OTP delivery.
- [ ] Test with `GET /api/v1/internal/test-notify-email` and `X-Order-Notify-Secret`.
- [ ] Confirm production logs do not print secrets.

## Pre-Deployment Checklist

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] `pnpm --filter @dakshinkali/admin type-check`
- [ ] `pnpm --filter @dakshinkali/api type-check`
- [ ] Latest Supabase migrations applied.
- [ ] Storage buckets exist: `product-images`, `blog-images`, `order-proofs`.
- [ ] RLS policies verified for customer checkout and admin approval.
- [ ] Firebase service account configured in API.
- [ ] Admin FCM web config configured in admin app.
- [ ] SMTP or Resend configured and test email delivered.
- [ ] `ORDER_NOTIFY_SECRET` matches between caller and API.
- [ ] `CORS_ORIGINS` includes storefront/admin production domains.
- [ ] Remove or restrict debug routes/logs such as `/api/env-check` and storefront Supabase URL logging.
