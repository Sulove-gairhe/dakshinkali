# Requirements Document: Cart Module

## Introduction

The Cart Module provides shopping cart functionality for Dakshinkali Electronics Center's e-commerce platform. This module enables customers to add products to their cart, manage quantities, and prepare for checkout. The system supports both authenticated users (persistent carts tied to user accounts) and guest users (session-based carts), with the ability to merge guest carts when users log in. The module follows a layered architecture with DTO-based response patterns to ensure frontend independence from database schema changes, supporting the Next.js web client.

## Glossary

- **Cart_Module**: The complete shopping cart subsystem including API, service, repository, and DTO layers
- **Cart_API**: REST endpoints for cart operations accessible to both authenticated and guest users
- **Repository_Layer**: Data access layer that encapsulates all database operations using Supabase
- **Service_Layer**: Business logic layer that orchestrates repository operations and enforces business rules
- **API_Layer**: HTTP request handlers (controllers) that perform validation, authentication, and response formatting
- **DTO**: Data Transfer Object - structured response format that shields clients from database schema (server → client only)
- **Cart_Entity**: Database representation of a shopping cart in Supabase PostgreSQL
- **Cart_Item_Entity**: Database representation of an item within a cart
- **Cart_DTO**: API response representation of a cart with items for client consumption
- **Cart_Item_DTO**: API response representation of a single cart item
- **Supabase**: Backend-as-a-Service platform providing PostgreSQL database
- **Product_Module**: Existing module providing product data and validation
- **Session_ID**: Unique identifier for guest user carts (generated client-side or server-side)
- **User_ID**: Authenticated user identifier from Supabase Auth
- **Price_Snapshot**: Product price stored at the time of adding to cart (not referenced from product table)
- **Cart_Expiry**: Automatic cleanup mechanism for old guest carts
- **API_Version**: Versioned REST endpoint namespace (e.g., /api/v1) to support backward compatibility

## Requirements

### Requirement 1: Add Item to Cart

**User Story:** As a customer, I want to add products to my cart with a specified quantity, so that I can purchase multiple items together.

#### Acceptance Criteria

1. WHEN a customer submits a valid product ID and quantity, THE Cart_API SHALL add the item to the cart and return the updated Cart_DTO with HTTP 201
2. WHEN the product already exists in the cart, THE Service_Layer SHALL update the quantity by adding the new quantity to the existing quantity
3. THE Service_Layer SHALL validate that the product exists and is active using the Product_Module
4. THE Service_Layer SHALL validate that the requested quantity does not exceed available stock
5. THE Service_Layer SHALL store a Price_Snapshot of the product price at the time of adding (not a reference to the product table)
6. IF the quantity is less than 1, THEN THE Cart_API SHALL return validation errors with HTTP 400
7. IF the product does not exist or is inactive, THEN THE Cart_API SHALL return HTTP 404
8. IF the requested quantity exceeds available stock, THEN THE Cart_API SHALL return HTTP 400 with a descriptive error
9. THE Cart_API SHALL support both authenticated users (using User_ID) and guest users (using Session_ID)

### Requirement 2: Update Cart Item Quantity

**User Story:** As a customer, I want to change the quantity of items in my cart, so that I can adjust my order before checkout.

#### Acceptance Criteria

1. WHEN a customer submits a valid cart item ID and new quantity, THE Cart_API SHALL update the quantity and return the updated Cart_DTO with HTTP 200
2. THE Service_Layer SHALL validate that the cart item belongs to the customer's cart (by User_ID or Session_ID)
3. THE Service_Layer SHALL validate that the new quantity does not exceed available stock
4. IF the new quantity is 0, THEN THE Service_Layer SHALL remove the item from the cart
5. IF the new quantity is less than 0, THEN THE Cart_API SHALL return validation errors with HTTP 400
6. IF the cart item does not exist, THEN THE Cart_API SHALL return HTTP 404
7. IF the cart item belongs to a different user or session, THEN THE Cart_API SHALL return HTTP 403
8. THE Repository_Layer SHALL update the updated_at timestamp automatically

### Requirement 3: Remove Item from Cart

**User Story:** As a customer, I want to remove items from my cart, so that I can change my mind about purchases.

#### Acceptance Criteria

1. WHEN a customer requests to remove a cart item by ID, THE Cart_API SHALL delete the item and return HTTP 204
2. THE Service_Layer SHALL validate that the cart item belongs to the customer's cart (by User_ID or Session_ID)
3. IF the cart item does not exist, THEN THE Cart_API SHALL return HTTP 404
4. IF the cart item belongs to a different user or session, THEN THE Cart_API SHALL return HTTP 403
5. WHEN the last item is removed from a cart, THE Repository_Layer SHALL keep the empty cart record for future additions

### Requirement 4: Get Cart with Items and Totals

**User Story:** As a customer, I want to view my cart with all items and calculated totals, so that I can review my order before checkout.

#### Acceptance Criteria

1. WHEN a customer requests their cart, THE Cart_API SHALL return a Cart_DTO with all items and calculated totals with HTTP 200
2. THE Cart_DTO SHALL include: cart ID, items array, subtotal, item count, created timestamp, updated timestamp
3. THE Cart_Item_DTO SHALL include: item ID, product ID, product name, product image URL, quantity, unit price (snapshot), total price (quantity × unit price)
4. THE Service_Layer SHALL calculate the subtotal by summing all item total prices
5. THE Service_Layer SHALL calculate the item count by summing all item quantities
6. IF the customer has no cart, THEN THE Cart_API SHALL return an empty cart structure with HTTP 200
7. THE Cart_API SHALL support both authenticated users (using User_ID) and guest users (using Session_ID)
8. THE Service_Layer SHALL enrich cart items with current product information (name, image) from the Product_Module

### Requirement 5: Clear Cart

**User Story:** As a customer, I want to clear all items from my cart, so that I can start fresh with a new order.

#### Acceptance Criteria

1. WHEN a customer requests to clear their cart, THE Cart_API SHALL remove all items and return HTTP 204
2. THE Repository_Layer SHALL delete all cart items but keep the cart record
3. THE Service_Layer SHALL validate that the cart belongs to the customer (by User_ID or Session_ID)
4. IF the customer has no cart, THEN THE Cart_API SHALL return HTTP 204 (idempotent operation)

### Requirement 6: Merge Guest Cart with User Cart

**User Story:** As a customer, I want my guest cart items to be preserved when I log in, so that I don't lose items I added before authentication.

#### Acceptance Criteria

1. WHEN a user logs in with an existing guest cart (Session_ID) and user cart (User_ID), THE Cart_API SHALL merge the guest cart into the user cart
2. THE Service_Layer SHALL transfer all items from the guest cart to the user cart
3. WHEN the same product exists in both carts, THE Service_Layer SHALL add the quantities together
4. THE Service_Layer SHALL validate that merged quantities do not exceed available stock
5. WHEN the merge is complete, THE Repository_Layer SHALL delete the guest cart record
6. THE Cart_API SHALL return the merged Cart_DTO with HTTP 200
7. IF the user has no existing cart, THEN THE Service_Layer SHALL convert the guest cart to a user cart by updating the User_ID
8. IF only a guest cart exists (no user cart), THEN THE Service_Layer SHALL associate the guest cart with the User_ID

### Requirement 7: Cart Expiry for Guest Carts

**User Story:** As a system administrator, I want old guest carts to be automatically cleaned up, so that the database doesn't accumulate stale data.

#### Acceptance Criteria

1. THE Repository_Layer SHALL support querying carts older than a specified age (e.g., 30 days)
2. THE Service_Layer SHALL provide a method to delete expired guest carts (where Session_ID IS NOT NULL and updated_at < threshold)
3. THE Service_Layer SHALL NOT delete user carts (where User_ID IS NOT NULL) regardless of age
4. WHEN a guest cart is expired, THE Repository_Layer SHALL delete the cart and all associated cart items
5. THE Cart_Module SHALL support scheduled execution of cart expiry cleanup (implementation via cron job or scheduled function)

### Requirement 8: Stock Validation

**User Story:** As a customer, I want to be prevented from adding more items than are available, so that I don't experience checkout failures.

#### Acceptance Criteria

1. WHEN adding or updating cart items, THE Service_Layer SHALL validate current stock availability from the Product_Module
2. IF the requested quantity exceeds available stock, THEN THE Cart_API SHALL return HTTP 400 with error message "Requested quantity exceeds available stock (available: X)"
3. THE Service_Layer SHALL check stock before adding new items
4. THE Service_Layer SHALL check stock before updating item quantities
5. THE Service_Layer SHALL check stock during cart merge operations

### Requirement 9: Price Snapshot Strategy

**User Story:** As a business owner, I want cart prices to reflect the price at the time of adding to cart, so that customers see consistent pricing during their shopping session.

#### Acceptance Criteria

1. WHEN a product is added to the cart, THE Service_Layer SHALL store the current product price as a Price_Snapshot in the Cart_Item_Entity
2. THE Cart_Item_Entity SHALL NOT reference the product price directly (no foreign key to product price)
3. WHEN calculating cart totals, THE Service_Layer SHALL use the Price_Snapshot from cart items
4. THE Price_Snapshot SHALL remain unchanged even if the product price changes in the Product_Module
5. THE Cart_DTO SHALL display the Price_Snapshot for each item

### Requirement 10: DTO Layer Abstraction

**User Story:** As a developer, I want API responses to use DTOs instead of raw database entities, so that frontend clients are protected from database schema changes.

#### Acceptance Criteria

1. THE API_Layer SHALL transform all Cart_Entity and Cart_Item_Entity objects to Cart_DTO and Cart_Item_DTO before returning responses
2. THE Cart_DTO SHALL expose only client-relevant fields and hide internal database fields (e.g., internal IDs, Session_ID for authenticated users)
3. WHEN database schema changes, THE Repository_Layer SHALL adapt queries without requiring DTO changes
4. THE Cart_DTO SHALL use consistent field naming conventions (camelCase for JSON responses)
5. THE Cart_DTO SHALL include computed fields (subtotal, item count) that are not stored in the database
6. THE DTO mapping SHALL be unidirectional (Entity → DTO only) for API responses

### Requirement 11: Repository Layer Data Access

**User Story:** As a developer, I want all database operations encapsulated in the Repository Layer, so that business logic remains independent of database implementation.

#### Acceptance Criteria

1. THE Repository_Layer SHALL be the only layer that directly interacts with Supabase client
2. THE Service_Layer SHALL call repository methods and SHALL NOT access database directly
3. THE Repository_Layer SHALL handle all SQL query construction and execution
4. THE Repository_Layer SHALL map database rows to Cart_Entity and Cart_Item_Entity domain objects
5. WHEN database errors occur, THE Repository_Layer SHALL throw domain-specific exceptions (not database-specific errors)

### Requirement 12: Service Layer Business Logic

**User Story:** As a developer, I want business rules enforced in the Service Layer, so that validation and logic are centralized and reusable.

#### Acceptance Criteria

1. THE Service_Layer SHALL validate all business rules before calling Repository_Layer methods
2. THE Service_Layer SHALL orchestrate multi-step operations (e.g., stock validation + cart update)
3. THE Service_Layer SHALL handle transaction coordination for operations requiring multiple repository calls
4. THE Service_Layer SHALL transform repository exceptions into appropriate HTTP error responses
5. THE Service_Layer SHALL integrate with Product_Module for product validation and stock checks

### Requirement 13: Error Handling and Validation

**User Story:** As a client developer, I want consistent error responses with clear messages, so that I can handle errors appropriately in the UI.

#### Acceptance Criteria

1. WHEN validation fails, THE API_Layer SHALL return HTTP 400 with structured error details (field name, error message)
2. WHEN authentication is required but missing, THE API_Layer SHALL return HTTP 401 with a clear error message
3. WHEN authorization fails (accessing another user's cart), THE API_Layer SHALL return HTTP 403
4. WHEN a resource is not found, THE API_Layer SHALL return HTTP 404 with a descriptive message
5. WHEN server errors occur, THE API_Layer SHALL return HTTP 500 and log the error details without exposing internal implementation
6. THE error response format SHALL be consistent across all endpoints (e.g., { "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": [...] } })

### Requirement 14: Database Schema Design

**User Story:** As a developer, I want a well-structured cart schema, so that the system can efficiently store and query cart data.

#### Acceptance Criteria

1. THE Cart_Entity SHALL include fields: id (UUID), user_id (UUID, nullable, foreign key to auth.users), session_id (TEXT, nullable), created_at (timestamp), updated_at (timestamp)
2. THE Cart_Item_Entity SHALL include fields: id (UUID), cart_id (UUID, foreign key to carts), product_id (UUID, foreign key to products), quantity (INTEGER), price (NUMERIC), created_at (timestamp), updated_at (timestamp)
3. THE Repository_Layer SHALL enforce UNIQUE constraint on user_id (one cart per authenticated user)
4. THE Repository_Layer SHALL enforce UNIQUE constraint on session_id (one cart per guest session)
5. THE Repository_Layer SHALL enforce UNIQUE constraint on (cart_id, product_id) to prevent duplicate products in the same cart
6. THE Repository_Layer SHALL enforce CHECK constraint on quantity > 0
7. THE Repository_Layer SHALL use UUID for cart and cart item IDs to avoid enumeration attacks
8. THE price field SHALL be stored as NUMERIC type in the database for precision
9. THE Repository_Layer SHALL create indexes on user_id, session_id, and cart_id for query optimization
10. THE Repository_Layer SHALL enforce ON DELETE CASCADE for cart_items when a cart is deleted

### Requirement 15: Session and User Management

**User Story:** As a customer, I want my cart to persist across browser sessions, so that I can continue shopping later.

#### Acceptance Criteria

1. WHEN an authenticated user adds items to cart, THE Repository_Layer SHALL associate the cart with User_ID
2. WHEN a guest user adds items to cart, THE Repository_Layer SHALL associate the cart with Session_ID
3. THE Cart_API SHALL accept Session_ID from request headers or cookies for guest users
4. THE Cart_API SHALL use User_ID from JWT token for authenticated users
5. WHEN a user logs in, THE Cart_API SHALL provide a merge endpoint to combine guest and user carts
6. THE Service_Layer SHALL ensure that a user can have only one active cart at a time

### Requirement 16: API Versioning

**User Story:** As a developer, I want versioned API endpoints, so that we can evolve the API without breaking existing clients.

#### Acceptance Criteria

1. THE API_Layer SHALL expose all endpoints under the /api/v1 namespace
2. WHEN API changes are backward-incompatible, THE API_Layer SHALL create a new version namespace (e.g., /api/v2)
3. THE Cart_Module SHALL maintain support for previous API versions for at least 6 months after a new version is released
4. THE API responses SHALL include an API-Version header indicating the version used

### Requirement 17: Performance and Scalability

**User Story:** As a platform architect, I want the cart module to handle high traffic efficiently, so that the system remains responsive during peak shopping periods.

#### Acceptance Criteria

1. WHEN retrieving cart data, THE Repository_Layer SHALL use database indexes to optimize query performance
2. THE Repository_Layer SHALL use connection pooling for database access
3. THE Service_Layer SHALL implement rate limiting for cart operations to prevent abuse (max 60 requests per minute per user/session)
4. THE Repository_Layer SHALL use optimized JOIN queries to fetch cart with items in a single database round-trip
5. THE Cart_API SHALL support response caching headers (Cache-Control) for cart retrieval

## DTO Mapping Requirements

### Requirement 18: Cart DTO Mapping

**User Story:** As a developer, I want reliable mapping of Cart entities to DTOs, so that API responses are always correctly formatted.

#### Acceptance Criteria

1. WHEN a Cart_Entity with Cart_Item_Entity array is provided, THE Cart_DTO_Mapper SHALL map them into a valid Cart_DTO JSON object
2. WHEN an invalid Cart_Entity is provided (missing required fields), THE Cart_DTO_Mapper SHALL throw a descriptive error
3. THE Cart_DTO_Mapper SHALL handle null and optional fields correctly (e.g., user_id, session_id)
4. THE Cart_DTO_Mapper SHALL compute derived fields (subtotal, item count) from cart items
5. THE Cart_DTO_Mapper SHALL enrich cart items with product information (name, image URL) from Product_Module
6. THE mapping SHALL be unidirectional (Entity → DTO only) for API responses
7. THE Cart_DTO SHALL convert Date objects to ISO 8601 strings
8. THE Cart_Item_DTO SHALL include computed total_price (quantity × unit_price)

## Parser and Serializer Requirements

### Requirement 19: Cart Data Serialization

**User Story:** As a developer, I want cart data to be correctly serialized and deserialized, so that data integrity is maintained across API boundaries.

#### Acceptance Criteria

1. THE Cart_DTO_Mapper SHALL serialize Cart_Entity objects to JSON format
2. THE Cart_API SHALL parse incoming JSON request bodies to validated request objects
3. THE Cart_API SHALL validate request schemas using Zod or Joi before processing
4. FOR ALL valid Cart_DTO objects, serializing then deserializing SHALL produce an equivalent object (round-trip property)
5. THE Cart_API SHALL reject malformed JSON with HTTP 400 and descriptive error messages

## Notes

- This requirements document focuses on the core Cart Module functionality
- Future requirements may include: saved carts, cart sharing, cart recommendations, and cart abandonment tracking
- The layered architecture ensures that future enhancements can be added without breaking existing clients
- Migration impact: This is a new module, so no existing data migration is required
- The Cart Module depends on the Product Module for product validation and stock checks
- Cart expiry cleanup should be implemented as a scheduled job (e.g., daily cron job) outside the main API flow
