# Product Module API Documentation

This directory contains comprehensive API documentation for the Product Module.

## Documentation Files

### 📘 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Complete API reference documentation**

Comprehensive guide covering:
- Authentication and authorization
- All admin and public endpoints
- Request/response schemas
- Error handling and status codes
- Rate limiting
- Detailed examples with cURL and JavaScript/TypeScript
- Additional notes on caching, CORS, soft delete behavior

**Use this when:** You need detailed information about any endpoint, error handling, or API behavior.

---

### ⚡ [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
**Quick reference guide for developers**

Condensed reference including:
- Quick endpoint syntax
- Response schemas
- HTTP status codes and error codes
- Validation rules
- cURL and code examples
- Common patterns

**Use this when:** You need a quick lookup for endpoint syntax, status codes, or validation rules.

---

### 📋 [openapi.yaml](./openapi.yaml)
**OpenAPI 3.0 specification**

Machine-readable API specification including:
- Complete endpoint definitions
- Request/response schemas
- Authentication requirements
- Validation rules
- Error responses

**Use this when:** 
- Generating API clients (Swagger Codegen, OpenAPI Generator)
- Importing into API testing tools (Postman, Insomnia)
- Viewing in Swagger UI or similar tools
- Automating API documentation

---

## Quick Start

### For Frontend Developers

1. Start with [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for endpoint syntax
2. Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed examples
3. Use [openapi.yaml](./openapi.yaml) to generate TypeScript types

### For Backend Developers

1. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete specifications
2. Use [openapi.yaml](./openapi.yaml) for contract testing
3. Reference [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for validation rules

### For QA/Testing

1. Import [openapi.yaml](./openapi.yaml) into Postman or Insomnia
2. Use [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for test case scenarios
3. Reference error codes in [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)

---

## Viewing OpenAPI Specification

### Option 1: Swagger UI (Online)
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Copy contents of `openapi.yaml`
3. Paste into the editor

### Option 2: Swagger UI (Local)
```bash
# Using Docker
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd)/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui

# Open browser to http://localhost:8080
```

### Option 3: VS Code Extension
1. Install "OpenAPI (Swagger) Editor" extension
2. Open `openapi.yaml`
3. Right-click → "Preview Swagger"

---

## Generating API Clients

### TypeScript/JavaScript Client
```bash
# Using OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-fetch \
  -o ./generated/api-client
```

### Python Client
```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

---

## Importing into API Testing Tools

### Postman
1. Open Postman
2. Click "Import"
3. Select `openapi.yaml`
4. Postman will create a collection with all endpoints

### Insomnia
1. Open Insomnia
2. Click "Create" → "Import From" → "File"
3. Select `openapi.yaml`
4. Insomnia will create requests for all endpoints

---

## API Endpoints Summary

### Admin Endpoints (Authentication Required)
```
POST   /api/v1/admin/products          Create product
GET    /api/v1/admin/products          List products (with filters)
GET    /api/v1/admin/products/:id      Get product by ID
PUT    /api/v1/admin/products/:id      Update product
DELETE /api/v1/admin/products/:id      Delete product (soft delete)
```

### Public Endpoints (No Authentication)
```
GET /api/v1/products          List active products (with filters, search, sort)
GET /api/v1/products/:id      Get active product by ID
```

---

## Authentication

Admin endpoints require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

Public endpoints do not require authentication.

---

## Rate Limiting

**Admin Endpoints:** 100 requests per minute per user

When rate limit is exceeded, API returns `429 Too Many Requests` with `Retry-After` header.

---

## Error Handling

All errors follow consistent format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "fields": [
      {
        "field": "fieldName",
        "message": "Field error message"
      }
    ]
  }
}
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#error-handling) for complete error code reference.

---

## Common Use Cases

### Create a Product with Images
See: [API_DOCUMENTATION.md - Example 1](./API_DOCUMENTATION.md#example-1-create-a-product-with-images)

### List Products with Filters
See: [API_DOCUMENTATION.md - Example 2](./API_DOCUMENTATION.md#example-2-list-products-with-filters)

### Update Product Price and Status
See: [API_DOCUMENTATION.md - Example 3](./API_DOCUMENTATION.md#example-3-update-product)

### Search Products
See: [API_DOCUMENTATION.md - Example 4](./API_DOCUMENTATION.md#example-4-search-products)

### Handle Validation Errors
See: [API_DOCUMENTATION.md - Example 6](./API_DOCUMENTATION.md#example-6-validation-error)

---

## TypeScript Types

For TypeScript projects, you can generate types from the OpenAPI specification:

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript openapi.yaml --output ./types/api.ts
```

Then use in your code:
```typescript
import type { components } from './types/api';

type ProductDTO = components['schemas']['ProductDTO'];
type CreateProductRequest = components['schemas']['CreateProductRequest'];
type ErrorResponse = components['schemas']['ErrorResponse'];
```

---

## Validation Rules Summary

| Field | Create | Update | Validation |
|-------|--------|--------|------------|
| name | Required | Optional | 1-200 chars, unique within category |
| description | Optional | Optional | Max 2000 chars |
| price | Required | Optional | > 0 |
| category | Required | Optional | Non-empty string |
| status | Optional | Optional | 'active' \| 'inactive' \| 'out_of_stock' |
| images | Optional | Optional | Max 5 files, 5MB each, JPEG/PNG/WebP |

See [API_QUICK_REFERENCE.md - Validation Rules](./API_QUICK_REFERENCE.md#validation-rules) for complete reference.

---

## Support and Feedback

For questions or issues with the API:
- Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed information
- Review [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) for quick answers
- Contact the development team for additional support

---

## Document Maintenance

These documents are maintained alongside the Product Module implementation:
- **Last Updated:** January 2024
- **API Version:** v1.0.0
- **Validates Requirements:** 10.1, 12.6

When updating the API:
1. Update controller implementations
2. Update OpenAPI specification (`openapi.yaml`)
3. Update API documentation (`API_DOCUMENTATION.md`)
4. Update quick reference (`API_QUICK_REFERENCE.md`)
5. Increment API version if breaking changes
