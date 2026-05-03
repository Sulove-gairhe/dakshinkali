# Product Module API Documentation

## Overview

The Product Module provides REST API endpoints for managing product inventory in the Dakshinkali Electronics Center e-commerce platform. The API follows a layered architecture with strict separation of concerns and uses DTOs (Data Transfer Objects) to decouple clients from database schema changes.

**Base URL:** `/api/v1`

**API Version:** v1

**Authentication:** JWT Bearer Token (Admin endpoints only)

**Response Format:** JSON

**Timestamp Format:** ISO 8601

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Endpoints](#admin-endpoints)
3. [Public Endpoints](#public-endpoints)
4. [Request/Response Schemas](#requestresponse-schemas)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### Admin Endpoints

All admin endpoints require authentication using a JWT Bearer token.

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Requirements:**
- Valid JWT token
- User must have `admin` role

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Valid token but user is not an admin

### Public Endpoints

Public endpoints do not require authentication and are accessible to all users.

---

## Admin Endpoints

### 1. Create Product

Create a new product with optional images.

**Endpoint:** `POST /api/v1/admin/products`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | Yes | 1-200 chars, unique within category | Product name |
| description | string | No | Max 2000 chars | Product description |
| price | number | Yes | > 0 | Product price |
| category | string | Yes | Non-empty | Product category |
| status | string | No | 'active' \| 'inactive' \| 'out_of_stock' | Product status (default: 'active') |
| images | File[] | No | Max 5 files, 5MB each, JPEG/PNG/WebP | Product images |

**Success Response:**

**Status Code:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 999.99,
  "category": "Electronics",
  "status": "active",
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://storage.supabase.co/products/img1.jpg",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid product data
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Non-admin user
- `409 Conflict` - Product name already exists in category

---

### 2. List Products (Admin)

List all products with filtering and pagination. Admins can view soft-deleted products.

**Endpoint:** `GET /api/v1/admin/products`

**Authentication:** Required (Admin)

**Query Parameters:**

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| page | number | No | 1 | > 0 | Page number |
| pageSize | number | No | 20 | 1-100 | Items per page (capped at 100) |
| category | string | No | - | - | Filter by category |
| status | string | No | - | 'active' \| 'inactive' \| 'out_of_stock' | Filter by status |
| minPrice | number | No | - | >= 0 | Minimum price filter |
| maxPrice | number | No | - | >= 0 | Maximum price filter |
| search | string | No | - | - | Search in name/description (case-insensitive) |
| includeDeleted | boolean | No | false | - | Include soft-deleted products |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with A17 Pro chip",
      "price": 999.99,
      "category": "Electronics",
      "status": "active",
      "images": [
        {
          "id": "img-uuid-1",
          "url": "https://storage.supabase.co/products/img1.jpg",
          "order": 0
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Non-admin user

---

### 3. Get Product by ID (Admin)

Get a single product by ID. Admins can view soft-deleted products.

**Endpoint:** `GET /api/v1/admin/products/:id`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| id | string | Yes | Valid UUID | Product ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| includeDeleted | boolean | No | false | Include soft-deleted product |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 999.99,
  "category": "Electronics",
  "status": "active",
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://storage.supabase.co/products/img1.jpg",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Non-admin user
- `404 Not Found` - Product not found

---

### 4. Update Product

Update an existing product. All fields are optional (partial update).

**Endpoint:** `PUT /api/v1/admin/products/:id`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| id | string | Yes | Valid UUID | Product ID |

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | No | 1-200 chars, unique within category | Product name |
| description | string | No | Max 2000 chars | Product description |
| price | number | No | > 0 | Product price |
| category | string | No | Non-empty | Product category |
| status | string | No | 'active' \| 'inactive' \| 'out_of_stock' | Product status |
| images | File[] | No | Max 5 files, 5MB each, JPEG/PNG/WebP | New images to add |
| removeImages | string[] | No | Array of UUIDs | Image IDs to remove |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro Max",
  "description": "Updated description",
  "price": 1099.99,
  "category": "Electronics",
  "status": "active",
  "images": [
    {
      "id": "img-uuid-2",
      "url": "https://storage.supabase.co/products/img2.jpg",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid product data or UUID format
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Non-admin user
- `404 Not Found` - Product not found
- `409 Conflict` - Updated name conflicts with existing product

---

### 5. Delete Product

Soft delete a product. The product is marked as deleted but data is preserved.

**Endpoint:** `DELETE /api/v1/admin/products/:id`

**Authentication:** Required (Admin)

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| id | string | Yes | Valid UUID | Product ID |

**Success Response:**

**Status Code:** `204 No Content`

No response body.

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Non-admin user
- `404 Not Found` - Product not found

---

## Public Endpoints

### 1. List Products (Public)

List active products with filtering, search, sorting, and pagination. Only returns active, non-deleted products.

**Endpoint:** `GET /api/v1/products`

**Authentication:** Not required

**Query Parameters:**

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| page | number | No | 1 | > 0 | Page number |
| pageSize | number | No | 20 | 1-100 | Items per page (capped at 100) |
| category | string | No | - | - | Filter by category |
| minPrice | number | No | - | >= 0 | Minimum price filter |
| maxPrice | number | No | - | >= 0 | Maximum price filter |
| search | string | No | - | - | Search in name/description (case-insensitive) |
| sortBy | string | No | createdAt | 'price' \| 'name' \| 'createdAt' | Sort field |
| sortOrder | string | No | desc | 'asc' \| 'desc' | Sort direction |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with A17 Pro chip",
      "price": 999.99,
      "category": "Electronics",
      "status": "active",
      "images": [
        {
          "id": "img-uuid-1",
          "url": "https://storage.supabase.co/products/img1.jpg",
          "order": 0
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters

---

### 2. Get Product by ID (Public)

Get a single active product by ID. Only returns active, non-deleted products.

**Endpoint:** `GET /api/v1/products/:id`

**Authentication:** Not required

**Path Parameters:**

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| id | string | Yes | Valid UUID | Product ID |

**Success Response:**

**Status Code:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 999.99,
  "category": "Electronics",
  "status": "active",
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://storage.supabase.co/products/img1.jpg",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid UUID format
- `404 Not Found` - Product not found, deleted, or inactive

---

## Request/Response Schemas

### ProductDTO

Complete product representation returned by all endpoints.

```typescript
{
  id: string;              // UUID v4
  name: string;            // Product name
  description: string | null;  // Product description (null if not provided)
  price: number;           // Product price (numeric value)
  category: string;        // Product category
  status: 'active' | 'inactive' | 'out_of_stock';  // Product status
  images: ProductImageDTO[];  // Array of product images
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}
```

### ProductImageDTO

Product image metadata.

```typescript
{
  id: string;     // Image UUID
  url: string;    // Full public URL from Supabase Storage
  order: number;  // Display order (0-indexed)
}
```

### PaginatedResponse

Paginated list response wrapper.

```typescript
{
  data: ProductDTO[];   // Array of products
  total: number;        // Total number of products matching filters
  page: number;         // Current page number
  pageSize: number;     // Number of items per page
  totalPages: number;   // Total number of pages
}
```

---

## Error Handling

All API errors follow a consistent structure for easy client-side handling.

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "fields": [
      {
        "field": "fieldName",
        "message": "Field-specific error message"
      }
    ]
  }
}
```

### HTTP Status Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request data (validation errors) |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Business rule violation (e.g., duplicate name) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Error Codes

#### Validation Errors (400)

**Code:** `VALIDATION_ERROR`

**Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "fields": [
      {
        "field": "price",
        "message": "Product price must be greater than 0"
      },
      {
        "field": "name",
        "message": "Product name is required"
      }
    ]
  }
}
```

#### Authentication Errors (401)

**Code:** `UNAUTHORIZED`

**Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token."
  }
}
```

#### Authorization Errors (403)

**Code:** `FORBIDDEN`

**Example:**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required for this operation."
  }
}
```

#### Not Found Errors (404)

**Code:** `PRODUCT_NOT_FOUND`

**Example:**
```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID '123e4567-e89b-12d3-a456-426614174000' not found."
  }
}
```

#### Conflict Errors (409)

**Code:** `DUPLICATE_PRODUCT`

**Example:**
```json
{
  "error": {
    "code": "DUPLICATE_PRODUCT",
    "message": "A product with name 'iPhone 15' already exists in category 'Electronics'."
  }
}
```

#### Server Errors (500)

**Code:** `INTERNAL_SERVER_ERROR`

**Example:**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

---

## Rate Limiting

### Admin Endpoints

**Limit:** 100 requests per minute per admin user

**Response when limit exceeded:**

**Status Code:** `429 Too Many Requests`

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320000
Retry-After: 60
```

### Public Endpoints

Public endpoints currently have no rate limiting but may be added in future versions.

---

## Examples

### Example 1: Create a Product with Images

**Request:**

```bash
curl -X POST https://api.example.com/api/v1/admin/products \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "name=iPhone 15 Pro" \
  -F "description=Latest iPhone with A17 Pro chip" \
  -F "price=999.99" \
  -F "category=Electronics" \
  -F "status=active" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg"
```

**Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 999.99,
  "category": "Electronics",
  "status": "active",
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://storage.supabase.co/products/img1.jpg",
      "order": 0
    },
    {
      "id": "img-uuid-2",
      "url": "https://storage.supabase.co/products/img2.jpg",
      "order": 1
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Example 2: List Products with Filters

**Request:**

```bash
curl -X GET "https://api.example.com/api/v1/products?category=Electronics&minPrice=500&maxPrice=1500&sortBy=price&sortOrder=asc&page=1&pageSize=10"
```

**Response:**

```json
{
  "data": [
    {
      "id": "prod-uuid-1",
      "name": "Samsung Galaxy S24",
      "description": "Latest Samsung flagship",
      "price": 799.99,
      "category": "Electronics",
      "status": "active",
      "images": [],
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    },
    {
      "id": "prod-uuid-2",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with A17 Pro chip",
      "price": 999.99,
      "category": "Electronics",
      "status": "active",
      "images": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10,
  "totalPages": 3
}
```

---

### Example 3: Update Product

**Request:**

```bash
curl -X PUT https://api.example.com/api/v1/admin/products/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "price=1099.99" \
  -F "status=out_of_stock"
```

**Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 1099.99,
  "category": "Electronics",
  "status": "out_of_stock",
  "images": [
    {
      "id": "img-uuid-1",
      "url": "https://storage.supabase.co/products/img1.jpg",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z"
}
```

---

### Example 4: Search Products

**Request:**

```bash
curl -X GET "https://api.example.com/api/v1/products?search=iphone&page=1&pageSize=20"
```

**Response:**

```json
{
  "data": [
    {
      "id": "prod-uuid-1",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with A17 Pro chip",
      "price": 999.99,
      "category": "Electronics",
      "status": "active",
      "images": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "prod-uuid-2",
      "name": "iPhone 14",
      "description": "Previous generation iPhone",
      "price": 799.99,
      "category": "Electronics",
      "status": "active",
      "images": [],
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-10T09:00:00.000Z"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

---

### Example 5: Delete Product

**Request:**

```bash
curl -X DELETE https://api.example.com/api/v1/admin/products/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <jwt_token>"
```

**Response:**

**Status Code:** `204 No Content`

No response body.

---

### Example 6: Validation Error

**Request:**

```bash
curl -X POST https://api.example.com/api/v1/admin/products \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "price": -10,
    "category": "Electronics"
  }'
```

**Response:**

**Status Code:** `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "fields": [
      {
        "field": "name",
        "message": "Product name is required"
      },
      {
        "field": "price",
        "message": "Product price must be greater than 0"
      }
    ]
  }
}
```

---

## Additional Notes

### API Versioning

- All endpoints are versioned under `/api/v1`
- Future backward-incompatible changes will be released under `/api/v2`
- Previous API versions will be supported for at least 6 months after a new version is released
- All responses include an `API-Version` header indicating the version used

### Caching

- Public GET endpoints support caching headers (`Cache-Control`, `ETag`)
- Product detail endpoint (`GET /api/v1/products/:id`) supports `ETag` for conditional requests
- Use `If-None-Match` header with ETag value for efficient caching

### CORS

- API supports CORS for web client access
- Appropriate `Access-Control-Allow-Origin` headers are included in responses
- Preflight requests are handled automatically

### Soft Delete Behavior

- Deleted products are marked with `deleted_at` timestamp
- Data is preserved for historical order integrity
- Public API never returns deleted products
- Admin API can view deleted products with `includeDeleted=true` parameter

### Image Storage

- Images are stored in Supabase Storage
- Maximum 5 images per product
- Maximum 5MB per image file
- Supported formats: JPEG, PNG, WebP
- Images are served via public URLs from Supabase Storage CDN

---

## Support

For API support or questions, please contact the development team or refer to the internal documentation.

**Validates Requirements:** 10.1, 12.6
