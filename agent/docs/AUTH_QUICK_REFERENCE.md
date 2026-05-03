# Supabase Auth Quick Reference

**Quick copy-paste code snippets for common auth operations**

---

## 📦 Package Installation

```bash
# Install all dependencies at once
pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/web
pnpm add @supabase/ssr @supabase/supabase-js --filter @dakshinkali/admin
pnpm add @supabase/supabase-js jose --filter @dakshinkali/api
```

---

## 🔐 Environment Variables

```env
# .env file (project root)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

API_PORT=3002
JWT_SECRET=your-service-role-key
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 🗄️ Database Setup

```sql
-- Create admin user
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';

-- Check user role
SELECT id, email, role FROM public.profiles 
WHERE email = 'admin@example.com';

-- List all users
SELECT p.id, p.email, p.role, p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;
```

---

## 🔧 Backend (Express API)

### Initialize Auth in app.ts

```typescript
import { createSupabaseJWTVerifier } from './common/middleware';
import { env } from './config/env.config';

// Create Supabase JWT verifier
const jwtVerifier = createSupabaseJWTVerifier(
    env.supabaseUrl,
    env.supabaseServiceRoleKey
);

// Use in routes
const routes = createProductRoutes({
    productService,
    jwtVerifier, // Pass Supabase verifier
    corsOrigins: env.corsOrigins,
});
```

### Protect Routes with Auth

```typescript
import { requireAdmin, requireAuthenticated } from './common/middleware';

// Admin-only route
async function adminHandler(context: RequestContext) {
    requireAdmin(context.user); // Throws 403 if not admin
    // ... admin logic
}

// Any authenticated user
async function protectedHandler(context: RequestContext) {
    requireAuthenticated(context.user); // Throws 401 if not authenticated
    // ... protected logic
}
```

### Check User Role

```typescript
import { hasRole, getUserRole } from './common/middleware';

async function handler(context: RequestContext) {
    if (hasRole(context.user, 'admin')) {
        // Admin-specific logic
    }
    
    const role = getUserRole(context.user); // 'admin', 'customer', or 'guest'
}
```

---

## 🌐 Frontend (Next.js)

### Root Layout with Auth Provider

```typescript
// app/layout.tsx
import { AuthProvider } from '@dakshinkali/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

### Login Form

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@dakshinkali/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) router.push('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Signup Form

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@dakshinkali/auth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signUp(email, password, {
      full_name: fullName,
      role: 'customer', // Default role
    });
    if (!error) alert('Check your email for confirmation!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Protected Page

```typescript
'use client';

import { useAuth } from '@dakshinkali/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### User Profile Component

```typescript
'use client';

import { useUser } from '@dakshinkali/auth';

export function UserProfile() {
  const user = useUser();

  if (!user) {
    return <a href="/login">Login</a>;
  }

  return (
    <div>
      <img src={user.user_metadata?.avatar_url} alt="Avatar" />
      <span>{user.email}</span>
    </div>
  );
}
```

### API Client with Auth

```typescript
// lib/api-client.ts
import { createBrowserClient, getAccessToken } from '@dakshinkali/auth';

const API_URL = 'http://localhost:3002';

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const supabase = createBrowserClient();
  const token = await getAccessToken(supabase);

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Usage
import { apiRequest } from './lib/api-client';

const products = await apiRequest('/api/v1/admin/products');
```

### Fetch with Auth Hook

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@dakshinkali/auth';

export function useAuthFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(url, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [url, supabase]);

  return { data, loading, error };
}

// Usage
function ProductList() {
  const { data, loading, error } = useAuthFetch('/api/v1/admin/products');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

---

## 🔒 Server-Side Auth (Server Components)

### Get User in Server Component

```typescript
// app/profile/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@dakshinkali/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = createServerClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
    </div>
  );
}
```

### Server Action with Auth

```typescript
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@dakshinkali/auth';

export async function updateProfile(formData: FormData) {
  const supabase = createServerClient(cookies());
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const fullName = formData.get('fullName') as string;

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);

  if (error) throw error;

  return { success: true };
}
```

### Middleware for Route Protection

```typescript
// middleware.ts
import { createServerClient } from '@dakshinkali/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(request.cookies);

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
};
```

---

## 🧪 Testing

### Test Login via cURL

```bash
# Get session token (run in browser console)
const supabase = createBrowserClient();
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);

# Test API with token
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Signup

```bash
# Via Supabase client
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'Test User',
      role: 'customer',
    },
  },
});
```

### Test Role Check

```sql
-- Check user role
SELECT id, email, role FROM public.profiles WHERE email = 'test@example.com';

-- Update to admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'test@example.com';
```

---

## 🐛 Common Issues

### Issue: "Invalid JWT"

```typescript
// Verify JWT secret is correct
console.log('JWT Secret:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));

// Check token expiration
const { data: { session } } = await supabase.auth.getSession();
console.log('Token expires at:', new Date(session.expires_at * 1000));
```

### Issue: "CORS Error"

```typescript
// Update CORS in .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

// Restart API server
pnpm --filter @dakshinkali/api run dev
```

### Issue: "User not found"

```sql
-- Check if profile exists
SELECT * FROM public.profiles WHERE email = 'user@example.com';

-- Manually create profile
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'customer'
FROM auth.users
WHERE email = 'user@example.com';
```

---

## 📚 Useful Queries

```sql
-- List all users with roles
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.created_at,
  u.last_sign_in_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;

-- Count users by role
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role;

-- Find admins
SELECT email, full_name FROM public.profiles WHERE role = 'admin';

-- Recent signups
SELECT email, created_at 
FROM public.profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🚀 Production Checklist

- [ ] Service role key in environment variables (not in code)
- [ ] .env in .gitignore
- [ ] RLS enabled on all tables
- [ ] JWT verification on all protected routes
- [ ] CORS configured for production domains
- [ ] HTTPS only in production
- [ ] Email confirmation enabled
- [ ] Password reset flow tested
- [ ] Rate limiting enabled
- [ ] Monitoring and logging configured
