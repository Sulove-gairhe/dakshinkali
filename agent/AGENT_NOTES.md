# Agent Notes & Context

This file contains important notes for AI agents working on this project.

## 🎯 Critical Context

### What This Project Is
- **E-commerce platform** for Dakshinkali Electronics
- **Web-only** (no mobile apps, no Flutter)
- **Monorepo** with Next.js frontend + Express backend
- **Supabase** for database and storage

### Current Reality (May 3, 2026)
- ✅ **Product module is COMPLETE** - Use as reference
- ⚠️ **Auth is MOCKED** - Security risk, needs real implementation
- ⚠️ **Cart has DB only** - No code implementation
- ❌ **Orders don't exist** - Not started
- ❌ **Payments don't exist** - Not started

---

## 🚨 Before You Start Any Task

1. **Read** `agent/docs/REALITY_CHECK.md` - Know what exists
2. **Check** `.kiro/steering/project_status.md` - Current context
3. **Review** `.kiro/steering/Steering.md` - Behavior rules
4. **Verify** Don't assume features exist - check the code

---

## 🏗️ Architecture Rules (MANDATORY)

### Layer Execution Order
```
1. Repository Layer
2. Repository Audit (MANDATORY)
3. Service Layer  
4. Service Audit (MANDATORY)
5. Controller Layer
6. Controller Audit (MANDATORY)
```

### Audit Requirements
After EVERY layer completion:
- ✅ Check correctness
- ✅ Check safety
- ✅ Check scalability
- ✅ Check consistency
- ✅ Explicit PASS/FAIL decision

**If audit FAILS → STOP and fix before proceeding**

### Layer Pattern
```typescript
// Controller - HTTP handling
export class ProductController {
  constructor(private service: ProductService) {}
  
  async getProduct(req, res) {
    const product = await this.service.getById(id);
    return res.json(product);
  }
}

// Service - Business logic
export class ProductServiceImpl implements ProductService {
  constructor(private repository: ProductRepository) {}
  
  async getById(id: string): Promise<Product> {
    const product = await this.repository.findById(id);
    if (!product) throw new ProductNotFoundException(id);
    return product;
  }
}

// Repository - Data access
export class ProductRepositoryImpl implements ProductRepository {
  constructor(private db: SupabaseClient) {}
  
  async findById(id: string): Promise<Product | null> {
    const { data } = await this.db
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }
}
```

---

## 🔐 Security Context

### Current Auth Status
```typescript
// apps/api/src/common/middleware/auth.middleware.ts
export const mockJWTVerifier: JWTVerifier = (token: string) => {
  // ⚠️ THIS IS MOCK - ACCEPTS ANY TOKEN
  return {
    sub: 'mock-user-id',
    email: 'mock@example.com',
    role: 'user',
  };
};
```

### What This Means
- ❌ Admin endpoints are NOT secure
- ❌ Anyone can call admin APIs
- ❌ No real user authentication
- 🚨 **DO NOT DEPLOY TO PRODUCTION**

### What Needs to Happen
1. Integrate Supabase Auth
2. Replace mockJWTVerifier with real JWT verification
3. Add user registration/login endpoints
4. Implement refresh token flow
5. Test with real tokens

---

## 📊 Module Status Reference

### Product Module ✅
**Location**: `apps/api/src/modules/products/`

**Structure**:
```
products/
├── repositories/
│   ├── product.repository.ts (interface)
│   └── product.repository.impl.ts (implementation)
├── services/
│   ├── product.service.ts (interface)
│   ├── product.service.impl.ts (implementation)
│   ├── image-storage.service.ts (interface)
│   └── image-storage.service.impl.ts (implementation)
├── controllers/
│   ├── admin-product.controller.ts
│   └── public-product.controller.ts
├── dto/
│   ├── product.dto.ts
│   ├── create-product.request.ts
│   └── update-product.request.ts
├── routes/
│   ├── product.routes.ts
│   └── express.routes.ts
├── validators/
│   └── product.validator.ts
├── exceptions/
│   ├── product-not-found.exception.ts
│   └── duplicate-product.exception.ts
└── __tests__/
    ├── integration/
    └── properties/
```

**Use this as template for Cart and Order modules**

### Cart Module ⚠️
**Location**: `apps/api/src/modules/carts/` (DOES NOT EXIST)

**What Exists**:
- ✅ Database migrations (`supabase/migrations/`)
  - `20260503110000_create_carts_table.sql`
  - `20260503110100_create_cart_items_table.sql`

**What's Missing**:
- ❌ Repository layer
- ❌ Service layer
- ❌ Controller layer
- ❌ DTOs
- ❌ Routes
- ❌ Validators
- ❌ Tests

**Next Steps**:
1. Create folder structure (copy from products)
2. Implement repository layer
3. Audit repository
4. Implement service layer
5. Audit service
6. Implement controller layer
7. Audit controller
8. Write tests

### Order Module ❌
**Status**: Not started

**What's Missing**:
- ❌ Database schema
- ❌ Migrations
- ❌ All code layers
- ❌ Payment integration

---

## 🎯 Common Tasks

### Adding a New Module

1. **Create Database Schema**
   ```sql
   -- supabase/migrations/YYYYMMDDHHMMSS_create_<module>_table.sql
   CREATE TABLE <module> (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     -- fields
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. **Create Folder Structure**
   ```bash
   mkdir -p apps/api/src/modules/<module>/{repositories,services,controllers,dto,routes,validators,exceptions,__tests__}
   ```

3. **Implement Layers** (in order)
   - Repository (data access)
   - Service (business logic)
   - Controller (HTTP handling)
   - Routes (endpoint mapping)

4. **Audit Each Layer** (mandatory)

5. **Write Tests**
   - Unit tests for each layer
   - Integration tests for API endpoints

### Implementing Real Auth

1. **Install Supabase Auth**
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   ```

2. **Replace Mock Verifier**
   ```typescript
   // Replace mockJWTVerifier with:
   export const supabaseJWTVerifier: JWTVerifier = async (token: string) => {
     const { data: { user }, error } = await supabase.auth.getUser(token);
     if (error || !user) throw new UnauthorizedException('Invalid token');
     return {
       sub: user.id,
       email: user.email!,
       role: user.user_metadata.role || 'user',
     };
   };
   ```

3. **Add Auth Endpoints**
   ```typescript
   POST /api/v1/auth/register
   POST /api/v1/auth/login
   POST /api/v1/auth/refresh
   POST /api/v1/auth/logout
   ```

4. **Update Middleware Usage**
   ```typescript
   const authMiddleware = createAuthMiddleware(supabaseJWTVerifier);
   ```

---

## 📝 Documentation Standards

### When to Update Docs
- ✅ After completing a feature
- ✅ After fixing critical bugs
- ✅ After architectural changes
- ✅ Before starting new work (to establish context)

### What to Update
1. **REALITY_CHECK.md** - Update completion status
2. **project_status.md** - Update current state
3. **Create new reports** - For significant changes
4. **Update API docs** - When endpoints change

### Document Format
```markdown
# Title

## Current Status
- What exists
- What's missing

## What Changed
- Specific changes made

## Impact
- What this affects

## Next Steps
- What needs to happen next

---
Last Updated: YYYY-MM-DD
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Assume Features Exist
```typescript
// ❌ BAD - Assuming auth works
const user = await authService.getCurrentUser();

// ✅ GOOD - Check reality first
// Read REALITY_CHECK.md - auth is mocked!
```

### ❌ Don't Skip Layer Audits
```typescript
// ❌ BAD - Implementing all layers at once
// Repository + Service + Controller → Deploy

// ✅ GOOD - Layer by layer with audits
// Repository → Audit → Service → Audit → Controller → Audit
```

### ❌ Don't Mix Layers
```typescript
// ❌ BAD - Controller accessing database directly
export class ProductController {
  async getProduct(req, res) {
    const { data } = await supabase.from('products').select('*');
    return res.json(data);
  }
}

// ✅ GOOD - Controller uses service
export class ProductController {
  constructor(private service: ProductService) {}
  
  async getProduct(req, res) {
    const product = await this.service.getById(req.params.id);
    return res.json(product);
  }
}
```

### ❌ Don't Design for Multi-Platform
```typescript
// ❌ BAD - Adding mobile-specific abstractions
interface PlatformAdapter {
  web: WebImplementation;
  mobile: MobileImplementation;
  flutter: FlutterImplementation;
}

// ✅ GOOD - Web-only, simple and direct
interface ProductService {
  getById(id: string): Promise<Product>;
}
```

---

## 🎓 Learning from Product Module

### What Went Well ✅
- Clean layer separation
- Comprehensive tests
- Good error handling
- Type-safe DTOs
- Supabase storage integration

### Use as Reference
- Copy folder structure
- Copy layer pattern
- Copy test structure
- Copy DTO patterns
- Copy error handling

### File to Study
1. `product.repository.impl.ts` - Data access patterns
2. `product.service.impl.ts` - Business logic patterns
3. `admin-product.controller.ts` - HTTP handling patterns
4. `product.dto.ts` - DTO mapping patterns
5. `product.validator.ts` - Validation patterns

---

## 🔄 Workflow for New Features

### 1. Planning Phase
- [ ] Read REALITY_CHECK.md
- [ ] Check what exists
- [ ] Define requirements
- [ ] Design database schema
- [ ] Plan layer structure

### 2. Implementation Phase
- [ ] Create migrations
- [ ] Implement repository layer
- [ ] **AUDIT REPOSITORY** ✅
- [ ] Implement service layer
- [ ] **AUDIT SERVICE** ✅
- [ ] Implement controller layer
- [ ] **AUDIT CONTROLLER** ✅

### 3. Testing Phase
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Run test suite
- [ ] Check coverage

### 4. Documentation Phase
- [ ] Update REALITY_CHECK.md
- [ ] Update project_status.md
- [ ] Update API documentation
- [ ] Create feature summary

### 5. Review Phase
- [ ] Code review
- [ ] Security review
- [ ] Performance review
- [ ] Documentation review

---

## 💡 Quick Tips

1. **Always check reality first** - Don't assume
2. **Follow the layer pattern** - It's mandatory
3. **Audit after each layer** - No exceptions
4. **Use Product module as template** - It's complete
5. **Update docs after changes** - Keep context fresh
6. **Be honest about gaps** - Don't pretend features exist
7. **Security first** - Fix auth before building more
8. **Test everything** - No untested code

---

## 📞 Need Help?

1. Check `agent/docs/REALITY_CHECK.md` - What exists?
2. Check `.kiro/steering/project_status.md` - Current state?
3. Check `apps/api/src/modules/products/` - How to structure?
4. Check `agent/docs/` - Historical context?

---

Last Updated: May 3, 2026
