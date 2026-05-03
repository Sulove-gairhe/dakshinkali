# Product Module API - Quick Reference

## Base URL
```
/api/v1
```

## Authentication
Admin endpoints require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## Admin Endpoints

### Create Product
```http
POST /api/v1/admin/products
Content-Type: multipart/form-data
Authorization: Bearer <token>

name: string (required, 1-200 chars)
description: string (optional, max 2000 chars)
price: number (required, > 0)
category: string (required)
status: 'active' | 'inactive' | 'out_of_stock' (optional, default: 'active')
images: File[] (optional, max 5 files, 5MB each, JPEG/PNG/WebP)

→ 201 Created + ProductDTO
```

### List Products (Admin)
```http
GET /api/v1/admin/products?page=1&pageSize=20&category=Electronics&status=active&minPrice=100&maxPrice=1000&search=iphone&includeDeleted=false
Authorization: Bearer <token>

→ 200 OK + PaginatedResponse<ProductDTO>
```

### Get Product by ID (Admin)
```http
GET /api/v1/admin/products/:id?includeDeleted=false
Authorization: Bearer <token>

→ 200 OK + ProductDTO
→ 404 Not Found
```

### Update Product
```http
PUT /api/v1/admin/products/:id
Content-Type: multipart/form-data
Authorization: Bearer <token>

name: string (optional, 1-200 chars)
description: string (optional, max 2000 chars)
price: number (optional, > 0)
category: string (optional)
status: 'active' | 'inactive' | 'out_of_stock' (optional)
images: File[] (optional, new images to add)
removeImages: string[] (optional, image IDs to remove)

→ 200 OK + ProductDTO
→ 404 Not Found
```

### Delete Product
```http
DELETE /api/v1/admin/products/:id
Authorization: Bearer <token>

→ 204 No Content
→ 404 Not Found
```

---

## Public Endpoints

### List Products (Public)
```http
GET /api/v1/products?page=1&pageSize=20&category=Electronics&minPrice=100&maxPrice=1000&search=iphone&sortBy=price&sortOrder=asc

→ 200 OK + PaginatedResponse<ProductDTO>
```

**Sort Options:**
- `sortBy`: `price` | `name` | `createdAt` (default: `createdAt`)
- `sortOrder`: `asc` | `desc` (default: `desc`)

### Get Product by ID (Public)
```http
GET /api/v1/products/:id

→ 200 OK + ProductDTO
→ 404 Not Found (if deleted, inactive, or non-existent)
```

---

## Response Schemas

### ProductDTO
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "price": 999.99,
  "category": "string",
  "status": "active" | "inactive" | "out_of_stock",
  "images": [
    {
      "id": "uuid",
      "url": "https://...",
      "order": 0
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### PaginatedResponse
```json
{
  "data": [ProductDTO],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

### ErrorResponse
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

---

## HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not admin |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate name in category |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Admin access required |
| `PRODUCT_NOT_FOUND` | 404 | Product not found |
| `DUPLICATE_PRODUCT` | 409 | Name exists in category |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting

**Admin Endpoints:** 100 requests/minute per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705320000
```

**429 Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

## Validation Rules

### Product Name
- Required for create
- 1-200 characters
- Must be unique within category
- Cannot be empty string

### Price
- Required for create
- Must be > 0
- Numeric value

### Category
- Required for create
- Cannot be empty string

### Description
- Optional
- Max 2000 characters

### Status
- Optional (defaults to 'active')
- Must be: `active` | `inactive` | `out_of_stock`

### Images
- Optional
- Max 5 images per product
- Max 5MB per image
- Supported formats: JPEG, PNG, WebP

### Pagination
- `page`: Positive integer (default: 1)
- `pageSize`: 1-100 (default: 20, capped at 100)

### Price Range
- `minPrice`: >= 0
- `maxPrice`: >= 0
- `minPrice` must be <= `maxPrice`

---

## cURL Examples

### Create Product
```bash
curl -X POST https://api.example.com/api/v1/admin/products \
  -H "Authorization: Bearer <token>" \
  -F "name=iPhone 15 Pro" \
  -F "description=Latest iPhone" \
  -F "price=999.99" \
  -F "category=Electronics" \
  -F "status=active" \
  -F "images=@image1.jpg"
```

### List Products with Filters
```bash
curl -X GET "https://api.example.com/api/v1/products?category=Electronics&minPrice=500&maxPrice=1500&sortBy=price&sortOrder=asc&page=1&pageSize=10"
```

### Update Product
```bash
curl -X PUT https://api.example.com/api/v1/admin/products/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>" \
  -F "price=1099.99" \
  -F "status=out_of_stock"
```

### Delete Product
```bash
curl -X DELETE https://api.example.com/api/v1/admin/products/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>"
```

### Search Products
```bash
curl -X GET "https://api.example.com/api/v1/products?search=iphone&page=1&pageSize=20"
```

---

## JavaScript/TypeScript Examples

### Fetch API (Create Product)
```typescript
const formData = new FormData();
formData.append('name', 'iPhone 15 Pro');
formData.append('description', 'Latest iPhone');
formData.append('price', '999.99');
formData.append('category', 'Electronics');
formData.append('status', 'active');
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const response = await fetch('/api/v1/admin/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const product = await response.json();
```

### Axios (List Products)
```typescript
import axios from 'axios';

const response = await axios.get('/api/v1/products', {
  params: {
    category: 'Electronics',
    minPrice: 500,
    maxPrice: 1500,
    sortBy: 'price',
    sortOrder: 'asc',
    page: 1,
    pageSize: 20
  }
});

const { data, total, page, pageSize, totalPages } = response.data;
```

### Fetch API (Update Product)
```typescript
const formData = new FormData();
formData.append('price', '1099.99');
formData.append('status', 'out_of_stock');

const response = await fetch(`/api/v1/admin/products/${productId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const updatedProduct = await response.json();
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/v1/admin/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (error.error.code === 'VALIDATION_ERROR') {
      // Handle validation errors
      error.error.fields?.forEach(field => {
        console.error(`${field.field}: ${field.message}`);
      });
    } else if (error.error.code === 'DUPLICATE_PRODUCT') {
      // Handle duplicate product
      console.error('Product already exists');
    }
    
    throw new Error(error.error.message);
  }

  const product = await response.json();
  return product;
} catch (error) {
  console.error('Failed to create product:', error);
  throw error;
}
```

---

## Notes

### Soft Delete Behavior
- Deleted products have `deleted_at` timestamp set
- Data is preserved for historical integrity
- Public API never returns deleted products
- Admin API can view with `includeDeleted=true`

### Image Storage
- Images stored in Supabase Storage
- Public URLs returned in responses
- Images served via CDN

### Caching
- Public GET endpoints support caching headers
- Use `ETag` for conditional requests
- Include `If-None-Match` header for efficient caching

### API Versioning
- All endpoints under `/api/v1`
- Future versions will use `/api/v2`, etc.
- Previous versions supported for 6 months minimum

---

## Support

For detailed documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

For OpenAPI/Swagger specification, see [openapi.yaml](./openapi.yaml)
