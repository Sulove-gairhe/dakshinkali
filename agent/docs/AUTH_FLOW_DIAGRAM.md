# Supabase Auth Flow Diagrams

**Visual representation of authentication and authorization flows**

---

## 1. User Signup Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User fills signup form
       │    (email, password, full_name)
       │
       ▼
┌─────────────────────────────────────┐
│  AuthProvider (React Context)       │
│  - signUp(email, password, metadata)│
└──────┬──────────────────────────────┘
       │
       │ 2. Call Supabase Auth API
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth Service              │
│  - Create user in auth.users        │
│  - Hash password                    │
│  - Generate JWT token               │
└──────┬──────────────────────────────┘
       │
       │ 3. Trigger: on_auth_user_created
       │
       ▼
┌─────────────────────────────────────┐
│  Database Trigger                   │
│  - Extract user data                │
│  - Insert into public.profiles      │
│  - Set default role: 'customer'     │
└──────┬──────────────────────────────┘
       │
       │ 4. Return session + user
       │
       ▼
┌─────────────────────────────────────┐
│  Browser                            │
│  - Store session in cookies         │
│  - Update AuthContext state         │
│  - Redirect to dashboard            │
└─────────────────────────────────────┘
```

---

## 2. User Login Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User enters credentials
       │    (email, password)
       │
       ▼
┌─────────────────────────────────────┐
│  AuthProvider                       │
│  - signIn(email, password)          │
└──────┬──────────────────────────────┘
       │
       │ 2. Call Supabase Auth API
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth Service              │
│  - Verify email exists              │
│  - Verify password hash             │
│  - Generate JWT token               │
│  - Create session                   │
└──────┬──────────────────────────────┘
       │
       │ 3. Return session + user
       │    {
       │      access_token: "eyJ...",
       │      refresh_token: "...",
       │      user: { id, email, ... }
       │    }
       │
       ▼
┌─────────────────────────────────────┐
│  Browser                            │
│  - Store tokens in cookies          │
│  - Update AuthContext state         │
│  - user = { id, email, ... }        │
│  - Redirect to dashboard            │
└─────────────────────────────────────┘
```

---

## 3. Protected API Request Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User clicks "Load Products"
       │
       ▼
┌─────────────────────────────────────┐
│  API Client (api-client.ts)         │
│  - Get access token from session    │
│  - Add to Authorization header      │
└──────┬──────────────────────────────┘
       │
       │ 2. HTTP Request
       │    GET /api/v1/admin/products
       │    Authorization: Bearer eyJ...
       │
       ▼
┌─────────────────────────────────────┐
│  Express API Server                 │
│  - Receive request                  │
│  - Extract Authorization header     │
└──────┬──────────────────────────────┘
       │
       │ 3. Auth Middleware
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth Middleware           │
│  - Extract token from header        │
│  - Verify JWT signature             │
│  - Call supabase.auth.getUser()     │
│  - Extract user claims              │
└──────┬──────────────────────────────┘
       │
       │ 4. Attach user to context
       │    context.user = {
       │      id: "uuid",
       │      email: "user@example.com",
       │      role: "admin"
       │    }
       │
       ▼
┌─────────────────────────────────────┐
│  Role Middleware                    │
│  - Check context.user exists        │
│  - Check context.user.role === 'admin'│
│  - Throw 403 if not admin           │
└──────┬──────────────────────────────┘
       │
       │ 5. Authorization passed
       │
       ▼
┌─────────────────────────────────────┐
│  Route Handler                      │
│  - Execute business logic           │
│  - Query database                   │
│  - Return products                  │
└──────┬──────────────────────────────┘
       │
       │ 6. HTTP Response
       │    200 OK
       │    { products: [...] }
       │
       ▼
┌─────────────────────────────────────┐
│  Browser                            │
│  - Receive products                 │
│  - Update UI                        │
└─────────────────────────────────────┘
```

---

## 4. Token Refresh Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. Access token expires
       │    (after 1 hour)
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Client                    │
│  - Detect token expiration          │
│  - Auto-refresh enabled             │
└──────┬──────────────────────────────┘
       │
       │ 2. Call refresh endpoint
       │    POST /auth/v1/token
       │    { refresh_token: "..." }
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth Service              │
│  - Verify refresh token             │
│  - Generate new access token        │
│  - Generate new refresh token       │
└──────┬──────────────────────────────┘
       │
       │ 3. Return new tokens
       │    {
       │      access_token: "new_eyJ...",
       │      refresh_token: "new_..."
       │    }
       │
       ▼
┌─────────────────────────────────────┐
│  Browser                            │
│  - Update tokens in cookies         │
│  - Continue with new access token   │
│  - User stays logged in             │
└─────────────────────────────────────┘
```

---

## 5. Logout Flow

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       │ 1. User clicks "Logout"
       │
       ▼
┌─────────────────────────────────────┐
│  AuthProvider                       │
│  - signOut()                        │
└──────┬──────────────────────────────┘
       │
       │ 2. Call Supabase Auth API
       │    POST /auth/v1/logout
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Auth Service              │
│  - Invalidate session               │
│  - Revoke refresh token             │
│  - Clear server-side session        │
└──────┬──────────────────────────────┘
       │
       │ 3. Return success
       │
       ▼
┌─────────────────────────────────────┐
│  Browser                            │
│  - Clear cookies                    │
│  - Clear AuthContext state          │
│  - user = null                      │
│  - Redirect to login page           │
└─────────────────────────────────────┘
```

---

## 6. Role-Based Authorization Flow

```
┌─────────────────────────────────────┐
│  Incoming Request                   │
│  Authorization: Bearer eyJ...       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auth Middleware                    │
│  - Verify JWT                       │
│  - Extract user claims              │
│  - Attach to context.user           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Role Middleware                    │
│  - Check context.user exists?       │
└──────┬──────────────────────────────┘
       │
       ├─── NO ──────────────────────────┐
       │                                 │
       │                                 ▼
       │                    ┌─────────────────────────┐
       │                    │  401 Unauthorized       │
       │                    │  "Authentication        │
       │                    │   required"             │
       │                    └─────────────────────────┘
       │
       └─── YES ─────────────────────────┐
                                         │
                                         ▼
                            ┌─────────────────────────┐
                            │  Check user.role        │
                            └──────┬──────────────────┘
                                   │
                                   ├─── role === 'admin' ───┐
                                   │                         │
                                   │                         ▼
                                   │            ┌─────────────────────┐
                                   │            │  ✅ Allow Access    │
                                   │            │  Continue to handler│
                                   │            └─────────────────────┘
                                   │
                                   └─── role !== 'admin' ───┐
                                                             │
                                                             ▼
                                                ┌─────────────────────┐
                                                │  403 Forbidden      │
                                                │  "Administrator     │
                                                │   access required"  │
                                                └─────────────────────┘
```

---

## 7. Database RLS (Row Level Security) Flow

```
┌─────────────────────────────────────┐
│  User Query                         │
│  SELECT * FROM profiles             │
│  WHERE id = 'some-uuid'             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  PostgreSQL + RLS                   │
│  - Check if RLS enabled on table    │
│  - Get current user: auth.uid()     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Evaluate RLS Policies              │
│                                     │
│  Policy 1: "Users can view own"     │
│  USING (auth.uid() = id)            │
│                                     │
│  Policy 2: "Admins can view all"    │
│  USING (                            │
│    EXISTS (                         │
│      SELECT 1 FROM profiles         │
│      WHERE id = auth.uid()          │
│      AND role = 'admin'             │
│    )                                │
│  )                                  │
└──────┬──────────────────────────────┘
       │
       ├─── Policy 1 TRUE ────────────┐
       │   (viewing own profile)      │
       │                              │
       ├─── Policy 2 TRUE ────────────┤
       │   (user is admin)            │
       │                              │
       └─── Both FALSE ──────────────┐│
           (unauthorized)            ││
                                     ││
                                     ▼▼
                        ┌─────────────────────────┐
                        │  Return Filtered Rows   │
                        │  - Own profile only     │
                        │  - OR all profiles      │
                        │    (if admin)           │
                        │  - OR empty result      │
                        │    (if unauthorized)    │
                        └─────────────────────────┘
```

---

## 8. Complete Request Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│                                                               │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐        │
│  │   Login    │───▶│   Store    │───▶│  API Call  │        │
│  │   Form     │    │  Session   │    │  + Token   │        │
│  └────────────┘    └────────────┘    └──────┬─────┘        │
│                                              │               │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                                               │ HTTP Request
                                               │ Authorization: Bearer <token>
                                               │
┌──────────────────────────────────────────────┼───────────────┐
│                         BACKEND               │               │
│                                               ▼               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. CORS Middleware                                 │    │
│  │     - Check origin                                  │    │
│  │     - Add CORS headers                              │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2. Auth Middleware                                 │    │
│  │     - Extract token from header                     │    │
│  │     - Verify JWT with Supabase                      │    │
│  │     - Extract user claims                           │    │
│  │     - Attach to context.user                        │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3. Role Middleware                                 │    │
│  │     - Check user exists                             │    │
│  │     - Check user.role === 'admin'                   │    │
│  │     - Throw 403 if not authorized                   │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  4. Rate Limit Middleware                           │    │
│  │     - Check request count                           │    │
│  │     - Throw 429 if exceeded                         │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  5. Route Handler                                   │    │
│  │     - Execute business logic                        │    │
│  │     - Call service layer                            │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  6. Service Layer                                   │    │
│  │     - Validate input                                │    │
│  │     - Call repository                               │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  7. Repository Layer                                │    │
│  │     - Query database                                │    │
│  │     - Apply RLS policies                            │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                      │ Database Query
                      │
┌─────────────────────┼────────────────────────────────────────┐
│                  DATABASE                                     │
│                     ▼                                         │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  Supabase PostgreSQL                                │     │
│  │  - Apply RLS policies                               │     │
│  │  - Filter rows based on auth.uid()                  │     │
│  │  - Return authorized data only                      │     │
│  └──────────────────┬──────────────────────────────────┘     │
│                     │                                         │
└─────────────────────┼─────────────────────────────────────────┘
                      │
                      │ Return Data
                      │
                      ▼
              ┌───────────────┐
              │   Response    │
              │   200 OK      │
              │   { data }    │
              └───────────────┘
```

---

## 9. Error Handling Flow

```
┌─────────────────────────────────────┐
│  Request with Invalid Token         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Auth Middleware                    │
│  - Try to verify JWT                │
│  - Verification fails               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Throw UnauthorizedException        │
│  - statusCode: 401                  │
│  - message: "Invalid token"         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Error Handler Middleware           │
│  - Catch exception                  │
│  - Format error response            │
│  - Log error (without sensitive data)│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  HTTP Response                      │
│  401 Unauthorized                   │
│  {                                  │
│    "error": "Invalid token",        │
│    "statusCode": 401,               │
│    "timestamp": "2026-05-03..."     │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 10. Session Management Flow

```
┌─────────────────────────────────────┐
│  User Logs In                       │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Creates Session           │
│  - access_token (1 hour)            │
│  - refresh_token (30 days)          │
│  - expires_at timestamp             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Store in Browser Cookies           │
│  - httpOnly: true                   │
│  - secure: true (production)        │
│  - sameSite: 'lax'                  │
└──────┬──────────────────────────────┘
       │
       │ Time passes...
       │
       ▼
┌─────────────────────────────────────┐
│  Access Token Expires               │
│  (after 1 hour)                     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Supabase Client Detects Expiry     │
│  - Auto-refresh enabled             │
│  - Use refresh_token                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Request New Tokens                 │
│  - Send refresh_token               │
│  - Get new access_token             │
│  - Get new refresh_token            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Update Cookies                     │
│  - Store new tokens                 │
│  - User stays logged in             │
└─────────────────────────────────────┘
```

---

## Key Takeaways

### Security Layers
1. **Frontend**: Session management, token storage
2. **Backend**: JWT verification, role checking
3. **Database**: Row Level Security (RLS)

### Token Flow
- Access token: Short-lived (1 hour), used for API requests
- Refresh token: Long-lived (30 days), used to get new access tokens
- Automatic refresh: Handled by Supabase client

### Authorization Levels
1. **Unauthenticated**: Public routes only
2. **Authenticated**: Any logged-in user
3. **Customer**: Customer-specific routes
4. **Admin**: Full access to admin routes

### Error Handling
- 401: Authentication failed (invalid/missing token)
- 403: Authorization failed (insufficient permissions)
- 429: Rate limit exceeded
- 500: Server error

---

**These diagrams show the complete authentication and authorization flow in your application. Use them as reference when implementing or debugging auth-related features.**
