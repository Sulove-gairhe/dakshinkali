# Supabase Auth - Next Steps

**✅ Phase 1 Complete: Backend Auth Integration**

---

## What's Been Done

### ✅ Dependencies Installed
```bash
✓ @supabase/ssr installed in web and admin apps
✓ @supabase/supabase-js installed in all apps
✓ jose installed in API app
✓ All workspace packages linked
```

### ✅ Backend Updated
- **Express adapters updated**: `apps/api/src/common/middleware/express-adapters.ts`
  - Now uses `createSupabaseJWTVerifier` instead of `mockJWTVerifier`
  - Singleton pattern for verifier instance
  - Production-ready JWT verification

### ✅ Files Created
- ✅ Database migration: `supabase/migrations/20260503000000_create_profiles_table.sql`
- ✅ Supabase auth middleware: `apps/api/src/common/middleware/supabase-auth.middleware.ts`
- ✅ Role middleware: `apps/api/src/common/middleware/role.middleware.ts`
- ✅ Auth package: `packages/auth/` (complete with all utilities)
- ✅ Documentation: 5 comprehensive guides

---

## Next Steps (In Order)

### 🚀 Quick Start (CLI Method - Recommended)

**Use the Supabase CLI for automated setup:**

```bash
# 1. Apply migration (2 minutes)
pnpm run auth:migrate

# 2. Create admin user (1 minute)
pnpm run auth:create-admin admin@example.com SecurePassword123!

# 3. Test authentication (1 minute)
# Start API first: pnpm --filter @dakshinkali/api run dev
# Then in another terminal:
pnpm run auth:test admin@example.com SecurePassword123!
```

**That's it!** Your backend auth is fully configured. 🎉

**Detailed CLI guide**: See `agent/docs/AUTH_CLI_GUIDE.md`

---

### 📋 Alternative: Manual Dashboard Method

If you prefer using the Supabase Dashboard instead of CLI:

### Step 1: Apply Database Migration ⏳

**Action Required**: Run the SQL migration in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the entire contents of `supabase/migrations/20260503000000_create_profiles_table.sql`
5. Paste into SQL Editor
6. Click **Run**

**Verify Migration**:
```sql
-- Run these queries to verify:

-- 1. Check profiles table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 3. Check trigger exists
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

---

### Step 2: Create Admin User ⏳

**Action Required**: Create a test admin user

**Option A: Via Supabase Dashboard**
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Enter email and password
4. Click **Create user**
5. After creation, run this SQL:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

**Option B: Via SQL (if user already exists)**
```sql
-- Update existing user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, role FROM public.profiles 
WHERE email = 'your-email@example.com';
```

---

### Step 3: Test Backend Auth ⏳

**Action Required**: Test that API authentication works

1. **Start the API server**:
   ```bash
   pnpm --filter @dakshinkali/api run dev
   ```

2. **Test unauthenticated request** (should fail):
   ```bash
   curl http://localhost:3002/api/v1/admin/products
   ```
   
   **Expected response**:
   ```json
   {
     "error": "Authentication required",
     "statusCode": 401
   }
   ```

3. **Get a test token**:
   - Go to Supabase Dashboard > Authentication > Users
   - Click on your admin user
   - Copy the **Access Token** (or use the method below)

4. **Test authenticated request**:
   ```bash
   curl http://localhost:3002/api/v1/admin/products \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
   ```
   
   **Expected**: Should return products list (or empty array)

---

### Step 4: Frontend Setup (Web App) ⏳

**Action Required**: Add auth to the web storefront

#### 4.1: Update package.json

Edit `apps/web/package.json`:
```json
{
  "dependencies": {
    "@dakshinkali/auth": "workspace:*",
    "@dakshinkali/database": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

Run:
```bash
pnpm install
```

#### 4.2: Update Root Layout

Edit `apps/web/app/layout.tsx`:
```typescript
import { AuthProvider } from '@dakshinkali/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dakshinkali Electronics',
  description: 'Electronics store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 4.3: Create Login Page

Create `apps/web/app/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@dakshinkali/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

#### 4.4: Test Web App

```bash
# Start web app
pnpm --filter @dakshinkali/web run dev

# Open browser
# Go to: http://localhost:3000/login
# Try logging in with your admin user
```

---

### Step 5: Frontend Setup (Admin App) ⏳

**Action Required**: Add auth to the admin dashboard

#### 5.1: Update package.json

Edit `apps/admin/package.json`:
```json
{
  "dependencies": {
    "@dakshinkali/auth": "workspace:*",
    "@dakshinkali/database": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

Run:
```bash
pnpm install
```

#### 5.2: Copy Auth Setup

```bash
# Copy layout from web app
cp apps/web/app/layout.tsx apps/admin/app/layout.tsx

# Copy login page
mkdir -p apps/admin/app/login
cp apps/web/app/login/page.tsx apps/admin/app/login/page.tsx
```

#### 5.3: Test Admin App

```bash
# Start admin app
pnpm --filter @dakshinkali/admin run dev

# Open browser
# Go to: http://localhost:3001/login
# Log in with admin user
```

---

## Testing Checklist

Once all steps are complete, verify:

### Backend Tests
- [ ] API starts without errors
- [ ] Unauthenticated requests return 401
- [ ] Authenticated requests with valid token succeed
- [ ] Non-admin users get 403 on admin routes
- [ ] Admin users can access admin routes

### Frontend Tests
- [ ] Login page loads
- [ ] Can log in with valid credentials
- [ ] Invalid credentials show error
- [ ] Session persists after page reload
- [ ] Can log out successfully

### Integration Tests
- [ ] Frontend can call API with auth token
- [ ] Token is automatically included in requests
- [ ] Expired tokens are refreshed automatically
- [ ] Protected routes redirect to login

---

## Quick Commands Reference

```bash
# Start all apps
pnpm dev

# Start individual apps
pnpm --filter @dakshinkali/api run dev
pnpm --filter @dakshinkali/web run dev
pnpm --filter @dakshinkali/admin run dev

# Test API health
curl http://localhost:3002/health

# Test API auth (unauthenticated)
curl http://localhost:3002/api/v1/admin/products

# Test API auth (authenticated)
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check database
psql $DATABASE_URL -c "SELECT * FROM public.profiles;"
```

---

## Troubleshooting

### Issue: "Cannot find module '@dakshinkali/auth'"

**Solution**:
```bash
pnpm install
```

### Issue: "Invalid JWT" error

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. Check token hasn't expired
3. Ensure user exists in database

### Issue: "403 Forbidden" on admin routes

**Solution**:
```sql
-- Update user role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### Issue: API won't start

**Solution**:
1. Check `.env` file has all required variables
2. Verify Supabase URL and keys are correct
3. Check console for specific error messages

---

## Documentation Reference

- **Step-by-step guide**: `agent/docs/AUTH_IMPLEMENTATION_STEPS.md`
- **Code snippets**: `agent/docs/AUTH_QUICK_REFERENCE.md`
- **Architecture**: `agent/docs/SUPABASE_AUTH_SUMMARY.md`
- **Flow diagrams**: `agent/docs/AUTH_FLOW_DIAGRAM.md`
- **Checklist**: `agent/docs/AUTH_CHECKLIST.md`

---

## Current Status

✅ **Completed**:
- Dependencies installed
- Backend middleware created
- Auth package created
- Documentation written
- Express adapters updated to use Supabase

⏳ **Pending**:
- Apply database migration
- Create admin user
- Test backend auth
- Setup frontend apps
- End-to-end testing

---

## Ready to Continue?

**Next action**: Apply the database migration (Step 1 above)

Once the migration is applied and you have an admin user, the backend will be fully functional with Supabase Auth!

Then you can proceed with frontend setup to complete the integration.

---

**Need help?** Check the documentation files or ask for assistance with any specific step.
