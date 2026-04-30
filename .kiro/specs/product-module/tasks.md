# Implementation Plan: Product Module

## Overview

This implementation plan converts the Product Module design into actionable coding tasks. The module implements a layered REST API architecture (API Layer → Service Layer → Repository Layer) for managing product inventory with full CRUD operations for admins and read-only access for public users.

**Key Implementation Principles:**
- Build from bottom-up: Database → Repository → Service → API
- Test each layer before moving to the next
- Use TypeScript for type safety across all layers
- Follow DTO pattern for API responses (Entity → DTO only)
- Implement property-based tests alongside unit tests

**Technology Stack:**
- Language: TypeScript
- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Testing: Jest/Vitest + fast-check (property-based testing)
- Validation: Zod or Joi

## Tasks

### 1. Database Schema and Infrastructure Setup

- [x] 1.1 Create products table schema with all required fields
  - Create migration file for products table
  - Define columns: id (UUID), name (TEXT), description (TEXT), price (NUMERIC), category (TEXT), status (TEXT with CHECK constraint), images (JSONB), created_at, updated_at, deleted_at
  - Add CHECK constraint for price > 0
  - Add CHECK constraint for status enum ('active', 'inactive', 'out_of_stock')
  - Set default values: id (gen_random_uuid()), images ('[]'::jsonb), timestamps (NOW())
  - _Requirements: 13.1, 13.5, 13.7_

- [x] 1.2 Create database indexes for query optimization
  - Create partial index on category (WHERE deleted_at IS NULL)
  - Create partial index on status (WHERE deleted_at IS NULL)
  - Create partial index on created_at DESC (WHERE deleted_at IS NULL)
  - Create partial index on deleted_at (WHERE deleted_at IS NOT NULL)
  - Create partial index on price (WHERE deleted_at IS NULL)
  - Create GIN index for full-text search on name and description
  - Create unique partial index on (name, category) WHERE deleted_at IS NULL
  - _Requirements: 13.4, 13.6_

- [x] 1.3 Create database trigger for auto-updating updated_at timestamp
  - Create update_updated_at_column() function in PL/pgSQL
  - Create BEFORE UPDATE trigger on products table
  - _Requirements: 13.1_

- [x] 1.4 Set up Supabase configuration and connection
  - Create supabase.config.ts with connection settings
  - Configure connection pooling for performance
  - Create storage.config.ts for Supabase Storage bucket configuration
  - _Requirements: 15.3_

- [ ]* 1.5 Write smoke tests for database schema
  - Verify products table exists with all required columns
  - Verify all indexes exist (category, status, created_at, deleted_at, price, search, unique constraint)
  - Verify ProductStatus CHECK constraint values
  - Verify connection pooling is configured
  - _Requirements: 13.1, 13.4_

### 2. Domain Models and Type Definitions

- [x] 2.1 Create ProductEntity domain model
  - Define ProductEntity interface with all fields (id, name, description, price, category, status, images, createdAt, updatedAt, deletedAt)
  - Define ProductStatus type ('active' | 'inactive' | 'out_of_stock')
  - Define ProductImage interface (id, url, filename, order)
  - Create product.entity.ts in entities folder
  - _Requirements: 13.1, 13.2_

- [x] 2.2 Create ProductDTO for API responses
  - Define ProductDTO interface (excludes deletedAt, uses ISO 8601 strings for dates)
  - Define ProductImageDTO interface (id, url, order)
  - Create product.dto.ts in dto folder
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 2.3 Create request schemas for API endpoints
  - Define CreateProductRequest interface with validation rules
  - Define UpdateProductRequest interface with optional fields
  - Define AdminListQuery interface with pagination and filters
  - Define PublicListQuery interface with sorting options
  - Create create-product.request.ts and update-product.request.ts in dto folder
  - _Requirements: 1.1, 1.3, 2.1, 3.1, 5.1_

- [x] 2.4 Create shared types and interfaces
  - Define Pagination interface (page, pageSize)
  - Define PaginatedResult<T> interface (data, total, page, pageSize, totalPages)
  - Define ProductFilters and PublicProductFilters interfaces
  - Define RepositoryFilters interface
  - Create product.types.ts in types folder
  - _Requirements: 2.3, 2.4, 5.1_

- [ ]* 2.5 Write property test for DTO CamelCase naming convention
  - **Property 5: DTO CamelCase Naming Convention**
  - **Validates: Requirements 7.4**
  - Generate random ProductDTO objects
  - Verify all field names follow camelCase convention
  - Tag: `Feature: product-module, Property 5: DTO CamelCase Naming Convention`

### 3. Repository Layer Implementation

- [x] 3.1 Implement ProductRepository interface
  - Create product.repository.ts in repositories folder
  - Define ProductRepository interface with all methods (insert, update, softDelete, findById, findAll, existsByNameAndCategory)
  - _Requirements: 8.1, 8.3_

- [x] 3.2 Implement insert method with row-to-entity mapping
  - Write INSERT query with parameterized values
  - Map database row to ProductEntity
  - Handle JSONB parsing for images field
  - Parse numeric price to number type
  - Parse timestamps to Date objects
  - _Requirements: 1.6, 8.4_

- [x] 3.3 Implement findById and findAll methods with filtering
  - Write SELECT query with optional filters (category, status, price range, search)
  - Implement soft delete filtering (WHERE deleted_at IS NULL)
  - Support includeDeleted parameter for admin queries
  - Implement pagination with LIMIT and OFFSET
  - Map all rows to ProductEntity array
  - _Requirements: 2.2, 5.2, 5.3, 5.4, 8.4_

- [x] 3.4 Implement update and softDelete methods
  - Write UPDATE query for partial updates
  - Write UPDATE query for soft delete (SET deleted_at = NOW())
  - Handle database-specific errors and translate to domain exceptions
  - _Requirements: 3.1, 4.1, 4.2, 8.5_

- [x] 3.5 Implement existsByNameAndCategory for uniqueness check
  - Write EXISTS query with name and category parameters
  - Support excludeId parameter for update operations
  - Filter out soft-deleted products
  - _Requirements: 1.5_

- [x] 3.6 Implement sorting logic in findAll method
  - Support sortBy parameter (price, name, createdAt)
  - Support sortOrder parameter (asc, desc)
  - Build dynamic ORDER BY clause
  - _Requirements: 5.5_

- [ ]* 3.7 Write property test for Repository row-to-entity mapping
  - **Property 6: Repository Row-to-Entity Mapping**
  - **Validates: Requirements 8.4**
  - Generate random database row objects with all field types
  - Verify mapping produces valid ProductEntity with correct types
  - Test JSONB parsing, numeric to number conversion, timestamp parsing
  - Tag: `Feature: product-module, Property 6: Repository Row-to-Entity Mapping`

- [ ]* 3.8 Write unit tests for Repository Layer
  - Test insert with valid data
  - Test findById with existing and non-existent IDs
  - Test findAll with various filter combinations
  - Test softDelete sets deleted_at timestamp
  - Test existsByNameAndCategory for duplicate detection
  - Mock Supabase client for unit tests
  - _Requirements: 8.1, 8.3, 8.4_

### 4. Service Layer - Image Storage Service

- [x] 4.1 Implement ImageStorageService interface
  - Create image-storage.service.ts in services folder
  - Define ImageStorageService interface (uploadImage, deleteImage, generateUniqueFilename, validateImageFile)
  - _Requirements: 11.1_

- [x] 4.2 Implement image file validation
  - Validate file type (JPEG, PNG, WebP only)
  - Validate file size (max 5MB)
  - Throw descriptive errors for invalid files
  - _Requirements: 11.3_

- [x] 4.3 Implement unique filename generation
  - Generate UUID-based filenames to prevent collisions
  - Preserve original file extension
  - Format: {uuid}-{timestamp}.{extension}
  - _Requirements: 11.2_

- [x] 4.4 Implement uploadImage method with Supabase Storage integration
  - Upload file to Supabase Storage bucket
  - Return full public URL for uploaded image
  - Handle storage errors and translate to domain exceptions
  - _Requirements: 11.1, 11.4_

- [x] 4.5 Implement deleteImage method
  - Delete file from Supabase Storage by URL
  - Handle errors gracefully (file not found, permission errors)
  - _Requirements: 11.5_

- [ ]* 4.6 Write property test for filename uniqueness
  - **Property 7: Filename Uniqueness**
  - **Validates: Requirements 11.2**
  - Generate multiple uploads with identical original filenames
  - Verify all generated filenames are unique
  - Tag: `Feature: product-module, Property 7: Filename Uniqueness`

- [ ]* 4.7 Write property test for image file validation
  - **Property 8: Image File Validation**
  - **Validates: Requirements 11.3**
  - Generate random files with various types and sizes
  - Verify validation correctly accepts JPEG/PNG/WebP under 5MB
  - Verify validation rejects other types and oversized files
  - Tag: `Feature: product-module, Property 8: Image File Validation`

- [ ]* 4.8 Write unit tests for ImageStorageService
  - Test validateImageFile with valid and invalid files
  - Test generateUniqueFilename produces unique names
  - Test uploadImage success and error cases
  - Test deleteImage success and error cases
  - Mock Supabase Storage client
  - _Requirements: 11.1, 11.2, 11.3_

### 5. Service Layer - Product Service

- [x] 5.1 Implement ProductService interface
  - Create product.service.ts in services folder
  - Define ProductService interface with all methods (createProduct, updateProduct, deleteProduct, getProductById, listProducts, getActiveProductById, listActiveProducts)
  - Inject ProductRepository and ImageStorageService dependencies
  - _Requirements: 9.1, 9.2_

- [x] 5.2 Implement createProduct method with business rule validation
  - Validate product name uniqueness within category using repository
  - Validate price > 0
  - Validate maximum 5 images
  - Upload images using ImageStorageService
  - Build ProductEntity with image references
  - Call repository.insert()
  - Set default status to "active" if not provided
  - Handle errors and translate to domain exceptions
  - _Requirements: 1.1, 1.2, 1.5, 1.7, 9.1, 9.2, 9.3_

- [x] 5.3 Implement updateProduct method with image management
  - Validate product exists
  - Validate name uniqueness if name is being changed
  - Upload new images if provided
  - Delete removed images from storage
  - Update ProductEntity with new data
  - Call repository.update()
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 9.2, 9.3_

- [x] 5.4 Implement deleteProduct method (soft delete)
  - Validate product exists
  - Call repository.softDelete()
  - Optionally delete images based on configuration
  - _Requirements: 4.1, 9.1_

- [x] 5.5 Implement getProductById and listProducts for admin
  - Call repository methods with appropriate filters
  - Support includeDeleted parameter
  - Return ProductEntity objects
  - _Requirements: 2.1, 2.2, 4.4, 9.1_

- [x] 5.6 Implement getActiveProductById and listActiveProducts for public
  - Call repository methods with filters: deleted_at IS NULL AND status = 'active'
  - Return ProductEntity objects (only active, non-deleted)
  - _Requirements: 5.1, 5.6, 6.1, 6.2, 6.3, 9.1_

- [ ]* 5.7 Write unit tests for ProductService business logic
  - Test createProduct with valid data
  - Test createProduct with duplicate name in category → throws error
  - Test createProduct with invalid price → throws error
  - Test createProduct with too many images → throws error
  - Test updateProduct with valid data
  - Test deleteProduct sets soft delete
  - Test getActiveProductById excludes deleted and inactive products
  - Mock ProductRepository and ImageStorageService
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

### 6. DTO Mapping Layer

- [x] 6.1 Implement Entity-to-DTO mapper function
  - Create mapEntityToDTO function in dto/product.dto.ts
  - Map all ProductEntity fields to ProductDTO
  - Convert Date objects to ISO 8601 strings
  - Exclude internal fields (deletedAt)
  - Map images array to ProductImageDTO array
  - _Requirements: 7.1, 7.2, 7.5, 16.1_

- [x] 6.2 Add error handling for invalid entities in mapper
  - Validate required fields are present (name, price, status)
  - Throw descriptive errors for missing fields
  - _Requirements: 16.2_

- [x] 6.3 Add null handling for optional fields in mapper
  - Handle null description correctly
  - Handle null deletedAt correctly
  - Ensure mapper doesn't throw on valid nulls
  - _Requirements: 16.3_

- [ ]* 6.4 Write property test for DTO mapping correctness
  - **Property 3: DTO Mapping Correctness**
  - **Validates: Requirements 7.1, 16.1**
  - Generate random valid ProductEntity objects
  - Verify mapping produces valid ProductDTO
  - Verify dates converted to ISO 8601 strings
  - Verify images have full URLs
  - Verify price is number type
  - Tag: `Feature: product-module, Property 3: DTO Mapping Correctness`

- [ ]* 6.5 Write property test for DTO internal field exclusion
  - **Property 4: DTO Internal Field Exclusion**
  - **Validates: Requirements 7.2**
  - Generate random ProductEntity objects (including with deletedAt set)
  - Verify ProductDTO never includes deletedAt field
  - Verify no database-specific metadata in DTO
  - Tag: `Feature: product-module, Property 4: DTO Internal Field Exclusion`

- [ ]* 6.6 Write property test for ISO 8601 timestamp formatting
  - **Property 10: ISO 8601 Timestamp Formatting**
  - **Validates: Requirements 14.3**
  - Generate random Date objects
  - Verify all timestamps formatted as valid ISO 8601 strings
  - Test createdAt and updatedAt fields
  - Tag: `Feature: product-module, Property 10: ISO 8601 Timestamp Formatting`

- [ ]* 6.7 Write property test for DTO mapper error handling
  - **Property 11: DTO Mapper Error Handling**
  - **Validates: Requirements 16.2**
  - Generate invalid ProductEntity objects (missing required fields)
  - Verify mapper throws descriptive errors
  - Test missing name, price, status
  - Tag: `Feature: product-module, Property 11: DTO Mapper Error Handling`

- [ ]* 6.8 Write property test for DTO mapper null handling
  - **Property 12: DTO Mapper Null Handling**
  - **Validates: Requirements 16.3**
  - Generate ProductEntity with various null optional fields
  - Verify mapper handles nulls correctly without errors
  - Test null description, null deletedAt
  - Tag: `Feature: product-module, Property 12: DTO Mapper Null Handling`

### 7. Common Middleware and Error Handling

- [x] 7.1 Create custom exception classes
  - Create validation.exception.ts (ValidationException)
  - Create not-found.exception.ts (NotFoundException)
  - Create unauthorized.exception.ts (UnauthorizedException)
  - Create forbidden.exception.ts (ForbiddenException)
  - Create conflict.exception.ts (ConflictException)
  - Define domain-specific exceptions: ProductNotFoundException, DuplicateProductException
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [~] 7.2 Implement error handler middleware
  - Create error-handler.middleware.ts
  - Map exceptions to HTTP status codes (400, 401, 403, 404, 409, 500)
  - Format error responses consistently: { error: { code, message, fields? } }
  - Log errors with request context (never log sensitive data)
  - Never expose internal implementation details
  - _Requirements: 12.5, 12.6_

- [~] 7.3 Implement authentication middleware
  - Create auth.middleware.ts
  - Verify JWT token from Authorization header
  - Extract user information from token
  - Return 401 for missing or invalid tokens
  - _Requirements: 1.4, 12.2_

- [~] 7.4 Implement authorization middleware for admin endpoints
  - Create admin-auth.middleware.ts
  - Verify user has admin role
  - Return 403 for non-admin users
  - _Requirements: 9.5, 12.3_

- [ ]* 7.5 Write property test for error response format consistency
  - **Property 9: Error Response Format Consistency**
  - **Validates: Requirements 12.6**
  - Generate various error conditions (validation, auth, not found, conflict, server error)
  - Verify all error responses follow consistent format
  - Verify structure: { error: { code: string, message: string, fields?: array } }
  - Tag: `Feature: product-module, Property 9: Error Response Format Consistency`

- [ ]* 7.6 Write unit tests for error handling
  - Test ValidationException → 400 with field errors
  - Test UnauthorizedException → 401
  - Test ForbiddenException → 403
  - Test NotFoundException → 404
  - Test ConflictException → 409
  - Test unexpected errors → 500
  - Verify error response format consistency
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

### 8. API Layer - Admin Product Controller

- [x] 8.1 Create AdminProductController with route definitions
  - Create admin-product.controller.ts in controllers folder
  - Define routes: POST /api/v1/admin/products, GET /api/v1/admin/products, GET /api/v1/admin/products/:id, PUT /api/v1/admin/products/:id, DELETE /api/v1/admin/products/:id
  - Apply authentication and admin authorization middleware
  - Inject ProductService dependency
  - _Requirements: 10.1_

- [x] 8.2 Implement POST /api/v1/admin/products endpoint
  - Validate request body using CreateProductRequest schema
  - Validate file uploads (type, size, count)
  - Call productService.createProduct()
  - Map ProductEntity to ProductDTO
  - Return 201 Created with ProductDTO
  - Handle errors and return appropriate status codes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_

- [x] 8.3 Implement GET /api/v1/admin/products endpoint
  - Validate query parameters using AdminListQuery schema
  - Apply default values (page=1, pageSize=20)
  - Cap pageSize at 100
  - Call productService.listProducts() with filters and pagination
  - Map ProductEntity array to ProductDTO array
  - Return 200 OK with paginated response (data, total, page, pageSize, totalPages)
  - _Requirements: 2.1, 2.3, 2.4, 7.1_

- [x] 8.4 Implement GET /api/v1/admin/products/:id endpoint
  - Validate UUID format for id parameter
  - Call productService.getProductById()
  - Return 404 if product not found
  - Map ProductEntity to ProductDTO
  - Return 200 OK with ProductDTO
  - _Requirements: 2.5, 7.1_

- [x] 8.5 Implement PUT /api/v1/admin/products/:id endpoint
  - Validate request body using UpdateProductRequest schema
  - Validate file uploads if provided
  - Call productService.updateProduct()
  - Return 404 if product not found
  - Map ProductEntity to ProductDTO
  - Return 200 OK with updated ProductDTO
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.1_

- [x] 8.6 Implement DELETE /api/v1/admin/products/:id endpoint
  - Validate UUID format for id parameter
  - Call productService.deleteProduct()
  - Return 404 if product not found
  - Return 204 No Content on success
  - _Requirements: 4.1, 4.4, 7.1_

- [ ]* 8.7 Write integration tests for Admin API endpoints
  - Test POST /api/v1/admin/products with valid data → 201 with ProductDTO
  - Test POST without auth → 401
  - Test POST with non-admin user → 403
  - Test POST with invalid data → 400 with field errors
  - Test GET /api/v1/admin/products with filters → correct products returned
  - Test GET /api/v1/admin/products/:id → 200 with ProductDTO
  - Test GET with non-existent id → 404
  - Test PUT /api/v1/admin/products/:id → 200 with updated ProductDTO
  - Test DELETE /api/v1/admin/products/:id → 204, product soft-deleted
  - Use test database for integration tests
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.5, 3.1, 3.4, 4.1, 4.4_

### 9. API Layer - Public Product Controller

- [~] 9.1 Create PublicProductController with route definitions
  - Create public-product.controller.ts in controllers folder
  - Define routes: GET /api/v1/products, GET /api/v1/products/:id
  - No authentication required
  - Inject ProductService dependency
  - _Requirements: 10.1_

- [~] 9.2 Implement GET /api/v1/products endpoint
  - Validate query parameters using PublicListQuery schema
  - Apply default values (page=1, pageSize=20, sortBy='createdAt', sortOrder='desc')
  - Cap pageSize at 100
  - Call productService.listActiveProducts() with filters, sorting, and pagination
  - Map ProductEntity array to ProductDTO array
  - Return 200 OK with paginated response
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1_

- [~] 9.3 Implement GET /api/v1/products/:id endpoint
  - Validate UUID format for id parameter
  - Call productService.getActiveProductById()
  - Return 404 if product not found, deleted, or inactive
  - Map ProductEntity to ProductDTO
  - Return 200 OK with ProductDTO
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1_

- [ ]* 9.4 Write property test for filter correctness
  - **Property 1: Filter Correctness**
  - **Validates: Requirements 2.2, 5.3, 5.4**
  - Generate random product lists and random filter combinations
  - Apply filters (category, price range, status)
  - Verify all returned products match ALL specified filter criteria
  - Tag: `Feature: product-module, Property 1: Filter Correctness`

- [ ]* 9.5 Write property test for public API exclusion
  - **Property 2: Public API Exclusion of Deleted and Inactive Products**
  - **Validates: Requirements 4.3, 5.6**
  - Generate random product lists with various statuses and deleted_at values
  - Call public API methods
  - Verify deleted products (deleted_at IS NOT NULL) never returned
  - Verify inactive products (status != 'active') never returned
  - Tag: `Feature: product-module, Property 2: Public API Exclusion of Deleted and Inactive Products`

- [ ]* 9.6 Write property test for sort order correctness
  - **Property 13: Sort Order Correctness**
  - **Validates: Requirements 5.5**
  - Generate random product lists
  - Apply various sort criteria (price, name, createdAt) and orders (asc, desc)
  - Verify returned list is correctly ordered
  - Tag: `Feature: product-module, Property 13: Sort Order Correctness`

- [ ]* 9.7 Write property test for search result relevance
  - **Property 14: Search Result Relevance**
  - **Validates: Requirements 5.2**
  - Generate random search terms and product lists
  - Apply search filter
  - Verify all returned products contain search term in name or description (case-insensitive)
  - Tag: `Feature: product-module, Property 14: Search Result Relevance`

- [ ]* 9.8 Write integration tests for Public API endpoints
  - Test GET /api/v1/products → 200 with active products only
  - Test GET /api/v1/products with category filter → correct products returned
  - Test GET /api/v1/products with price range → correct products returned
  - Test GET /api/v1/products with search query → relevant products returned
  - Test GET /api/v1/products with sorting → correctly ordered results
  - Test GET /api/v1/products/:id with active product → 200 with ProductDTO
  - Test GET /api/v1/products/:id with deleted product → 404
  - Test GET /api/v1/products/:id with inactive product → 404
  - Use test database for integration tests
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3_

### 10. Pagination and Utility Functions

- [~] 10.1 Create pagination utility functions
  - Create pagination.util.ts in common/utils
  - Implement calculateOffset(page, pageSize) function
  - Implement calculateTotalPages(total, pageSize) function
  - Implement validatePaginationParams(page, pageSize) function
  - Cap pageSize at 100
  - _Requirements: 2.3, 2.4, 5.1_

- [ ]* 10.2 Write unit tests for pagination utilities
  - Test calculateOffset with various page and pageSize values
  - Test calculateTotalPages with various totals
  - Test validatePaginationParams caps pageSize at 100
  - Test validatePaginationParams with invalid values
  - _Requirements: 2.3, 2.4_

### 11. API Versioning and Response Headers

- [~] 11.1 Implement API versioning middleware
  - Add /api/v1 prefix to all routes
  - Add API-Version header to all responses
  - Document versioning strategy for future v2
  - _Requirements: 10.1, 10.2, 10.4_

- [~] 11.2 Add CORS headers for web client access
  - Configure CORS middleware
  - Allow Next.js frontend origin
  - Set appropriate headers (Access-Control-Allow-Origin, etc.)
  - _Requirements: 14.2_

- [~] 11.3 Add caching headers for performance
  - Add Cache-Control headers to GET endpoints
  - Add ETag support for product detail endpoint
  - Configure cache duration based on endpoint type
  - _Requirements: 15.2_

### 12. Rate Limiting and Performance

- [~] 12.1 Implement rate limiting for admin endpoints
  - Add rate limiting middleware to admin routes
  - Set limit: 100 requests per minute per admin user
  - Return 429 Too Many Requests when limit exceeded
  - _Requirements: 15.5_

- [~] 12.2 Optimize repository queries for performance
  - Verify all queries use appropriate indexes
  - Use parameterized queries to prevent SQL injection
  - Implement cursor-based pagination for large result sets (optional enhancement)
  - _Requirements: 15.1, 15.4_

### 13. Final Integration and Testing

- [~] 13.1 Wire all components together
  - Set up dependency injection for all services and repositories
  - Register all controllers with routing framework
  - Apply middleware in correct order (CORS → auth → rate limiting → error handler)
  - Configure Supabase client initialization
  - _Requirements: 8.1, 8.2, 9.1, 9.2_

- [ ]* 13.2 Run full integration test suite
  - Execute all integration tests (admin API + public API)
  - Verify all endpoints work end-to-end
  - Test transaction rollback on multi-step operation failures
  - Test image upload and deletion integration
  - Use test database and test storage bucket
  - _Requirements: All requirements_

- [ ]* 13.3 Run all property-based tests
  - Execute all 14 property tests with minimum 100 iterations each
  - Verify all properties pass
  - Log any failing examples for debugging
  - _Requirements: All correctness properties_

- [~] 13.4 Final checkpoint - Ensure all tests pass
  - Run complete test suite (unit + property + integration + smoke)
  - Verify test coverage meets goals (90%+ for business logic)
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.

### 14. Documentation and Deployment Preparation

- [~] 14.1 Create API documentation
  - Document all endpoints with request/response examples
  - Document error codes and messages
  - Document authentication and authorization requirements
  - Create OpenAPI/Swagger specification (optional)
  - _Requirements: 10.1, 12.6_

- [~] 14.2 Create README for Product Module
  - Document module architecture and layer responsibilities
  - Document how to run tests
  - Document environment variables and configuration
  - Document database migration steps
  - _Requirements: All requirements_

- [~] 14.3 Final checkpoint - Review and validation
  - Review all code for production readiness
  - Verify all requirements are implemented
  - Verify all acceptance criteria are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Tasks marked with `*` are optional** and can be skipped for faster MVP delivery
- **Property-based tests** validate universal correctness properties across all inputs
- **Unit tests** validate specific examples and edge cases
- **Integration tests** validate end-to-end flows with real database and storage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Build from bottom-up: Database → Repository → Service → API
- Test each layer thoroughly before moving to the next
- All code should be production-grade with proper error handling and logging
