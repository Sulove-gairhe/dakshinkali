# Cart Module - Requirements Specification

**Module:** Cart Management  
**Version:** 1.0.0  
**Date:** 2026-05-03  
**Status:** Draft

---

## 1. Overview

The Cart Module provides shopping cart functionality for the Dakshinkali Electronics e-commerce platform. It allows users to add products to their cart, update quantities, remove items, and view their cart contents before proceeding to checkout.

---

## 2. Business Requirements

### 2.1 Core Functionality
- **BR-1:** Users must be able to add products to their shopping cart
- **BR-2:** Users must be able to update product quantities in their cart
- **BR-3:** Users must be able to remove products from their cart
- **BR-4:** Users must be able to view their complete cart with product details
- **BR-5:** Users must be able to clear their entire cart
- **BR-6:** Cart must persist across sessions for authenticated users
- **BR-7:** Cart must calculate and display total price automatically

### 2.2 Business Rules
- **BR-8:** Each user can have only one active cart at a time
- **BR-9:** Cart items must reference valid, active products
- **BR-10:** Quantity must be a positive integer (min: 1, max: 99)
- **BR-11:** Cart items for deleted/inactive products should be flagged
- **BR-12:** Cart should automatically update when product prices change
- **BR-13:** Anonymous users can have temporary carts (session-based)

---

## 3. Technical Requirements

### 3.1 Database Schema

#### 3.1.1 Cart Table
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,  -- For anonymous users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT carts_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);
```

#### 3.1.2 Cart Items Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_addition NUMERIC(10, 2) NOT NULL,  -- Snapshot of price when added
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0 AND quantity <= 99),
  CONSTRAINT cart_items_price_positive CHECK (price_at_addition > 0),
  UNIQUE(cart_id, product_id)  -- One entry per product per cart
);
```

### 3.2 Indexes
- **IDX-1:** Index on `carts.user_id` for fast user cart lookup
- **IDX-2:** Index on `carts.session_id` for anonymous cart lookup
- **IDX-3:** Index on `cart_items.cart_id` for cart item queries
- **IDX-4:** Index on `cart_items.product_id` for product reference checks
- **IDX-5:** Composite index on `(cart_id, product_id)` for uniqueness

### 3.3 API Endpoints

#### 3.3.1 Authenticated User Endpoints
- **POST /api/v1/cart/items** - Add item to cart
- **GET /api/v1/cart** - Get user's cart with items
- **PUT /api/v1/cart/items/:id** - Update item quantity
- **DELETE /api/v1/cart/items/:id** - Remove item from cart
- **DELETE /api/v1/cart** - Clear entire cart
- **POST /api/v1/cart/merge** - Merge anonymous cart with user cart (on login)

#### 3.3.2 Anonymous User Endpoints (Session-based)
- **POST /api/v1/cart/guest/items** - Add item to guest cart
- **GET /api/v1/cart/guest/:sessionId** - Get guest cart
- **PUT /api/v1/cart/guest/items/:id** - Update guest cart item
- **DELETE /api/v1/cart/guest/items/:id** - Remove guest cart item
- **DELETE /api/v1/cart/guest/:sessionId** - Clear guest cart

---

## 4. Functional Requirements

### 4.1 Add to Cart (FR-1)
- **Input:** Product ID, Quantity
- **Validation:**
  - Product must exist and be active
  - Quantity must be between 1 and 99
  - User must be authenticated OR have valid session
- **Behavior:**
  - If product already in cart, update quantity (add to existing)
  - If new product, create new cart item
  - Capture current product price as `price_at_addition`
  - Create cart if user doesn't have one
- **Output:** Updated cart with all items

### 4.2 Get Cart (FR-2)
- **Input:** User ID or Session ID
- **Validation:**
  - User must be authenticated OR provide valid session
- **Behavior:**
  - Retrieve cart with all items
  - Join with products table to get current product details
  - Calculate subtotal per item (quantity × price_at_addition)
  - Calculate total cart value
  - Flag items where product is deleted/inactive
- **Output:** Cart DTO with items, subtotals, and total

### 4.3 Update Cart Item (FR-3)
- **Input:** Cart Item ID, New Quantity
- **Validation:**
  - Cart item must exist and belong to user's cart
  - Quantity must be between 1 and 99
- **Behavior:**
  - Update quantity
  - Recalculate cart total
- **Output:** Updated cart

### 4.4 Remove Cart Item (FR-4)
- **Input:** Cart Item ID
- **Validation:**
  - Cart item must exist and belong to user's cart
- **Behavior:**
  - Delete cart item
  - If cart becomes empty, optionally delete cart
- **Output:** Updated cart or empty response

### 4.5 Clear Cart (FR-5)
- **Input:** User ID or Session ID
- **Validation:**
  - User must be authenticated OR provide valid session
- **Behavior:**
  - Delete all cart items
  - Optionally delete cart record
- **Output:** Success confirmation

### 4.6 Merge Carts (FR-6)
- **Input:** User ID, Session ID
- **Validation:**
  - User must be authenticated
  - Session cart must exist
- **Behavior:**
  - Retrieve anonymous cart by session ID
  - Retrieve user cart (or create if doesn't exist)
  - For each item in anonymous cart:
    - If product exists in user cart, add quantities (max 99)
    - If product doesn't exist, add to user cart
  - Delete anonymous cart
- **Output:** Merged user cart

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1:** Cart retrieval must complete within 200ms
- **NFR-2:** Add to cart must complete within 300ms
- **NFR-3:** Database queries must use indexes for all lookups
- **NFR-4:** Cart operations must support 1000+ concurrent users

### 5.2 Security
- **NFR-5:** Users can only access their own carts
- **NFR-6:** Session IDs must be cryptographically secure (UUID v4)
- **NFR-7:** Cart operations must validate product existence
- **NFR-8:** Price snapshots prevent price manipulation

### 5.3 Data Integrity
- **NFR-9:** Cart items must cascade delete when cart is deleted
- **NFR-10:** Cart items must cascade delete when product is deleted
- **NFR-11:** Quantity constraints must be enforced at database level
- **NFR-12:** One cart per user constraint must be enforced

### 5.4 Scalability
- **NFR-13:** Cart table must support millions of users
- **NFR-14:** Cart items table must support millions of items
- **NFR-15:** Anonymous carts must be cleaned up after 30 days

---

## 6. Architecture Requirements

### 6.1 Layered Architecture
- **AR-1:** Repository layer for data access (CartRepository, CartItemRepository)
- **AR-2:** Service layer for business logic (CartService)
- **AR-3:** Controller layer for HTTP handling (CartController)
- **AR-4:** DTO layer for request/response contracts

### 6.2 Supabase Integration
- **AR-5:** Use Supabase PostgreSQL for cart storage
- **AR-6:** Avoid tight coupling to Supabase schema via repository abstraction
- **AR-7:** Use connection pooling for database access
- **AR-8:** Use parameterized queries to prevent SQL injection

### 6.3 Testing
- **AR-9:** Unit tests for all layers (repositories, services, controllers)
- **AR-10:** Integration tests for API endpoints
- **AR-11:** Property-based tests for cart calculations
- **AR-12:** Test coverage must exceed 80%

---

## 7. Data Models

### 7.1 Cart Entity
```typescript
interface CartEntity {
  id: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.2 Cart Item Entity
```typescript
interface CartItemEntity {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  priceAtAddition: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7.3 Cart DTO (Response)
```typescript
interface CartDTO {
  id: string;
  userId: string | null;
  items: CartItemDTO[];
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtAddition: number;
  currentPrice: number;
  subtotal: number;
  isAvailable: boolean;  // false if product deleted/inactive
  priceChanged: boolean;  // true if currentPrice !== priceAtAddition
}
```

### 7.4 Request DTOs
```typescript
interface AddToCartRequest {
  productId: string;
  quantity: number;
}

interface UpdateCartItemRequest {
  quantity: number;
}

interface MergeCartRequest {
  sessionId: string;
}
```

---

## 8. Error Handling

### 8.1 Custom Exceptions
- **CartNotFoundException:** Cart not found for user/session
- **CartItemNotFoundException:** Cart item not found
- **InvalidQuantityException:** Quantity out of range (1-99)
- **ProductNotAvailableException:** Product deleted or inactive
- **UnauthorizedCartAccessException:** User trying to access another user's cart

### 8.2 HTTP Status Codes
- **200 OK:** Successful GET/PUT
- **201 Created:** Successful POST (add to cart)
- **204 No Content:** Successful DELETE
- **400 Bad Request:** Validation errors
- **401 Unauthorized:** Missing/invalid authentication
- **403 Forbidden:** Accessing another user's cart
- **404 Not Found:** Cart or cart item not found
- **409 Conflict:** Constraint violation

---

## 9. Dependencies

### 9.1 Internal Dependencies
- **Product Module:** Cart items reference products
- **Database Package:** Supabase client and configuration
- **Auth Middleware:** User authentication for protected endpoints

### 9.2 External Dependencies
- **Supabase:** PostgreSQL database
- **Express:** HTTP server framework
- **Zod:** Request validation

---

## 10. Acceptance Criteria

### 10.1 Repository Layer
- ✅ All CRUD operations implemented
- ✅ Efficient queries with proper indexing
- ✅ Unit tests with 80%+ coverage
- ✅ Repository audit passed

### 10.2 Service Layer
- ✅ Business logic implemented (add, update, remove, clear, merge)
- ✅ Price snapshot on add to cart
- ✅ Cart total calculation
- ✅ Product availability checks
- ✅ Unit tests with 80%+ coverage
- ✅ Service audit passed

### 10.3 API Layer
- ✅ All endpoints implemented
- ✅ Request/response validation
- ✅ Authentication/authorization
- ✅ Error handling
- ✅ Integration tests
- ✅ API documentation (OpenAPI spec)
- ✅ API audit passed

---

## 11. Out of Scope

- **Inventory management:** Not checking stock levels (future enhancement)
- **Coupon/discount codes:** Not part of cart module (future enhancement)
- **Wishlist functionality:** Separate module
- **Cart expiration:** Anonymous carts cleanup (future enhancement)
- **Multi-currency support:** Single currency only (NPR)

---

## 12. Success Metrics

- **SM-1:** Cart operations complete within performance targets
- **SM-2:** Zero unauthorized cart access incidents
- **SM-3:** Test coverage exceeds 80%
- **SM-4:** All audits passed (Repository, Service, API)
- **SM-5:** API documentation complete and accurate

---

**Requirements Approved:** Pending  
**Next Step:** Design Document
