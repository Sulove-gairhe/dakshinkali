# Requirements Document: Product Module

## Introduction

The Product Module provides the core product management capabilities for Dakshinkali Electronics Center's e-commerce platform. This module enables administrators to manage product inventory through CRUD operations while providing public APIs for customers to browse and view product details. The system follows a layered architecture with DTO-based response patterns to ensure frontend independence from database schema changes, supporting both web (Next.js) and mobile (Flutter) clients.

## Glossary

- **Product_Module**: The complete product management subsystem including API, service, repository, and DTO layers
- **Admin_API**: REST endpoints accessible only to authenticated administrators for product management
- **Public_API**: REST endpoints accessible without authentication for product browsing
- **Repository_Layer**: Data access layer that encapsulates all database operations using Supabase
- **Service_Layer**: Business logic layer that orchestrates repository operations and enforces business rules
- **API_Layer**: HTTP request handlers (controllers) that perform validation, authentication, and response formatting
- **DTO**: Data Transfer Object - structured response format that shields clients from database schema (server → client only)
- **Product_Entity**: Database representation of a product in Supabase PostgreSQL
- **Product_DTO**: API response representation of a product for client consumption
- **Product_Status**: Enum type defining product availability states: "active" | "inactive" | "out_of_stock"
- **Supabase**: Backend-as-a-Service platform providing PostgreSQL database and file storage
- **Image_Storage**: Supabase Storage bucket for product images
- **API_Version**: Versioned REST endpoint namespace (e.g., /api/v1) to support backward compatibility
- **Soft_Delete**: Deletion strategy using deleted_at timestamp to mark records as deleted without physical removal

## Requirements

### Requirement 1: Product Creation (Admin)

**User Story:** As an administrator, I want to create new products with details and images, so that customers can browse and purchase them.

#### Acceptance Criteria

1. WHEN an authenticated admin submits valid product data, THE Admin_API SHALL create a Product_Entity in the database and return a Product_DTO with HTTP 201
2. WHEN product data includes image files, THE Admin_API SHALL upload images to Image_Storage and store references in Product_Entity
3. IF product data is invalid (missing required fields, invalid price), THEN THE Admin_API SHALL return validation errors with HTTP 400
4. IF the admin is not authenticated, THEN THE Admin_API SHALL return HTTP 401
5. THE Service_Layer SHALL validate that product names are unique within the same category
6. THE Repository_Layer SHALL generate a unique product ID and timestamp for creation
7. THE Product_Entity SHALL be created with status set to "active" by default

### Requirement 2: Product Retrieval (Admin)

**User Story:** As an administrator, I want to view all products with filtering and pagination, so that I can manage inventory efficiently.

#### Acceptance Criteria

1. WHEN an authenticated admin requests products, THE Admin_API SHALL return a paginated list of Product_DTOs
2. WHERE filtering is specified (category, price range, status), THE Repository_Layer SHALL apply filters to the query
3. THE Admin_API SHALL support pagination with configurable page size (default 20, max 100)
4. THE Admin_API SHALL return total count metadata for pagination UI
5. WHEN requesting a single product by ID, THE Admin_API SHALL return the complete Product_DTO or HTTP 404 if not found

### Requirement 3: Product Update (Admin)

**User Story:** As an administrator, I want to update product details and images, so that I can keep product information accurate and current.

#### Acceptance Criteria

1. WHEN an authenticated admin submits valid update data for an existing product, THE Admin_API SHALL update the Product_Entity and return the updated Product_DTO
2. WHEN new images are uploaded during update, THE Admin_API SHALL upload to Image_Storage and update references
3. WHEN images are removed during update, THE Admin_API SHALL delete files from Image_Storage
4. IF the product does not exist, THEN THE Admin_API SHALL return HTTP 404
5. THE Service_Layer SHALL validate that updated product names remain unique within the category
6. THE Repository_Layer SHALL update the modified timestamp automatically

### Requirement 4: Product Deletion (Admin)

**User Story:** As an administrator, I want to soft-delete products, so that historical order data remains intact while hiding products from customers.

#### Acceptance Criteria

1. WHEN an authenticated admin deletes a product, THE Admin_API SHALL mark the Product_Entity as deleted (soft delete) rather than removing it
2. THE Repository_Layer SHALL set a deleted_at timestamp and preserve all product data
3. WHEN a product is soft-deleted, THE Public_API SHALL exclude it from all listing and detail queries
4. THE Admin_API SHALL allow viewing soft-deleted products with a special filter parameter
5. IF the product does not exist, THEN THE Admin_API SHALL return HTTP 404

### Requirement 5: Product Listing (Public)

**User Story:** As a customer, I want to browse available products with filtering and search, so that I can find products I want to purchase.

#### Acceptance Criteria

1. THE Public_API SHALL return paginated lists of Product_DTOs for non-deleted products without requiring authentication
2. WHERE search query is provided, THE Repository_Layer SHALL search product names and descriptions
3. WHERE category filter is provided, THE Repository_Layer SHALL filter by category
4. WHERE price range is provided, THE Repository_Layer SHALL filter by minimum and maximum price
5. THE Public_API SHALL support sorting by price (ascending/descending), name, and creation date
6. THE Public_API SHALL return only products with status "active" and deleted_at IS NULL

### Requirement 6: Product Detail (Public)

**User Story:** As a customer, I want to view detailed information about a specific product, so that I can make informed purchase decisions.

#### Acceptance Criteria

1. WHEN a valid product ID is requested, THE Public_API SHALL return the complete Product_DTO without requiring authentication
2. IF the product has deleted_at IS NOT NULL, THEN THE Public_API SHALL return HTTP 404
3. IF the product status is not "active", THEN THE Public_API SHALL return HTTP 404
4. IF the product ID does not exist, THEN THE Public_API SHALL return HTTP 404
5. THE Product_DTO SHALL include all product details, image URLs, pricing, and availability status

### Requirement 7: DTO Layer Abstraction

**User Story:** As a developer, I want API responses to use DTOs instead of raw database entities, so that frontend clients are protected from database schema changes.

#### Acceptance Criteria

1. THE API_Layer SHALL transform all Product_Entity objects to Product_DTO before returning responses
2. THE Product_DTO SHALL expose only client-relevant fields and hide internal database fields (e.g., internal IDs, audit fields)
3. WHEN database schema changes, THE Repository_Layer SHALL adapt queries without requiring DTO changes
4. THE Product_DTO SHALL use consistent field naming conventions (camelCase for JSON responses)
5. THE Product_DTO SHALL include computed fields (e.g., full image URLs) that are not stored in the database
6. THE DTO mapping SHALL be unidirectional (Entity → DTO only) for API responses

### Requirement 8: Repository Layer Data Access

**User Story:** As a developer, I want all database operations encapsulated in the Repository Layer, so that business logic remains independent of database implementation.

#### Acceptance Criteria

1. THE Repository_Layer SHALL be the only layer that directly interacts with Supabase client
2. THE Service_Layer SHALL call repository methods and SHALL NOT access database directly
3. THE Repository_Layer SHALL handle all SQL query construction and execution
4. THE Repository_Layer SHALL map database rows to Product_Entity domain objects
5. WHEN database errors occur, THE Repository_Layer SHALL throw domain-specific exceptions (not database-specific errors)

### Requirement 9: Service Layer Business Logic

**User Story:** As a developer, I want business rules enforced in the Service Layer, so that validation and logic are centralized and reusable.

#### Acceptance Criteria

1. THE Service_Layer SHALL validate all business rules before calling Repository_Layer methods
2. THE Service_Layer SHALL orchestrate multi-step operations (e.g., image upload + database insert)
3. THE Service_Layer SHALL handle transaction coordination for operations requiring multiple repository calls
4. THE Service_Layer SHALL transform repository exceptions into appropriate HTTP error responses
5. THE Service_Layer SHALL enforce authorization rules (admin-only operations)

### Requirement 10: API Versioning

**User Story:** As a developer, I want versioned API endpoints, so that we can evolve the API without breaking existing clients.

#### Acceptance Criteria

1. THE API_Layer SHALL expose all endpoints under the /api/v1 namespace
2. WHEN API changes are backward-incompatible, THE API_Layer SHALL create a new version namespace (e.g., /api/v2)
3. THE Product_Module SHALL maintain support for previous API versions for at least 6 months after a new version is released
4. THE API responses SHALL include an API-Version header indicating the version used

### Requirement 11: Image Storage Integration

**User Story:** As an administrator, I want product images stored securely and served efficiently, so that customers can view high-quality product photos.

#### Acceptance Criteria

1. WHEN images are uploaded, THE Service_Layer SHALL upload files to Supabase Image_Storage
2. THE Service_Layer SHALL generate unique filenames to prevent collisions
3. THE Service_Layer SHALL validate image file types (JPEG, PNG, WebP) and size limits (max 5MB per image)
4. THE Product_DTO SHALL include full public URLs for all product images
5. WHEN products are deleted, THE Service_Layer SHALL optionally retain images for audit purposes or delete them based on configuration

### Requirement 12: Error Handling and Validation

**User Story:** As a client developer, I want consistent error responses with clear messages, so that I can handle errors appropriately in the UI.

#### Acceptance Criteria

1. WHEN validation fails, THE API_Layer SHALL return HTTP 400 with structured error details (field name, error message)
2. WHEN authentication fails, THE API_Layer SHALL return HTTP 401 with a clear error message
3. WHEN authorization fails (non-admin accessing admin endpoints), THE API_Layer SHALL return HTTP 403
4. WHEN a resource is not found, THE API_Layer SHALL return HTTP 404 with a descriptive message
5. WHEN server errors occur, THE API_Layer SHALL return HTTP 500 and log the error details without exposing internal implementation
6. THE error response format SHALL be consistent across all endpoints (e.g., { "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": [...] } })

### Requirement 13: Database Schema Design

**User Story:** As a developer, I want a well-structured product schema, so that the system can efficiently store and query product data.

#### Acceptance Criteria

1. THE Product_Entity SHALL include fields: id (UUID), name (text), description (text), price (numeric), category (text), status (Product_Status enum), created_at (timestamp), updated_at (timestamp), deleted_at (nullable timestamp)
2. THE Product_Status enum SHALL be defined as: "active" | "inactive" | "out_of_stock"
3. THE Product_Entity SHALL include an images field (JSON array) storing image references
4. THE Repository_Layer SHALL create indexes on frequently queried fields (category, status, created_at, deleted_at)
5. THE Repository_Layer SHALL enforce NOT NULL constraints on required fields (name, price, status)
6. THE Repository_Layer SHALL use UUID for product IDs to avoid enumeration attacks
7. THE price field SHALL be stored as numeric type in the database for precision

### Requirement 14: Multi-Client Compatibility

**User Story:** As a platform architect, I want the API to work seamlessly with both web and mobile clients, so that we can support multiple frontend applications.

#### Acceptance Criteria

1. THE Product_DTO SHALL use standard JSON format compatible with both Next.js and Flutter HTTP clients
2. THE API responses SHALL include appropriate CORS headers for web client access
3. THE API responses SHALL use ISO 8601 format for all timestamps
4. THE API responses SHALL return price as a number type in JSON
5. THE Product_Module SHALL support both REST API access and future GraphQL integration without requiring DTO changes

### Requirement 15: Performance and Scalability

**User Story:** As a platform architect, I want the product module to handle high traffic efficiently, so that the system remains responsive as the business grows.

#### Acceptance Criteria

1. WHEN listing products, THE Repository_Layer SHALL use database indexes to optimize query performance
2. THE Public_API SHALL support response caching headers (ETag, Cache-Control) for product listings and details
3. THE Repository_Layer SHALL use connection pooling for database access
4. WHEN paginating large result sets, THE Repository_Layer SHALL use cursor-based pagination for better performance than offset-based
5. THE Service_Layer SHALL implement rate limiting for admin endpoints to prevent abuse (max 100 requests per minute per admin)

## DTO Mapping Requirements

### Requirement 16: Product DTO Mapping

**User Story:** As a developer, I want reliable mapping of Product entities to DTOs, so that API responses are always correctly formatted.

#### Acceptance Criteria

1. WHEN a Product_Entity is provided, THE Product_DTO_Mapper SHALL map it into a valid Product_DTO JSON object
2. WHEN an invalid Product_Entity is provided (missing required fields), THE Product_DTO_Mapper SHALL throw a descriptive error
3. THE Product_DTO_Mapper SHALL handle null and optional fields correctly (e.g., deleted_at, description)
4. THE Product_DTO_Mapper SHALL compute derived fields (e.g., full image URLs from storage references)
5. THE mapping SHALL be unidirectional (Entity → DTO only) for API responses

## Notes

- This requirements document focuses on the core Product Module functionality
- Future requirements may include: inventory tracking, product variants (size, color), bulk import/export, product reviews, and multi-vendor support
- The layered architecture ensures that future enhancements can be added without breaking existing clients
- Migration impact: This is a new module, so no existing data migration is required
