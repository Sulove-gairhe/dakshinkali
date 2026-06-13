# Contributing

## Branch Naming

Use short, descriptive branches:

```text
feature/<area>-<description>
fix/<area>-<description>
docs/<description>
chore/<description>
```

Examples:

```text
feature/admin-order-filters
fix/checkout-proof-upload
docs/mobile-app-plan
```

## Run The Monorepo Locally

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm dev
```

Individual apps:

```bash
pnpm --filter @dakshinkali/web dev
pnpm --filter @dakshinkali/admin dev
pnpm --filter @dakshinkali/api dev
```

Default ports:

| App | URL |
| --- | --- |
| Storefront | `http://localhost:3000` |
| Admin | `http://localhost:3001` |
| API | `http://localhost:3002` |
| API docs | `http://localhost:3002/api-docs` |

## Common Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run all workspace dev tasks through Turbo. |
| `pnpm build` | Build all workspaces. |
| `pnpm lint` | Run lint tasks. |
| `pnpm test` | Run Vitest suite. |
| `pnpm test:integration` | Run API product integration tests. |
| `pnpm db:start` | Start local Supabase. |
| `pnpm db:stop` | Stop local Supabase. |
| `pnpm db:reset` | Reset local Supabase database. |
| `pnpm db:migration:new <name>` | Create a new Supabase migration. |
| `pnpm auth:seed` | Seed local/staging auth users. |
| `pnpm auth:create-admin` | Create an admin user through script. |

## Add A Migration

1. Create a migration:

```bash
pnpm db:migration:new short_descriptive_name
```

2. Name migrations with timestamp prefix:

```text
YYYYMMDDHHMMSS_short_descriptive_name.sql
```

3. Prefer idempotent SQL:

```sql
CREATE TABLE IF NOT EXISTS public.example (...);
ALTER TABLE public.example ADD COLUMN IF NOT EXISTS new_column text;
DROP POLICY IF EXISTS "Policy name" ON public.example;
CREATE POLICY "Policy name" ON public.example FOR SELECT USING (true);
```

4. Include RLS for new tables before merging.
5. Include indexes for common filters and foreign keys.
6. Apply locally first with Supabase CLI.
7. For production, review SQL and apply manually through Supabase SQL Editor or controlled migration job. Do not run `supabase db push` blindly.
8. Update [Architecture](ARCHITECTURE.md), [Features](FEATURES.md), and [Deployment](DEPLOYMENT.md) if schema or infrastructure changed.

## Add A Shared Package

1. Create `packages/<name>/package.json`.
2. Use package name `@dakshinkali/<name>`.
3. Add `index.ts` exports.
4. Add `tsconfig.json` consistent with existing packages.
5. Keep the package framework-neutral unless it is intentionally app-specific.
6. Reference it with `workspace:*` in consuming app manifests.
7. Run `pnpm install` to update the lockfile.

## Code Style Notes

- TypeScript is used across apps and packages.
- Next.js app router is used in `apps/web/app` and `apps/admin/app`.
- Admin business operations usually live in `apps/admin/lib/admin/actions/*` as server actions.
- API modules use controller/service/repository separation under `apps/api/src/modules/*`.
- JSON responses use camelCase in API DTOs, while Supabase rows use snake_case.
- Supabase migrations and database rows use snake_case.
- Prefer existing helpers from `@dakshinkali/auth`, `@dakshinkali/database`, and `@dakshinkali/admin-mail`.
- Use RLS and server-side service clients for privileged admin work.
- Keep service role keys server-only.

## Known Pre-Existing Lint/Type Gaps

- `apps/admin/package.json` uses `next lint`, which may need updating for the installed Next.js version.
- API/admin role handling is not fully aligned for `staff` in API controllers.
- API order status validation is not fully aligned with admin/database `pending_admin_approval`.
- Some debug logging exists around checkout notifications and storefront product fetching.
- The payment proof cleanup module is a skeleton stub.

## Test Email Locally

After API env vars are configured:

```bash
curl -H "X-Order-Notify-Secret: dev-order-notify-secret" \
  http://localhost:3002/api/v1/internal/test-notify-email
```

For production/staging, replace the secret with `ORDER_NOTIFY_SECRET`.

Use `ADMIN_EMAIL_PROVIDER=mock` for local console testing. Use `smtp` or `resend` for delivery testing.

## Test FCM Locally

Web FCM needs a secure context. Browser localhost is usually treated as secure, but staging over HTTPS is the most reliable test environment.

Checklist:

- [ ] Configure Firebase web env vars in `apps/admin`.
- [ ] Configure Firebase Admin env vars in `apps/api`.
- [ ] Open admin app in a browser that supports notifications.
- [ ] Grant notification permission.
- [ ] Confirm `admin_fcm_tokens` receives a token after `/api/admin/fcm-token`.
- [ ] Place a test order.
- [ ] Confirm foreground or background notification arrives.

For non-local devices, use HTTPS staging or a tunnel such as ngrok.

## Documentation Rules

- Update docs in the same pull request as schema, route, deployment, or workflow changes.
- Mark uncertain production-only details with `<!-- TODO: verify -->`.
- Keep route lists generated from real code, not planned endpoints.
- Keep mobile-specific assumptions in [Mobile App Plan](MOBILE_APP.md).
