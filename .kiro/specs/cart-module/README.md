# Cart Module Specification

**Module:** Cart Management  
**Version:** 1.0.0  
**Date:** 2026-05-03  
**Status:** Ready for Implementation

---

## Overview

The Cart Module provides shopping cart functionality for the Dakshinkali Electronics e-commerce platform. It allows authenticated users to add products to their cart, update quantities, remove items, and view their cart contents before proceeding to checkout.

---

## Documents

### 1. [Requirements](./requirements.md)
Comprehensive requirements specification covering:
- Business requirements (BR-1 to BR-13)
- Technical requirements (database schema, API endpoints, indexes)
- Functional requirements (FR-1 to FR-6)
- Non-functional requirements (performance, security, scalability)
- Architecture requirements (layered architecture, testing)
- Data models (entities, DTOs)
- Error handling
- Dependencies
- Acceptance criteria

### 2. [Design](./design.md)
Detailed design document covering:
- Architecture overview (layered architecture diagram)
- Database design (schema, indexes, triggers, relationships)
- Domain models (entities, DTOs)
- Repository layer design (interfaces, implementations, query optimization)
- Service layer design (business logic, price snapshot strategy)
- API layer design (endpoints, validation, error responses)
- Security design (authentication, authorization, data validation)
- Performance optimization (database, caching, query targets)
- Testing strategy (unit, integration, property-based)
- Migration strategy
- Documentation plan
- Future enhancements
- Risks and mitigations

### 3. [Tasks](./tasks.md)
Implementation task breakdown following strict layer-by-layer execution:
- Phase 1: Database Schema & Migrations (5 tasks)
- Phase 2: Repository Layer (9 tasks)
- Phase 3: Repository Audit (MANDATORY)
- Phase 4: Service Layer (5 tasks)
- Phase 5: Service Audit (MANDATORY)
- Phase 6: API Layer (7 tasks)
- Phase 7: API Audit (MANDATORY)
- Phase 8: Documentation (4 tasks)
- Phase 9: Final Validation (3 tasks)

**Total:** 40+ tasks

---

## Key Features

### Core Functionality
- ✅ Add products to cart (with price snapshot)
- ✅ Update product quantities (1-99 range)
- ✅ Remove products from cart
- ✅ View cart with product details and totals
- ✅ Clear entire cart
- ✅ Merge anonymous cart with user cart (on login)

### Business Rules
- One cart per user
- Cart items reference valid, active products
- Quantity constraints (1-99)
- Price snapshot prevents manipulation
- Cart persists across sessions

### Technical Highlights
- Layered architecture (Repository → Service → API)
- Supabase PostgreSQL integration
- JWT authentication
- Efficient database queries with indexes
- Comprehensive error handling
- 80%+ test coverage

---

## Database Schema

### Tables

**carts**
```sql
id UUID PRIMARY KEY
user_id UUID (nullable)
session_id TEXT (nullable)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
CONSTRAINT: user_id OR session_id (not both)
```

**cart_items**
```sql
id UUID PRIMARY KEY
cart_id UUID → carts(id) ON DELETE CASCADE
product_id UUID → products(id) ON DELETE CASCADE
quantity INTEGER (1-99)
price_at_addition NUMERIC(10,2)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
UNIQUE(cart_id, product_id)
```

### Indexes
- `idx_carts_user_id` - Fast user cart lookup
- `idx_carts_session_id` - Fast session cart lookup
- `idx_cart_items_cart_id` - Fast cart items retrieval
- `idx_cart_items_product_id` - Fast product reference checks

---

## API Endpoints

### Authenticated User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/cart/items` | Add item to cart | Required |
| GET | `/api/v1/cart` | Get user's cart | Required |
| PUT | `/api/v1/cart/items/:id` | Update item quantity | Required |
| DELETE | `/api/v1/cart/items/:id` | Remove item from cart | Required |
| DELETE | `/api/v1/cart` | Clear entire cart | Required |
| POST | `/api/v1/cart/merge` | Merge anonymous cart | Required |

---

## Architecture

```
┌─────────────────────────────────────────┐
│         API Layer (HTTP)                │
│  CartController                         │
│  - JWT Authentication                   │
│  - Request Validation                   │
│  - Response Formatting                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  CartService                            │
│  - Add to cart (price snapshot)         │
│  - Calculate totals                     │
│  - Merge carts                          │
│  - Validate product availability        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Repository Layer (Data Access)      │
│  CartRepository, CartItemRepository     │
│  - CRUD operations                      │
│  - Efficient queries                    │
│  - Transaction support                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Database (Supabase PostgreSQL)     │
│  Tables: carts, cart_items              │
└─────────────────────────────────────────┘
```

---

## Dependencies

### Internal
- **Product Module** - Cart items reference products (foreign key)
- **Database Package** - Supabase client and configuration
- **Auth Middleware** - JWT validation for protected endpoints

### External
- **Supabase** - PostgreSQL database
- **Express** - HTTP server framework
- **Zod** - Request validation

---

## Testing Strategy

### Unit Tests
- Repository layer (CRUD operations, error handling)
- Service layer (business logic, calculations, edge cases)
- Controller layer (HTTP handling, validation, auth)

### Integration Tests
- End-to-end cart flow (add → update → remove → clear)
- Merge cart flow (anonymous → authenticated)
- Authentication/authorization checks
- Database constraints

### Property-Based Tests
- Cart total calculation correctness
- Quantity constraints (1-99)
- Price snapshot immutability

**Target:** 80%+ code coverage

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Get Cart | < 200ms | Single JOIN query |
| Add to Cart | < 300ms | Includes product validation |
| Update/Remove | < 200ms | Simple UPDATE/DELETE |
| Merge Carts | < 500ms | Multiple operations |

---

## Security

### Authentication
- JWT Bearer token required for all endpoints
- User ID extracted from token payload

### Authorization
- Users can only access their own carts
- Service layer validates cart ownership
- Throws `UnauthorizedCartAccessException` on mismatch

### Data Validation
- Product existence and status checked
- Quantity limits enforced (1-99)
- Price validation (> 0)
- SQL injection prevented (parameterized queries)

---

## Execution Plan

Following the **strict layer-by-layer execution** policy from Steering.md:

1. ✅ Requirements & Design → **Complete**
2. ⏳ Database Schema & Migrations → **Next**
3. ⏳ Repository Layer
4. ⏳ **Repository Audit (MANDATORY)**
5. ⏳ Service Layer
6. ⏳ **Service Audit (MANDATORY)**
7. ⏳ API Layer
8. ⏳ **API Audit (MANDATORY)**
9. ⏳ Documentation

**⚠️ Each layer must pass audit before proceeding to next layer**

---

## Success Criteria

### Functional
- ✅ All CRUD operations work correctly
- ✅ Cart totals calculated accurately
- ✅ Price snapshots preserved
- ✅ Merge carts works without data loss

### Non-Functional
- ✅ Performance targets met (< 300ms)
- ✅ Test coverage > 80%
- ✅ All audits passed (Repository, Service, API)
- ✅ API documentation complete

### Security
- ✅ Users can only access their own carts
- ✅ No SQL injection vulnerabilities
- ✅ Input validation on all endpoints

---

## Future Enhancements

### Phase 2
- Anonymous cart support (guest checkout)
- Cart expiration (auto-delete old carts)
- Stock validation (check inventory)
- Bulk operations (add multiple items)

### Phase 3
- Saved for later (wishlist integration)
- Cart sharing (share via link)
- Cart analytics (abandonment tracking)
- Price alerts (notify on price drops)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race conditions | Incorrect quantity | Database transactions + row locking |
| Orphaned carts | Database bloat | Cleanup job (delete old carts) |
| Product price changes | User confusion | Show "price changed" indicator |
| Deleted products | Broken cart items | Cascade delete or flag unavailable |

---

## Current Progress

### ✅ Phase 1: Database Schema & Migrations - Complete
- ✅ Created `carts` table migration
- ✅ Created `cart_items` table migration
- ✅ Created indexes (4 total)
- ✅ Created constraints (7 total)
- ✅ Created triggers (2 total)
- ✅ Created migration documentation

**Files Created:**
- `supabase/migrations/20260503110000_create_carts_table.sql`
- `supabase/migrations/20260503110100_create_cart_items_table.sql`
- `supabase/migrations/CART_MIGRATIONS_README.md`

---

## Next Steps

1. ✅ ~~Review and approve requirements and design documents~~ - Complete
2. ✅ ~~Create database migrations~~ - Complete
3. **Start Phase 2: Repository Layer** (Next)
   - Create entities (CartEntity, CartItemEntity)
   - Create repository interfaces
   - Implement repositories
   - Write unit tests (80%+ coverage)
   - **MANDATORY: Repository Audit**
4. **Follow strict layer-by-layer execution** with mandatory audits
5. **Run tests continuously** to maintain 80%+ coverage
6. **Document as you go** (JSDoc, README, API docs)

---

**Specification Status:** ✅ Complete  
**Phase 1 Status:** ✅ Complete (Database Schema)  
**Implementation Status:** 🟡 In Progress (20% complete)  
**Estimated Effort:** 2-3 days  
**Next Action:** Begin Phase 2 (Repository Layer) - Task 2.1

---

**Created:** 2026-05-03  
**Phase 1 Completed:** 2026-05-03  
**Author:** Kiro AI  
**Module:** Cart Management v1.0.0
