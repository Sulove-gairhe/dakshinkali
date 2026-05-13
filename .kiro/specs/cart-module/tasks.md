# Cart Module - Implementation Tasks

**Module:** Cart Management  
**Version:** 1.0.0  
**Date:** 2026-05-03  
**Status:** Backend implemented; live integration verification remains

## Senior Recovery Status (2026-05-03)

The original task list below was stale: several layers had been generated while the file still said "Pending", and the previous audit overstated readiness.

- Database migrations are consolidated to the `20260503100000` and `20260503100100` migration pair.
- Repository layer is implemented and unit-tested; `findWithItems` still needs real Supabase integration coverage.
- Service layer is implemented with owner-context validation and corrected merge quantity handling; focused service unit tests now pass.
- API layer is implemented with controller/routes and registered in `app.ts`.
- Swagger/OpenAPI includes the cart endpoints.
- Verification passes for `pnpm test`, `pnpm --filter @dakshinkali/api type-check`, and OpenAPI YAML parsing.
- Remaining before production: Supabase integration tests and manual endpoint verification with real auth/session flows.

The detailed task checklist below is historical and still contains stale "Pending" labels. Treat this recovery status and the steering status as authoritative until the full checklist is normalized.

---

## Execution Flow (MANDATORY)

Following the strict layer-by-layer execution policy from Steering.md:

1. ✅ **Requirements & Design** → Complete
2. ✅ **Database Schema & Migrations** → Complete
3. ⏳ **Repository Layer** → Next
4. ⏳ **Repository Audit** → MANDATORY
5. ⏳ **Service Layer** → After Repository Audit PASS
6. ⏳ **Service Audit** → MANDATORY
7. ⏳ **API Layer** → After Service Audit PASS
8. ⏳ **API Audit** → MANDATORY
9. ⏳ **Documentation** → Final step

---

## Phase 1: Database Schema & Migrations ✅

### Task 1.1: Create carts table migration
- **Status:** ✅ Complete
- **File:** `supabase/migrations/20260503110000_create_carts_table.sql`
- **Requirements:** BR-6, BR-8, BR-13, NFR-12
- **Completed:** 2026-05-03
- **Details:**
  - ✅ Created `carts` table with UUID primary key
  - ✅ Added `user_id` (UUID, nullable) for authenticated users
  - ✅ Added `session_id` (TEXT, nullable) for anonymous users
  - ✅ Added `created_at` and `updated_at` timestamps
  - ✅ Added CHECK constraint: either user_id OR session_id must be set
  - ✅ Added comments to table and columns
  - ✅ Created trigger for auto-updating `updated_at`

### Task 1.2: Create cart indexes
- **Status:** ✅ Complete
- **File:** `supabase/migrations/20260503110000_create_carts_table.sql` (same file)
- **Requirements:** NFR-1, NFR-4, NFR-13
- **Completed:** 2026-05-03
- **Details:**
  - ✅ Created partial index on `user_id` (WHERE user_id IS NOT NULL)
  - ✅ Created partial index on `session_id` (WHERE session_id IS NOT NULL)
  - ✅ Added comments to indexes

### Task 1.3: Create cart_items table migration
- **Status:** ✅ Complete
- **File:** `supabase/migrations/20260503110100_create_cart_items_table.sql`
- **Requirements:** BR-1, BR-10, NFR-8, NFR-9, NFR-10
- **Completed:** 2026-05-03
- **Details:**
  - ✅ Created `cart_items` table with UUID primary key
  - ✅ Added `cart_id` (UUID, NOT NULL, foreign key to carts)
  - ✅ Added `product_id` (UUID, NOT NULL, foreign key to products)
  - ✅ Added `quantity` (INTEGER, NOT NULL, default 1)
  - ✅ Added `price_snapshot` (NUMERIC(10,2), NOT NULL)
  - ✅ Added `created_at` and `updated_at` timestamps
  - ✅ Added CHECK constraint: quantity >= 1 AND quantity <= 99
  - ✅ Added CHECK constraint: price_snapshot > 0
  - ✅ Added UNIQUE constraint: (cart_id, product_id)
  - ✅ Added foreign key with ON DELETE CASCADE
  - ✅ Added comments to table and columns
  - ✅ Created trigger for auto-updating `updated_at`

### Task 1.4: Create cart_items indexes
- **Status:** ✅ Complete
- **File:** `supabase/migrations/20260503110100_create_cart_items_table.sql` (same file)
- **Requirements:** NFR-1, NFR-4
- **Completed:** 2026-05-03
- **Details:**
  - ✅ Created index on `cart_id`
  - ✅ Created index on `product_id`
  - ✅ Added comments to indexes

### Task 1.5: Create migration documentation
- **Status:** ✅ Complete
- **File:** `supabase/migrations/CART_MIGRATIONS_README.md`
- **Completed:** 2026-05-03
- **Details:**
  - ✅ Deployment instructions (local & production)
  - ✅ Verification queries (tables, indexes, constraints, triggers)
  - ✅ Test scripts for all constraints
  - ✅ Rollback instructions
  - ✅ Performance considerations
  - ✅ Security recommendations (RLS policies)

### Task 1.6: Test migrations locally
- **Status:** ⏳ Pending (Ready for deployment)
- **Requirements:** All database requirements
- **Details:**
  - Run migrations on local Supabase instance
  - Verify tables created with correct schema
  - Verify indexes created
  - Verify triggers work (updated_at auto-updates)
  - Verify constraints work (quantity range, uniqueness, CHECK)
  - Verify foreign key cascades work
  - Use verification queries from CART_MIGRATIONS_README.md

**Phase 1 Status:** ✅ Migration files complete, ready for deployment testing

---

## Phase 2: Repository Layer

### Task 2.1: Create Cart entity
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/entities/cart.entity.ts`
- **Requirements:** AR-1
- **Details:**
  - Define `CartEntity` interface
  - Map to database schema
  - Add JSDoc comments

### Task 2.2: Create CartItem entity
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/entities/cart-item.entity.ts`
- **Requirements:** AR-1
- **Details:**
  - Define `CartItemEntity` interface
  - Define `CartWithItemsEntity` aggregate
  - Define `CartItemWithProductEntity` for joined queries
  - Add JSDoc comments

### Task 2.3: Create CartRepository interface
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart.repository.ts`
- **Requirements:** AR-1, AR-6
- **Details:**
  - Define repository interface
  - Methods: create, findById, findByUserId, findBySessionId, findWithItems, update, delete
  - Add JSDoc comments with examples

### Task 2.4: Implement CartRepository
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart.repository.impl.ts`
- **Requirements:** AR-5, AR-7, AR-8, NFR-1
- **Details:**
  - Implement all repository methods
  - Use parameterized queries
  - Implement efficient JOIN query for findWithItems
  - Handle null cases gracefully
  - Add error handling
  - Add JSDoc comments

### Task 2.5: Create CartItemRepository interface
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart-item.repository.ts`
- **Requirements:** AR-1, AR-6
- **Details:**
  - Define repository interface
  - Methods: create, findById, findByCartId, findByCartAndProduct, updateQuantity, delete, deleteByCartId
  - Add JSDoc comments

### Task 2.6: Implement CartItemRepository
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart-item.repository.impl.ts`
- **Requirements:** AR-5, AR-7, AR-8, NFR-1
- **Details:**
  - Implement all repository methods
  - Use parameterized queries
  - Handle uniqueness constraint violations
  - Add error handling
  - Add JSDoc comments

### Task 2.7: Write CartRepository unit tests
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart.repository.impl.test.ts`
- **Requirements:** AR-9, AR-12
- **Details:**
  - Test create (user and session)
  - Test findById, findByUserId, findBySessionId
  - Test findWithItems (with JOIN)
  - Test update
  - Test delete
  - Test error cases (not found, constraint violations)
  - Mock Supabase client
  - Aim for 80%+ coverage

### Task 2.8: Write CartItemRepository unit tests
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/cart-item.repository.impl.test.ts`
- **Requirements:** AR-9, AR-12
- **Details:**
  - Test create
  - Test findById, findByCartId, findByCartAndProduct
  - Test updateQuantity
  - Test delete, deleteByCartId
  - Test uniqueness constraint (cart_id, product_id)
  - Test quantity constraint (1-99)
  - Mock Supabase client
  - Aim for 80%+ coverage

### Task 2.9: Create repository index file
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/repositories/index.ts`
- **Details:**
  - Export all repository interfaces and implementations

---

## Phase 3: Repository Audit (MANDATORY)

### Task 3.1: Perform Repository Audit
- **Status:** ⏳ Pending
- **File:** `.kiro/specs/cart-module/REPOSITORY_AUDIT.md`
- **Requirements:** All repository requirements
- **Details:**
  - ✅ Verify all CRUD operations implemented
  - ✅ Verify efficient queries with proper indexing
  - ✅ Verify parameterized queries (no SQL injection)
  - ✅ Verify error handling
  - ✅ Verify test coverage > 80%
  - ✅ Verify architecture compliance (loose coupling)
  - ✅ Identify scalability risks
  - ✅ Provide Go/No-Go decision

**⚠️ STOP HERE IF AUDIT = FAIL**

---

## Phase 4: Service Layer

### Task 4.1: Create custom exceptions
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/exceptions/`
- **Requirements:** Error handling requirements
- **Details:**
  - `cart-not-found.exception.ts`
  - `cart-item-not-found.exception.ts`
  - `invalid-quantity.exception.ts`
  - `product-not-available.exception.ts`
  - `unauthorized-cart-access.exception.ts`
  - `index.ts` (export all)

### Task 4.2: Create CartService interface
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/services/cart.service.ts`
- **Requirements:** AR-2
- **Details:**
  - Define service interface
  - Methods: addToCart, getCart, updateCartItem, removeCartItem, clearCart, mergeCarts
  - Add JSDoc comments with business logic descriptions

### Task 4.3: Implement CartService
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/services/cart.service.impl.ts`
- **Requirements:** FR-1 to FR-6, NFR-8
- **Details:**
  - Implement addToCart (with price snapshot)
  - Implement getCart (with totals calculation)
  - Implement updateCartItem (with authorization check)
  - Implement removeCartItem (with authorization check)
  - Implement clearCart
  - Implement mergeCarts (anonymous → authenticated)
  - Validate product availability
  - Calculate cart totals (subtotal, total, itemCount)
  - Handle edge cases (quantity max 99, product not found)
  - Add JSDoc comments

### Task 4.4: Write CartService unit tests
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/services/cart.service.impl.test.ts`
- **Requirements:** AR-9, AR-12
- **Details:**
  - Test addToCart (new product)
  - Test addToCart (existing product, add quantities)
  - Test addToCart (product not found)
  - Test addToCart (inactive product)
  - Test addToCart (quantity exceeds 99)
  - Test getCart (with items)
  - Test getCart (empty cart)
  - Test getCart (not found)
  - Test getCart (price changed indicator)
  - Test updateCartItem (success)
  - Test updateCartItem (unauthorized access)
  - Test removeCartItem (success)
  - Test clearCart
  - Test mergeCarts (no conflicts)
  - Test mergeCarts (with conflicts, add quantities)
  - Test mergeCarts (quantity cap at 99)
  - Test cart total calculation
  - Mock repositories
  - Aim for 80%+ coverage

### Task 4.5: Create service index file
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/services/index.ts`
- **Details:**
  - Export service interface and implementation

---

## Phase 5: Service Audit (MANDATORY)

### Task 5.1: Perform Service Audit
- **Status:** ⏳ Pending
- **File:** `.kiro/specs/cart-module/SERVICE_AUDIT.md`
- **Requirements:** All service requirements
- **Details:**
  - ✅ Verify all business logic implemented correctly
  - ✅ Verify price snapshot on add to cart
  - ✅ Verify cart total calculation accuracy
  - ✅ Verify product availability checks
  - ✅ Verify authorization checks
  - ✅ Verify merge cart logic (no data loss)
  - ✅ Verify error handling
  - ✅ Verify test coverage > 80%
  - ✅ Verify architecture compliance
  - ✅ Identify scalability risks
  - ✅ Provide Go/No-Go decision

**⚠️ STOP HERE IF AUDIT = FAIL**

---

## Phase 6: API Layer

### Task 6.1: Create DTOs
- **Status:** ⏳ Pending
- **Files:**
  - `apps/api/src/modules/cart/dto/add-to-cart.request.ts`
  - `apps/api/src/modules/cart/dto/update-cart-item.request.ts`
  - `apps/api/src/modules/cart/dto/merge-cart.request.ts`
  - `apps/api/src/modules/cart/dto/cart.dto.ts`
  - `apps/api/src/modules/cart/dto/cart-item.dto.ts`
  - `apps/api/src/modules/cart/dto/index.ts`
- **Requirements:** AR-4
- **Details:**
  - Define request DTOs with Zod validation
  - Define response DTOs
  - Add validation rules (quantity 1-99, UUID format)
  - Add JSDoc comments

### Task 6.2: Create CartController
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/controllers/cart.controller.ts`
- **Requirements:** AR-3, NFR-5
- **Details:**
  - Implement POST /api/v1/cart/items (add to cart)
  - Implement GET /api/v1/cart (get cart)
  - Implement PUT /api/v1/cart/items/:id (update quantity)
  - Implement DELETE /api/v1/cart/items/:id (remove item)
  - Implement DELETE /api/v1/cart (clear cart)
  - Implement POST /api/v1/cart/merge (merge carts)
  - Extract user ID from JWT (req.user.id)
  - Validate requests via DTOs
  - Handle errors and map to HTTP status codes
  - Add JSDoc comments

### Task 6.3: Create cart routes
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/routes/cart.routes.ts`
- **Requirements:** AR-3
- **Details:**
  - Define Express routes
  - Apply auth middleware to all routes
  - Apply rate limiting middleware
  - Wire up controller methods
  - Export router

### Task 6.4: Register cart routes in app
- **Status:** ⏳ Pending
- **File:** `apps/api/src/app.ts`
- **Details:**
  - Import cart routes
  - Register at `/api/v1/cart`

### Task 6.5: Write CartController unit tests
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/controllers/cart.controller.test.ts`
- **Requirements:** AR-9, AR-12
- **Details:**
  - Test POST /cart/items (success)
  - Test POST /cart/items (validation error)
  - Test POST /cart/items (product not found)
  - Test GET /cart (success)
  - Test GET /cart (not found)
  - Test PUT /cart/items/:id (success)
  - Test PUT /cart/items/:id (validation error)
  - Test PUT /cart/items/:id (unauthorized access)
  - Test DELETE /cart/items/:id (success)
  - Test DELETE /cart (success)
  - Test POST /cart/merge (success)
  - Mock service layer
  - Aim for 80%+ coverage

### Task 6.6: Write integration tests
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/__tests__/integration/cart-api.integration.test.ts`
- **Requirements:** AR-10
- **Details:**
  - Test end-to-end cart flow (add → update → remove → clear)
  - Test merge cart flow
  - Test authentication (missing token, invalid token)
  - Test authorization (accessing another user's cart)
  - Test database constraints (quantity, uniqueness)
  - Test rate limiting
  - Use real database (test instance)

### Task 6.7: Create controller index file
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/controllers/index.ts`
- **Details:**
  - Export controller

---

## Phase 7: API Audit (MANDATORY)

### Task 7.1: Perform API Layer Audit
- **Status:** ⏳ Pending
- **File:** `.kiro/specs/cart-module/API_LAYER_AUDIT.md`
- **Requirements:** All API requirements
- **Details:**
  - ✅ Verify all endpoints implemented
  - ✅ Verify request/response contracts
  - ✅ Verify authentication/authorization
  - ✅ Verify error handling (status codes, messages)
  - ✅ Verify validation rules
  - ✅ Verify test coverage > 80%
  - ✅ Verify integration tests pass
  - ✅ Verify architecture compliance
  - ✅ Verify security (no unauthorized access)
  - ✅ Verify performance targets met
  - ✅ Provide Go/No-Go decision

**⚠️ STOP HERE IF AUDIT = FAIL**

---

## Phase 8: Documentation

### Task 8.1: Update OpenAPI specification
- **Status:** ⏳ Pending
- **File:** `apps/api/docs/openapi.yaml`
- **Details:**
  - Add cart endpoints to spec
  - Define request/response schemas
  - Add examples (request/response bodies)
  - Document authentication requirements
  - Document error responses

### Task 8.2: Update API Quick Reference
- **Status:** ⏳ Pending
- **File:** `apps/api/docs/API_QUICK_REFERENCE.md`
- **Details:**
  - Add cart endpoints section
  - Provide cURL examples
  - Provide JavaScript/TypeScript examples
  - Document validation rules
  - Document error codes

### Task 8.3: Create Cart Module README
- **Status:** ⏳ Pending
- **File:** `apps/api/src/modules/cart/README.md`
- **Details:**
  - Module overview
  - Architecture diagram
  - Usage examples
  - API endpoints summary
  - Database schema
  - Testing instructions

### Task 8.4: Create completion summary
- **Status:** ⏳ Pending
- **File:** `.kiro/specs/cart-module/COMPLETION_SUMMARY.md`
- **Details:**
  - Executive summary
  - Completed work (all layers)
  - Audit trail
  - Architecture compliance
  - Security assessment
  - Performance metrics
  - Deployment readiness
  - Next steps

---

## Phase 9: Final Validation

### Task 9.1: Run all tests
- **Status:** ⏳ Pending
- **Details:**
  - Run unit tests: `npm test -- cart`
  - Run integration tests: `npm run test:integration -- cart`
  - Verify coverage > 80%
  - Fix any failing tests

### Task 9.2: Manual testing
- **Status:** ⏳ Pending
- **Details:**
  - Test all endpoints via Postman/Insomnia
  - Test authentication/authorization
  - Test error scenarios
  - Test edge cases (quantity limits, product deletion)
  - Verify response formats

### Task 9.3: Performance testing
- **Status:** ⏳ Pending
- **Details:**
  - Measure endpoint response times
  - Verify < 300ms for add to cart
  - Verify < 200ms for get cart
  - Test with 100+ concurrent requests

---

## Summary

**Total Tasks:** 40+  
**Completed Tasks:** 5 (Phase 1)  
**Estimated Effort:** 2-3 days  
**Dependencies:** Product Module (complete ✅)

**Phase Status:**
- ✅ Phase 1: Database Schema & Migrations (5/5 tasks complete)
- ⏳ Phase 2: Repository Layer (0/9 tasks)
- ⏳ Phase 3: Repository Audit (pending)
- ⏳ Phase 4: Service Layer (pending)
- ⏳ Phase 5: Service Audit (pending)
- ⏳ Phase 6: API Layer (pending)
- ⏳ Phase 7: API Audit (pending)
- ⏳ Phase 8: Documentation (pending)
- ⏳ Phase 9: Final Validation (pending)

**Critical Path:**
1. ✅ Database migrations → Complete
2. ⏳ Repository → Next
3. Each layer must pass audit before proceeding
4. Documentation and testing throughout

**Success Criteria:**
- ⏳ All layers implemented and tested
- ⏳ All audits passed (Repository, Service, API)
- ⏳ Test coverage > 80%
- ⏳ API documentation complete
- ⏳ Performance targets met

---

**Tasks Created:** 2026-05-03  
**Phase 1 Completed:** 2026-05-03  
**Current Status:** Ready for Phase 2 (Repository Layer)  
**Next Step:** Task 2.1 (Create Cart entity)
