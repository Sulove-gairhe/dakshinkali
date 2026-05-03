# Supabase Auth Implementation Steps

**Step-by-step guide to integrate Supabase Auth into your monorepo**

---

## Phase 1: Database Setup

### Step 1.1: Apply Profiles Migration

```bash
# Navigate to project root
cd /path/to/dakshinkali

# Apply the migration using Supabase CLI
pnpm db:migration:apply

# Or manually via Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor
# 2. Copy contents of supabase/migrations/20260503000000_create_profiles_table.sql
# 3. Run in SQL Editor
```

### Step 1.2: Verify Migration

```sql
-- Run in Supabase SQL Editor to verify

-- Check if profiles table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- List all policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
```

### Step 1.3: Create Test Admin User

```sql
-- Option 1: Update existing user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Option 2: Sign up via Supabase Dashboard
-- 1. Go to Authentication > Users
-- 2. Click "Add user"
-- 3. Enter email and password
-- 4. After creation, run UPDATE query above
```

---

## Phase 2: Install Dependencies

### Step 2.1: Install Supabase Packages

```bash
# Install for Next.js apps (web + admin)
pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/web
pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/admin

# Install for API (Express)
pnpm add @supabase/supabase-js jose --filter @dakshinkali/api

# Install for shared auth package
pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/auth
```

### Step 2.2: Verify Installation

```bash
# Check package.json files
cat apps/web/package.json | grep supabase
cat apps/admin/package.json | grep supabase
cat apps/api/package.json | grep supabase
cat packages/auth/package.json | grep supabase
```

---

## Phase 3: Environment Variables

### Step 3.1: Update .env File

```bash
# Edit .env in project root
nano .env
```

Add/update these variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Next.js Public Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
API_PORT=3002
JWT_SECRET=your-service-role-key-here

# CORS (allow frontend apps)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Step 3.2: Get Supabase Keys

```bash
# From Supabase Dashboard:
# 1. Go to Project Settings > API
# 2. Copy "Project URL" → SUPABASE_URL
# 3. Copy "anon public" key → SUPABASE_ANON_KEY
# 4. Copy "service_role" key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)
```

### Step 3.3: Verify Environment

```bash
# Test environment loading
pnpm --filter @dakshinkali/api run dev

# Should see in logs:
# ✓ Supabase URL: https://...
# ✓ Environment loaded successfully
```

---

## Phase 4: Backend (Express API) Setup

### Step 4.1: Update Auth Middleware

The middleware files have already been created:
- `apps/api/src/common/middleware/supabase-auth.middleware.ts`
- `apps/api/src/common/middleware/role.middleware.ts`

### Step 4.2: Update Product Routes

Edit `apps/api/src/app.ts` to use Supabase auth:

```typescript
import express from 'express';
import { createProductRoutes, registerExpressRoutes } from './modules/products/routes/product.routes';
import { ProductServiceImpl } from './modules/products/services/product.service.impl';
import { ProductRepositoryImpl } from './modules/products/repositories/product.repository.impl';
import { ImageStorageServiceImpl } from './modules/products/services/image-storage.service.impl';
import { createSupabaseJWTVerifier } from './common/middleware';
import { env } from './config/env.config';

const app = express();
app.use(express.json());

// Initialize services
const imageStorage = new ImageStorageServiceImpl();
const productRepository = new ProductRepositoryImpl();
const productService = new ProductServiceImpl(productRepository, imageStorage);

// Create Supabase JWT verifier
const jwtVerifier = createSupabaseJWTVerifier(
    env.supabaseUrl,
    env.supabaseServiceRoleKey
);

// Create and register product routes
const routes = createProductRoutes({
    productService,
    jwtVerifier, // Use Supabase verifier instead of mock
    corsOrigins: env.corsOrigins,
    enableRateLimiting: env.rateLimitEnabled,
    enableCaching: true,
});

registerExpressRoutes(routes, app);

export default app;
```

### Step 4.3: Test API Authentication

```bash
# Start API server
pnpm --filter @dakshinkali/api run dev

# Test without token (should fail)
curl http://localhost:3002/api/v1/admin/products

# Expected response:
# {"error":"Authentication required","statusCode":401}
```

---

## Phase 5: Frontend (Next.js) Setup

### Step 5.1: Add Auth Package to Web App

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

### Step 5.2: Create Auth Provider Layout

Create `apps/web/app/layout.tsx`:

```typescript
import { AuthProvider } from '@dakshinkali/auth';
import './globals.css';

export const metadata = {
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

### Step 5.3: Create Login Page

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

### Step 5.4: Create Protected Profile Page

Create `apps/web/app/profile/page.tsx`:

```typescript
'use client';

import { useAuth } from '@dakshinkali/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Profile</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
      <button
        onClick={handleSignOut}
        style={{ padding: '10px 20px', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}
```

### Step 5.5: Create API Client Utility

Create `apps/web/lib/api-client.ts`:

```typescript
import { createBrowserClient, getAccessToken } from '@dakshinkali/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Make authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createBrowserClient();
  const token = await getAccessToken(supabase);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data: any) =>
    apiRequest<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
```

---

## Phase 6: Admin App Setup

### Step 6.1: Copy Auth Setup from Web App

```bash
# Copy layout
cp apps/web/app/layout.tsx apps/admin/app/layout.tsx

# Copy login page
mkdir -p apps/admin/app/login
cp apps/web/app/login/page.tsx apps/admin/app/login/page.tsx

# Copy API client
mkdir -p apps/admin/lib
cp apps/web/lib/api-client.ts apps/admin/lib/api-client.ts
```

### Step 6.2: Create Admin Dashboard

Create `apps/admin/app/dashboard/page.tsx`:

```typescript
'use client';

import { useAuth } from '@dakshinkali/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api-client';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      const data = await api.get('/api/v1/admin/products');
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user.email}</p>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <h2>Products</h2>
      <div>
        {products.length === 0 ? (
          <p>No products found</p>
        ) : (
          <ul>
            {products.map((product: any) => (
              <li key={product.id}>{product.name} - ${product.price}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 7: Testing

### Step 7.1: Test User Signup

```bash
# Option 1: Via Supabase Dashboard
# Go to Authentication > Users > Add user

# Option 2: Via API (create signup endpoint)
curl -X POST http://localhost:3002/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Step 7.2: Test Login Flow

```bash
# Start all apps
pnpm dev

# Open browser:
# 1. Go to http://localhost:3000/login
# 2. Enter email and password
# 3. Click Login
# 4. Should redirect to home page
# 5. Go to http://localhost:3000/profile
# 6. Should see user info
```

### Step 7.3: Test API Authentication

```bash
# Get access token from browser console:
# Open DevTools > Console > Run:
# const supabase = createBrowserClient();
# const { data } = await supabase.auth.getSession();
# console.log(data.session.access_token);

# Test authenticated request
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Should return products list
```

### Step 7.4: Test Admin Authorization

```bash
# Test with non-admin user (should fail)
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer NON_ADMIN_TOKEN"

# Expected response:
# {"error":"Administrator access required","statusCode":403}

# Update user to admin in database
# Then test again (should succeed)
```

---

## Phase 8: Security Checklist

### ✅ Verify These Security Measures

- [ ] Service role key is in .env (not committed to git)
- [ ] .env is in .gitignore
- [ ] RLS is enabled on profiles table
- [ ] JWT tokens are verified server-side
- [ ] Admin routes require admin role
- [ ] CORS is configured correctly
- [ ] Tokens are sent via Authorization header (not query params)
- [ ] Session cookies are httpOnly and secure
- [ ] Password reset flow is configured in Supabase
- [ ] Email confirmation is enabled (optional)

---

## Phase 9: Production Deployment

### Step 9.1: Update Environment Variables

```bash
# For production, update .env with production Supabase project:
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# Update CORS for production domains
CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

### Step 9.2: Apply Migrations to Production

```bash
# Using Supabase CLI
supabase db push --project-ref your-prod-project-ref

# Or manually via Supabase Dashboard SQL Editor
```

### Step 9.3: Configure Supabase Auth Settings

In Supabase Dashboard > Authentication > Settings:

1. **Site URL**: Set to your production domain
2. **Redirect URLs**: Add your production URLs
3. **Email Templates**: Customize confirmation/reset emails
4. **JWT Expiry**: Set appropriate token lifetime (default: 1 hour)
5. **Refresh Token Rotation**: Enable for better security

---

## Troubleshooting

### Issue: "Invalid JWT" Error

**Solution:**
```bash
# Verify JWT secret matches
echo $SUPABASE_SERVICE_ROLE_KEY

# Check token in jwt.io
# Ensure algorithm is HS256
```

### Issue: "CORS Error" in Browser

**Solution:**
```bash
# Update CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Restart API server
pnpm --filter @dakshinkali/api run dev
```

### Issue: "User Not Found" After Login

**Solution:**
```sql
-- Check if profile was created
SELECT * FROM public.profiles WHERE email = 'your-email@example.com';

-- If missing, check trigger
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- Manually create profile
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer'
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Issue: "403 Forbidden" for Admin Routes

**Solution:**
```sql
-- Update user role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, role FROM public.profiles 
WHERE email = 'your-email@example.com';
```

---

## Next Steps

1. ✅ Implement password reset flow
2. ✅ Add email confirmation
3. ✅ Create user management UI for admins
4. ✅ Add OAuth providers (Google, GitHub)
5. ✅ Implement refresh token rotation
6. ✅ Add audit logging for admin actions
7. ✅ Set up monitoring and alerts

---

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [JWT Best Practices](https://supabase.com/docs/guides/auth/jwts)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
