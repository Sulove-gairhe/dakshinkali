# Cart Module - Design Document

**Module:** Cart Management  
**Version:** 1.0.0  
**Date:** 2026-05-03  
**Status:** Draft

---

## 1. Architecture Overview

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (HTTP)                      │
│  CartController - Handles HTTP requests/responses        │
│  - Authentication via JWT middleware                     │
│  - Request validation via DTOs                           │
│  - Response formatting                                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Service Layer (Business Logic)          │
│  CartService - Orchestrates cart operations              │
│  - Add to cart (with price snapshot)                     │
│  - Update quantity                                       │
│  - Remove items                                          │
│  - Calculate totals                                      │
│  - Merge carts (anonymous → authenticated)               │
│  - Validate product availability                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Repository Layer (Data Access)              │
│  CartRepository - Cart CRUD operations                   │
│  CartItemRepository - Cart item CRUD operations          │
│  - Parameterized queries                                 │
│  - Transaction support                                   │
│  - Efficient joins with products                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Database (Supabase PostgreSQL)          │
│  Tables: carts, cart_items                               │
│  Foreign Keys: cart_items → carts, cart_items → products│
└─────────────────────────────────────────────────────────┘
```

### 1.2 Module Dependencies

```
Cart Module
├── Product Module (dependency)
│   └── Products table (foreign key reference)
├── Database Package
│   ├── Supabase client
│   └── Connection pooling
└── Auth Middleware
    └── JWT validation
```

---

## 2. Database Design

### 2.1 Schema

#### Carts Table
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- NULL for anonymous carts
  session_id TEXT,  -- For anonymous users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure either user_id OR session_id is set, not both
  CONSTRAINT carts_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);
```

#### Cart Items Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_addition NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cart_items_quantity_range CHECK (quantity > 0 AND quantity <= 99),
  CONSTRAINT cart_items_price_positive CHECK (price_at_addition > 0),
  UNIQUE(cart_id, product_id)
);
```

### 2.2 Indexes

```sql
-- Fast user cart lookup
CREATE INDEX idx_carts_user_id ON carts(user_id) WHERE user_id IS NOT NULL;

-- Fast session cart lookup
CREATE INDEX idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;

-- Fast cart items lookup by cart
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Fast product reference checks
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Composite index for uniqueness (already enforced by UNIQUE constraint)
-- CREATE UNIQUE INDEX idx_cart_items_cart_product ON cart_items(cart_id, product_id);
```

### 2.3 Triggers

```sql
-- Auto-update updated_at on carts
CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on cart_items
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2.4 Relationships

```
carts (1) ──< (N) cart_items
cart_items (N) ──> (1) products
```

- **One-to-Many:** One cart has many cart items
- **Many-to-One:** Many cart items reference one product
- **Cascade Delete:** Deleting a cart deletes all its items
- **Cascade Delete:** Deleting a product deletes all cart items referencing it

---

## 3. Domain Models

### 3.1 Entities

#### CartEntity
```typescript
export interface CartEntity {
  id: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### CartItemEntity
```typescript
export interface CartItemEntity {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceAtAddition: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### CartWithItemsEntity (Aggregate)
```typescript
export interface CartWithItemsEntity extends CartEntity {
  items: CartItemWithProductEntity[];
}

export interface CartItemWithProductEntity extends CartItemEntity {
  product: {
    id: string;
    name: string;
    price: number;
    status: string;
    images: string[];
    deletedAt: Date | null;
  };
}
```

### 3.2 DTOs

#### Request DTOs
```typescript
export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  sessionId: string;
}
```

#### Response DTOs
```typescript
export interface CartDTO {
  id: string;
  userId: string | null;
  items: CartItemDTO[];
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productStatus: string;
  quantity: number;
  priceAtAddition: number;
  currentPrice: number;
  subtotal: number;
  isAvailable: boolean;
  priceChanged: boolean;
}
```

---

## 4. Repository Layer Design

### 4.1 CartRepository Interface

```typescript
export interface CartRepository {
  // Create
  create(userId: string | null, sessionId: string | null): Promise<CartEntity>;
  
  // Read
  findById(cartId: string): Promise<CartEntity | null>;
  findByUserId(userId: string): Promise<CartEntity | null>;
  findBySessionId(sessionId: string): Promise<CartEntity | null>;
  findWithItems(cartId: string): Promise<CartWithItemsEntity | null>;
  
  // Update
  update(cartId: string, data: Partial<CartEntity>): Promise<CartEntity>;
  
  // Delete
  delete(cartId: string): Promise<void>;
}
```

### 4.2 CartItemRepository Interface

```typescript
export interface CartItemRepository {
  // Create
  create(cartId: string, productId: string, quantity: number, price: number): Promise<CartItemEntity>;
  
  // Read
  findById(itemId: string): Promise<CartItemEntity | null>;
  findByCartId(cartId: string): Promise<CartItemEntity[]>;
  findByCartAndProduct(cartId: string, productId: string): Promise<CartItemEntity | null>;
  
  // Update
  updateQuantity(itemId: string, quantity: number): Promise<CartItemEntity>;
  
  // Delete
  delete(itemId: string): Promise<void>;
  deleteByCartId(cartId: string): Promise<void>;
}
```

### 4.3 Query Optimization

**Efficient Cart Retrieval with Items:**
```sql
SELECT 
  c.id, c.user_id, c.session_id, c.created_at, c.updated_at,
  ci.id as item_id, ci.product_id, ci.quantity, ci.price_at_addition,
  p.name, p.price, p.status, p.images, p.deleted_at
FROM carts c
LEFT JOIN cart_items ci ON ci.cart_id = c.id
LEFT JOIN products p ON p.id = ci.product_id
WHERE c.id = $1;
```

**Benefits:**
- Single query instead of N+1
- Uses indexes on cart_id and product_id
- Returns all data needed for CartDTO

---

## 5. Service Layer Design

### 5.1 CartService Interface

```typescript
export interface CartService {
  // Add to cart
  addToCart(userId: string | null, sessionId: string | null, productId: string, quantity: number): Promise<CartDTO>;
  
  // Get cart
  getCart(userId: string | null, sessionId: string | null): Promise<CartDTO | null>;
  
  // Update cart item
  updateCartItem(userId: string | null, sessionId: string | null, itemId: string, quantity: number): Promise<CartDTO>;
  
  // Remove cart item
  removeCartItem(userId: string | null, sessionId: string | null, itemId: string): Promise<CartDTO>;
  
  // Clear cart
  clearCart(userId: string | null, sessionId: string | null): Promise<void>;
  
  // Merge carts (anonymous → authenticated)
  mergeCarts(userId: string, sessionId: string): Promise<CartDTO>;
}
```

### 5.2 Business Logic

#### Add to Cart Flow
```
1. Validate product exists and is active
2. Get current product price
3. Find or create cart for user/session
4. Check if product already in cart
   - If yes: Update quantity (existing + new, max 99)
   - If no: Create new cart item
5. Save price_at_addition (price snapshot)
6. Return updated cart with totals
```

#### Get Cart Flow
```
1. Find cart by user_id or session_id
2. If not found, return null
3. Retrieve cart with items (joined with products)
4. For each item:
   - Calculate subtotal (quantity × price_at_addition)
   - Check if product available (not deleted, status active)
   - Check if price changed (current price ≠ price_at_addition)
5. Calculate cart total
6. Map to CartDTO
```

#### Merge Carts Flow
```
1. Find anonymous cart by session_id
2. Find or create user cart by user_id
3. For each item in anonymous cart:
   - Check if product exists in user cart
     - If yes: Add quantities (max 99)
     - If no: Create new item in user cart
4. Delete anonymous cart
5. Return merged user cart
```

### 5.3 Price Snapshot Strategy

**Why snapshot prices?**
- Prevents price manipulation (user can't change price in cart)
- Preserves price at time of adding to cart
- Allows showing "price changed" indicator to user
- Order creation uses snapshot price (fair to both parties)

**When to update snapshot?**
- On add to cart: Capture current price
- On quantity update: Keep existing snapshot
- On merge: Keep snapshot from source cart

---

## 6. API Layer Design

### 6.1 Endpoints

#### Authenticated User Endpoints

**POST /api/v1/cart/items**
- **Auth:** Required (JWT)
- **Body:** `AddToCartRequest`
- **Response:** `CartDTO`
- **Status:** 201 Created

**GET /api/v1/cart**
- **Auth:** Required (JWT)
- **Response:** `CartDTO`
- **Status:** 200 OK

**PUT /api/v1/cart/items/:id**
- **Auth:** Required (JWT)
- **Body:** `UpdateCartItemRequest`
- **Response:** `CartDTO`
- **Status:** 200 OK

**DELETE /api/v1/cart/items/:id**
- **Auth:** Required (JWT)
- **Response:** `CartDTO`
- **Status:** 200 OK

**DELETE /api/v1/cart**
- **Auth:** Required (JWT)
- **Response:** None
- **Status:** 204 No Content

**POST /api/v1/cart/merge**
- **Auth:** Required (JWT)
- **Body:** `MergeCartRequest`
- **Response:** `CartDTO`
- **Status:** 200 OK

#### Anonymous User Endpoints (Optional - Future Enhancement)

**Note:** For MVP, we'll focus on authenticated users only. Anonymous cart support can be added later.

### 6.2 Request Validation

```typescript
// Add to cart validation
const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

// Update cart item validation
const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

// Merge cart validation
const mergeCartSchema = z.object({
  sessionId: z.string().uuid(),
});
```

### 6.3 Error Responses

```typescript
// 404 Not Found
{
  "error": {
    "code": "CART_NOT_FOUND",
    "message": "Cart not found for user"
  }
}

// 404 Not Found
{
  "error": {
    "code": "CART_ITEM_NOT_FOUND",
    "message": "Cart item not found"
  }
}

// 400 Bad Request
{
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be between 1 and 99"
  }
}

// 400 Bad Request
{
  "error": {
    "code": "PRODUCT_NOT_AVAILABLE",
    "message": "Product is not available"
  }
}

// 403 Forbidden
{
  "error": {
    "code": "UNAUTHORIZED_CART_ACCESS",
    "message": "You do not have permission to access this cart"
  }
}
```

---

## 7. Security Design

### 7.1 Authentication
- **JWT Bearer Token:** Required for all authenticated endpoints
- **User ID Extraction:** From JWT payload (`req.user.id`)
- **Session ID:** Generated client-side (UUID v4), passed in request

### 7.2 Authorization
- **Cart Ownership:** Users can only access their own carts
- **Validation:** Service layer checks cart belongs to user before operations
- **Exception:** Throw `UnauthorizedCartAccessException` if mismatch

### 7.3 Data Validation
- **Product Existence:** Validate product exists before adding to cart
- **Product Status:** Only allow active products
- **Quantity Limits:** Enforce 1-99 range at API and DB level
- **Price Validation:** Ensure price > 0

---

## 8. Performance Optimization

### 8.1 Database Optimization
- **Indexes:** All foreign keys and lookup columns indexed
- **Single Query:** Retrieve cart with items in one query (JOIN)
- **Connection Pooling:** Reuse database connections
- **Partial Indexes:** Index only non-null user_id and session_id

### 8.2 Caching Strategy (Future Enhancement)
- **User Cart:** Cache cart in Redis (TTL: 5 minutes)
- **Invalidation:** Clear cache on cart modifications
- **Benefits:** Reduce database load for frequent cart views

### 8.3 Query Performance Targets
- **Get Cart:** < 200ms
- **Add to Cart:** < 300ms
- **Update/Remove:** < 200ms
- **Merge Carts:** < 500ms

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Repository Layer:**
- ✅ Create cart (user and session)
- ✅ Find cart by user_id, session_id, id
- ✅ Find cart with items (joined query)
- ✅ Update cart
- ✅ Delete cart
- ✅ Create cart item
- ✅ Find cart items by cart_id
- ✅ Update cart item quantity
- ✅ Delete cart item

**Service Layer:**
- ✅ Add to cart (new product)
- ✅ Add to cart (existing product, update quantity)
- ✅ Add to cart (product not found)
- ✅ Add to cart (inactive product)
- ✅ Get cart (with items)
- ✅ Get cart (empty cart)
- ✅ Get cart (not found)
- ✅ Update cart item quantity
- ✅ Update cart item (not found)
- ✅ Update cart item (unauthorized access)
- ✅ Remove cart item
- ✅ Clear cart
- ✅ Merge carts (no conflicts)
- ✅ Merge carts (with conflicts, add quantities)
- ✅ Calculate cart totals correctly

**Controller Layer:**
- ✅ POST /cart/items (success)
- ✅ POST /cart/items (validation error)
- ✅ GET /cart (success)
- ✅ GET /cart (not found)
- ✅ PUT /cart/items/:id (success)
- ✅ DELETE /cart/items/:id (success)
- ✅ DELETE /cart (success)
- ✅ POST /cart/merge (success)

### 9.2 Integration Tests
- ✅ End-to-end cart flow (add → update → remove → clear)
- ✅ Merge cart flow (anonymous → authenticated)
- ✅ Authentication/authorization checks
- ✅ Database constraints (quantity, uniqueness)

### 9.3 Property-Based Tests
- ✅ Cart total calculation correctness
- ✅ Quantity constraints (1-99)
- ✅ Price snapshot immutability

---

## 10. Migration Strategy

### 10.1 Database Migrations

**Migration 1: Create carts table**
```sql
-- File: supabase/migrations/20260503_create_carts_table.sql
CREATE TABLE carts (...);
CREATE INDEX idx_carts_user_id ...;
CREATE INDEX idx_carts_session_id ...;
CREATE TRIGGER update_carts_updated_at ...;
```

**Migration 2: Create cart_items table**
```sql
-- File: supabase/migrations/20260503_create_cart_items_table.sql
CREATE TABLE cart_items (...);
CREATE INDEX idx_cart_items_cart_id ...;
CREATE INDEX idx_cart_items_product_id ...;
CREATE TRIGGER update_cart_items_updated_at ...;
```

### 10.2 Rollback Strategy
- **Drop tables in reverse order:** cart_items → carts
- **Foreign key constraints:** Ensure cascade deletes work
- **Backup:** Take database snapshot before migration

---

## 11. Documentation

### 11.1 API Documentation
- **OpenAPI Spec:** Add cart endpoints to `apps/api/docs/openapi.yaml`
- **Quick Reference:** Update `apps/api/docs/API_QUICK_REFERENCE.md`
- **Examples:** Provide cURL and JavaScript examples

### 11.2 Code Documentation
- **JSDoc:** Document all public methods
- **README:** Create `apps/api/src/modules/cart/README.md`
- **Usage Examples:** Provide code snippets for common operations

---

## 12. Future Enhancements

### 12.1 Phase 2 Features
- **Anonymous Cart Support:** Full guest checkout flow
- **Cart Expiration:** Auto-delete old anonymous carts (30 days)
- **Stock Validation:** Check product inventory before add to cart
- **Quantity Limits:** Per-product max quantity rules
- **Bulk Operations:** Add multiple items at once

### 12.2 Phase 3 Features
- **Saved for Later:** Move items to wishlist
- **Cart Sharing:** Share cart via link
- **Cart Analytics:** Track cart abandonment rates
- **Price Alerts:** Notify when price drops for cart items

---

## 13. Risks and Mitigations

### 13.1 Risks

**Risk 1: Race Conditions**
- **Scenario:** Two requests update same cart item simultaneously
- **Impact:** Incorrect quantity
- **Mitigation:** Use database transactions and row-level locking

**Risk 2: Orphaned Carts**
- **Scenario:** User never completes checkout
- **Impact:** Database bloat
- **Mitigation:** Implement cart cleanup job (delete carts older than 30 days)

**Risk 3: Product Price Changes**
- **Scenario:** Product price changes after adding to cart
- **Impact:** User confusion
- **Mitigation:** Show "price changed" indicator, use snapshot price for orders

**Risk 4: Deleted Products in Cart**
- **Scenario:** Product deleted while in user's cart
- **Impact:** Cart item references non-existent product
- **Mitigation:** Cascade delete cart items when product deleted, or flag as unavailable

---

## 14. Success Criteria

### 14.1 Functional
- ✅ All CRUD operations work correctly
- ✅ Cart totals calculated accurately
- ✅ Price snapshots preserved
- ✅ Merge carts works without data loss

### 14.2 Non-Functional
- ✅ Performance targets met (< 300ms)
- ✅ Test coverage > 80%
- ✅ All audits passed (Repository, Service, API)
- ✅ API documentation complete

### 14.3 Security
- ✅ Users can only access their own carts
- ✅ No SQL injection vulnerabilities
- ✅ Input validation on all endpoints

---

**Design Approved:** Pending  
**Next Step:** Implementation (Repository Layer)
