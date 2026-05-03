# Supabase Auth Implementation Checklist

**Use this checklist to track your implementation progress**

---

## Phase 1: Database Setup

### Database Migration
- [ ] Open Supabase Dashboard SQL Editor
- [ ] Copy contents of `supabase/migrations/20260503000000_create_profiles_table.sql`
- [ ] Execute migration in SQL Editor
- [ ] Verify profiles table exists: `SELECT * FROM public.profiles LIMIT 1;`
- [ ] Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
- [ ] Verify trigger exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`

### Create Admin User
- [ ] Sign up a test user via Supabase Dashboard (Authentication > Users > Add user)
- [ ] Note the user's email address
- [ ] Run SQL: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';`
- [ ] Verify: `SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';`

---

## Phase 2: Install Dependencies

### Backend (API)
- [ ] Run: `pnpm add @supabase/supabase-js jose --filter @dakshinkali/api`
- [ ] Verify in `apps/api/package.json`

### Frontend (Web App)
- [ ] Run: `pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/web`
- [ ] Verify in `apps/web/package.json`

### Frontend (Admin App)
- [ ] Run: `pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/admin`
- [ ] Verify in `apps/admin/package.json`

### Shared Auth Package
- [ ] Run: `pnpm install` (to link workspace packages)
- [ ] Verify `packages/auth` is recognized

---

## Phase 3: Environment Variables

### Verify .env File
- [ ] Open `.env` in project root
- [ ] Verify `SUPABASE_URL` is set
- [ ] Verify `SUPABASE_ANON_KEY` is set
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Verify `CORS_ORIGINS` includes `http://localhost:3000,http://localhost:3001`

### Get Supabase Keys (if missing)
- [ ] Go to Supabase Dashboard > Project Settings > API
- [ ] Copy "Project URL" → `SUPABASE_URL`
- [ ] Copy "anon public" key → `SUPABASE_ANON_KEY`
- [ ] Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Phase 4: Backend Implementation

### Update API App
- [ ] Files already created (middleware files exist)
- [ ] Open `apps/api/src/app.ts`
- [ ] Import: `import { createSupabaseJWTVerifier } from './common/middleware';`
- [ ] Replace `mockJWTVerifier` with:
  ```typescript
  const jwtVerifier = createSupabaseJWTVerifier(
      env.supabaseUrl,
      env.supabaseServiceRoleKey
  );
  ```
- [ ] Update `createProductRoutes` to use `jwtVerifier`
- [ ] Save file

### Test Backend
- [ ] Run: `pnpm --filter @dakshinkali/api run dev`
- [ ] Verify server starts without errors
- [ ] Test unauthenticated request: `curl http://localhost:3002/api/v1/admin/products`
- [ ] Should return 401 Unauthorized

---

## Phase 5: Frontend Implementation (Web App)

### Update package.json
- [ ] Open `apps/web/package.json`
- [ ] Add to dependencies: `"@dakshinkali/auth": "workspace:*"`
- [ ] Run: `pnpm install`

### Update Root Layout
- [ ] Open `apps/web/app/layout.tsx`
- [ ] Import: `import { AuthProvider } from '@dakshinkali/auth';`
- [ ] Wrap children with `<AuthProvider>`
- [ ] Save file

### Create Login Page
- [ ] Create `apps/web/app/login/page.tsx`
- [ ] Copy code from `AUTH_QUICK_REFERENCE.md` (Login Form section)
- [ ] Save file

### Create Profile Page
- [ ] Create `apps/web/app/profile/page.tsx`
- [ ] Copy code from `AUTH_QUICK_REFERENCE.md` (Protected Page section)
- [ ] Save file

### Create API Client
- [ ] Create `apps/web/lib/api-client.ts`
- [ ] Copy code from `AUTH_QUICK_REFERENCE.md` (API Client section)
- [ ] Save file

### Test Web App
- [ ] Run: `pnpm --filter @dakshinkali/web run dev`
- [ ] Open: `http://localhost:3000/login`
- [ ] Try logging in with test user
- [ ] Should redirect to home page on success
- [ ] Navigate to: `http://localhost:3000/profile`
- [ ] Should show user info

---

## Phase 6: Frontend Implementation (Admin App)

### Update package.json
- [ ] Open `apps/admin/package.json`
- [ ] Add to dependencies: `"@dakshinkali/auth": "workspace:*"`
- [ ] Run: `pnpm install`

### Copy Files from Web App
- [ ] Copy `apps/web/app/layout.tsx` → `apps/admin/app/layout.tsx`
- [ ] Copy `apps/web/app/login/` → `apps/admin/app/login/`
- [ ] Copy `apps/web/lib/api-client.ts` → `apps/admin/lib/api-client.ts`

### Create Admin Dashboard
- [ ] Create `apps/admin/app/dashboard/page.tsx`
- [ ] Copy code from `AUTH_IMPLEMENTATION_STEPS.md` (Admin Dashboard section)
- [ ] Save file

### Test Admin App
- [ ] Run: `pnpm --filter @dakshinkali/admin run dev`
- [ ] Open: `http://localhost:3001/login`
- [ ] Log in with admin user
- [ ] Navigate to: `http://localhost:3001/dashboard`
- [ ] Should show admin dashboard with products

---

## Phase 7: Integration Testing

### Test Authentication Flow
- [ ] Sign up new user (if signup page exists)
- [ ] Log in with new user
- [ ] Verify session persists after page reload
- [ ] Log out
- [ ] Verify redirect to login page

### Test Authorization
- [ ] Log in as non-admin user
- [ ] Try accessing admin dashboard
- [ ] Should get 403 Forbidden error
- [ ] Log in as admin user
- [ ] Access admin dashboard
- [ ] Should work successfully

### Test API Integration
- [ ] Open browser DevTools console
- [ ] Get access token:
  ```javascript
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  console.log(data.session.access_token);
  ```
- [ ] Test API with token:
  ```bash
  curl http://localhost:3002/api/v1/admin/products \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
- [ ] Should return products list

### Test Role-Based Access
- [ ] Log in as customer
- [ ] Try to access `/api/v1/admin/products`
- [ ] Should get 403 Forbidden
- [ ] Update user to admin in database
- [ ] Try again
- [ ] Should succeed

---

## Phase 8: Security Verification

### Environment Security
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is not in frontend code
- [ ] Verify no secrets in git history

### Database Security
- [ ] Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
- [ ] Test RLS policies work (try accessing other user's profile)
- [ ] Verify trigger creates profiles automatically

### API Security
- [ ] Verify JWT tokens are verified on backend
- [ ] Verify admin routes require admin role
- [ ] Verify CORS is configured correctly
- [ ] Test rate limiting (if enabled)

### Frontend Security
- [ ] Verify tokens sent via Authorization header (not query params)
- [ ] Verify protected routes redirect to login
- [ ] Verify session cookies are httpOnly
- [ ] Test logout clears session

---

## Phase 9: Production Preparation

### Documentation Review
- [ ] Read `SUPABASE_AUTH_INTEGRATION.md`
- [ ] Read `AUTH_IMPLEMENTATION_STEPS.md`
- [ ] Bookmark `AUTH_QUICK_REFERENCE.md` for future reference

### Production Environment
- [ ] Create production Supabase project
- [ ] Apply migration to production database
- [ ] Update production environment variables
- [ ] Configure production CORS origins
- [ ] Enable email confirmation (optional)
- [ ] Configure password reset flow
- [ ] Set up monitoring and logging

### Deployment
- [ ] Deploy API to production
- [ ] Deploy web app to production
- [ ] Deploy admin app to production
- [ ] Test production authentication flow
- [ ] Verify production API authentication
- [ ] Monitor for errors

---

## Phase 10: Optional Enhancements

### Email Confirmation
- [ ] Enable in Supabase Dashboard > Authentication > Settings
- [ ] Customize email templates
- [ ] Test confirmation flow

### Password Reset
- [ ] Create password reset page
- [ ] Test reset flow
- [ ] Customize reset email template

### OAuth Providers
- [ ] Enable Google OAuth in Supabase Dashboard
- [ ] Enable GitHub OAuth in Supabase Dashboard
- [ ] Add OAuth buttons to login page
- [ ] Test OAuth flow

### User Management
- [ ] Create admin user management UI
- [ ] Add ability to change user roles
- [ ] Add ability to disable users
- [ ] Add user activity logs

### Profile Management
- [ ] Create profile edit page
- [ ] Add avatar upload
- [ ] Add profile fields (phone, address, etc.)
- [ ] Test profile updates

---

## Troubleshooting Checklist

### If Login Fails
- [ ] Check Supabase Dashboard > Authentication > Users (user exists?)
- [ ] Check browser console for errors
- [ ] Verify environment variables are loaded
- [ ] Check network tab for API errors

### If JWT Verification Fails
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- [ ] Check token expiration
- [ ] Verify JWT secret matches
- [ ] Check API logs for errors

### If CORS Errors Occur
- [ ] Verify `CORS_ORIGINS` includes frontend URLs
- [ ] Restart API server after env changes
- [ ] Check browser console for exact error
- [ ] Verify API is running on correct port

### If Profile Not Created
- [ ] Check trigger exists in database
- [ ] Manually create profile with SQL
- [ ] Check Supabase logs for errors
- [ ] Verify user exists in auth.users

### If 403 Forbidden on Admin Routes
- [ ] Check user role in database
- [ ] Update role to 'admin' if needed
- [ ] Verify role middleware is applied
- [ ] Check API logs for authorization errors

---

## Success Criteria

✅ **Authentication Working**
- Users can sign up
- Users can log in
- Users can log out
- Sessions persist across reloads

✅ **Authorization Working**
- Admin routes require admin role
- Non-admin users get 403 on admin routes
- Customer routes work for customers
- Protected routes redirect to login

✅ **Integration Working**
- Frontend can call API with auth
- JWT tokens are verified on backend
- Roles are enforced correctly
- CORS is configured properly

✅ **Security Implemented**
- RLS enabled on database
- JWT verification on backend
- No secrets in frontend code
- Secure session management

✅ **Production Ready**
- Documentation complete
- Tests passing
- Error handling implemented
- Monitoring configured

---

## Completion

Once all checkboxes are checked, your Supabase Auth integration is complete! 🎉

**Next Steps:**
1. Monitor authentication logs
2. Gather user feedback
3. Implement optional enhancements
4. Keep dependencies updated
5. Review security regularly

---

**Need Help?**
- Review `AUTH_IMPLEMENTATION_STEPS.md` for detailed instructions
- Check `AUTH_QUICK_REFERENCE.md` for code examples
- Consult `SUPABASE_AUTH_SUMMARY.md` for architecture overview
