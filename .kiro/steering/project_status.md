---
inclusion: auto
---

# Project Status & Context

## 📍 Current State (May 3, 2026)

### ✅ Completed Modules

#### Product Module - PRODUCTION READY
- **Database**: Products table with migrations and indexes
- **Repository**: Full CRUD + filtering, search, pagination
- **Service**: Business logic + Supabase storage integration
- **Controllers**: Admin (protected) + Public endpoints
- **Tests**: Unit + Integration + Property-based tests
- **Storage**: Image upload to Supabase storage buckets
- **Status**: ✅ Complete and tested

### ⚠️ Partially Implemented

#### Cart Module - DATABASE ONLY
- **Database**: ✅ Migrations exist (`carts`, `cart_items` tables)
- **Code**: ❌ No repository/service/controller layers
- **Status**: 10% complete

### ❌ Not Implemented

#### Authentication System
- **Current**: Mock JWT verifier (accepts any token)
- **Missing**: 
  - Real Supabase Auth integration
  - User registration/login endpoints
  - JWT verification with real tokens
  - Session management
  - Password reset flow
- **Impact**: Admin endpoints are NOT secure
- **Priority**: 🚨 CRITICAL

#### Order Module
- **Status**: Not started
- **Missing**: Database schema, all layers, payment integration

#### User Management
- **Status**: Only Supabase auth.users table exists
- **Missing**: User profiles, roles, CRUD endpoints

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js (TypeScript)
  - `apps/web` - Storefront (port 3000)
  - `apps/admin` - Admin panel (port 3001)
- **Backend**: Express + TypeScript (port 3002)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Monorepo**: Turborepo + pnpm workspaces

### Layer Pattern (Enforced)
```
Controller (HTTP/Express)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access)
    ↓
Database (Supabase)
```

### Package Structure
```
apps/
  ├── web/          # Next.js storefront
  ├── admin/        # Next.js admin panel
  └── api/          # Express API server
packages/
  └── database/     # Supabase client + storage config
```

---

## 🔐 Security Status

### Current Issues
1. **Mock Authentication Active** - Any token is accepted
2. **Admin Endpoints Open** - No real authorization
3. **No Rate Limiting** - Basic implementation only

### What Works (Insecurely)
- Admin product CRUD (accepts mock tokens)
- Public product listing (no auth needed)

### What Doesn't Work
- User login/registration
- Real JWT verification
- Role-based access control

---

## 📊 API Endpoints Status

### Public Endpoints (Working ✅)
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/products?search=...` - Search products
- `GET /api/v1/products?category=...` - Filter by category

### Admin Endpoints (Mock Auth ⚠️)
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product
- `GET /api/v1/admin/products` - List all (including inactive)

### Not Implemented (❌)
- Auth endpoints (login, register, refresh)
- Cart endpoints (add, remove, update)
- Order endpoints (create, list, update status)
- User profile endpoints

---

## 🎯 Next Steps (Priority Order)

### Phase 1: Security (CRITICAL) 🚨
1. Implement Supabase Auth integration
2. Replace mockJWTVerifier with real verification
3. Add user registration/login endpoints
4. Secure admin endpoints with real tokens
5. Add refresh token flow

### Phase 2: Cart Module
1. Create cart repository layer
2. Create cart service layer
3. Create cart controllers + routes
4. Add cart validation
5. Write cart tests

### Phase 3: Order Module
1. Design order schema (orders, order_items, payments)
2. Create migrations
3. Implement repository layer
4. Implement service layer (order flow)
5. Create order endpoints
6. Integrate payment gateway

### Phase 4: Production Readiness
1. Add comprehensive logging
2. Set up monitoring/alerting
3. Create CI/CD pipeline
4. Add database backup strategy
5. Performance testing
6. Security audit

---

## 📚 Documentation Location

All agent-generated documentation is in `agent/docs/`:
- `REALITY_CHECK.md` - Detailed gap analysis
- `SUPABASE_SETUP.md` - Database setup guide
- `TESTING_QUICKSTART.md` - Test execution guide
- `API_DEV_STATUS.md` - Development progress
- `PRODUCTION_READY_BACKEND.md` - Production checklist
- Other technical reports

---

## 🚀 Development Commands

### Start All Apps
```bash
pnpm dev              # All apps in parallel
pnpm --filter @dakshinkali/web dev      # Web only
pnpm --filter @dakshinkali/admin dev    # Admin only
pnpm --filter @dakshinkali/api dev      # API only
```

### Database
```bash
pnpm db:start         # Start local Supabase
pnpm db:stop          # Stop local Supabase
pnpm db:reset         # Reset database
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test:coverage    # With coverage report
```

---

## ⚠️ Important Constraints

### DO NOT
- ❌ Design for multi-platform (Flutter, mobile apps)
- ❌ Skip layer audits (mandatory after each layer)
- ❌ Proceed to next layer without audit approval
- ❌ Use frontend direct database access
- ❌ Deploy with mock authentication

### ALWAYS
- ✅ Follow layered architecture (Repository → Service → Controller)
- ✅ Audit each layer before proceeding
- ✅ Write tests for new features
- ✅ Use TypeScript strict mode
- ✅ Validate inputs at controller layer
- ✅ Handle errors properly with custom exceptions

---

## 🎓 Key Takeaways for AI Agents

1. **Product module is complete** - Use it as reference for other modules
2. **Auth is mocked** - Do not assume real security exists
3. **Cart has DB only** - Full implementation needed
4. **Orders don't exist** - Start from scratch
5. **Follow layer pattern** - Repository → Service → Controller → Audit
6. **Security first** - Implement real auth before building more features

---

## 📝 Environment Variables

Required in `.env`:
```bash
# Supabase
SUPABASE_URL=https://txpfjmnxifwiwqxwtxlf.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0rsBxrI7_vss4cqixFeoTw_JLwtj3tM
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT (for when auth is implemented)
JWT_SECRET=your-jwt-secret

# Ports
WEB_PORT=3000
ADMIN_PORT=3001
API_PORT=3002
```

---

## 🔄 Last Updated
May 3, 2026 - After product module completion and reality check
