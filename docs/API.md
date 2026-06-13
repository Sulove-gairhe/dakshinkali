# API

## Base URLs

| Environment | URL |
| --- | --- |
| Local | `http://localhost:3002` |
| Production | <!-- TODO: verify deployed API URL --> |
| Swagger UI | `/api-docs` |
| Health | `/health` and `/api/health` |

All business routes are mounted under `/api/v1`.

## Authentication

| Route group | Auth |
| --- | --- |
| Public products | None. Rate limited and cache headers applied. |
| Cart guest routes | `X-Session-ID` header. |
| Cart authenticated routes | `Authorization: Bearer <supabase-access-token>`. |
| Customer orders | `Authorization: Bearer <supabase-access-token>`. |
| Profile | `Authorization: Bearer <supabase-access-token>`. |
| Admin routes | Bearer token plus admin role middleware. |
| Internal notify routes | `X-Order-Notify-Secret: <ORDER_NOTIFY_SECRET>`. |

The API CORS config allows `Content-Type`, `Authorization`, `X-Session-ID`, and `X-Order-Notify-Secret`.

## Routes

### Health

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Redirects to `/api-docs`. |
| `GET` | `/health` | API and database health. |
| `GET` | `/api/health` | Same health payload under `/api`. |

### Products

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/products` | Public | List active products. |
| `GET` | `/api/v1/products/:id` | Public | Get active product by UUID. |
| `POST` | `/api/v1/admin/products` | Admin | Create product with multipart images. |
| `GET` | `/api/v1/admin/products` | Admin | List products with admin filters. |
| `GET` | `/api/v1/admin/products/:id` | Admin | Get product by UUID; supports `includeDeleted=true`. |
| `PUT` | `/api/v1/admin/products/:id` | Admin | Update product and image set. |
| `DELETE` | `/api/v1/admin/products/:id` | Admin | Soft-delete product. |

Public product list query:

| Query | Description |
| --- | --- |
| `page` | Positive integer, default `1`. |
| `pageSize` | Positive integer, default `20`, max `100`. |
| `category` | Exact category match. |
| `minPrice` | Minimum price. |
| `maxPrice` | Maximum price. |
| `search` | Case-insensitive name/description search. |
| `sortBy` | `price`, `name`, or `createdAt`. |
| `sortOrder` | `asc` or `desc`. |

Admin product list adds `status` and `includeDeleted`.

Product response shape:

```json
{
  "id": "uuid",
  "name": "Samsung TV",
  "description": "Product description",
  "price": 125000,
  "category": "Televisions",
  "status": "active",
  "images": [{ "id": "image-id", "url": "https://...", "order": 0 }],
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

Create/update product requests use `multipart/form-data` with fields `name`, `description`, `price`, `category`, `status`, `images`, and for updates `removeImages` as JSON.

### Cart

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/cart` | Optional bearer or guest `X-Session-ID` | Get current cart. |
| `POST` | `/api/v1/cart/items` | Optional bearer or guest `X-Session-ID` | Add item. |
| `PUT` | `/api/v1/cart/items/:id` | Optional bearer or guest `X-Session-ID` | Update quantity; `0` removes item. |
| `DELETE` | `/api/v1/cart/items/:id` | Optional bearer or guest `X-Session-ID` | Remove item. |
| `DELETE` | `/api/v1/cart` | Optional bearer or guest `X-Session-ID` | Clear cart. |
| `POST` | `/api/v1/cart/merge` | Bearer | Merge guest cart into authenticated cart. |

Add item request:

```json
{
  "productId": "uuid",
  "quantity": 1
}
```

Merge request:

```json
{
  "sessionId": "guest-session-id"
}
```

Cart response shape:

```json
{
  "id": "uuid",
  "userId": "uuid-or-null",
  "items": [
    {
      "id": "cart-item-uuid",
      "productId": "product-uuid",
      "productName": "Samsung TV",
      "productImage": "https://...",
      "productStatus": "active",
      "quantity": 1,
      "priceAtAddition": 125000,
      "currentPrice": 125000,
      "subtotal": 125000,
      "isAvailable": true,
      "priceChanged": false
    }
  ],
  "subtotal": 125000,
  "total": 125000,
  "itemCount": 1,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

### Orders

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/orders` | Bearer | Create order from authenticated user's cart. |
| `GET` | `/api/v1/orders` | Bearer | List current user's orders. |
| `GET` | `/api/v1/orders/:id` | Bearer | Get current user's order. |
| `PUT` | `/api/v1/orders/:id/cancel` | Bearer | Cancel current user's order. |
| `GET` | `/api/v1/admin/orders/stats` | Admin | Order stats and recent orders. |
| `GET` | `/api/v1/admin/orders` | Admin | List all orders. |
| `GET` | `/api/v1/admin/orders/:id` | Admin | Get any order. |
| `PUT` | `/api/v1/admin/orders/:id/status` | Admin | Update order status. |

Create order request:

```json
{
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "customerPhone": "+977-9800000000",
  "shippingAddress": {
    "line1": "Street address",
    "line2": "Landmark",
    "city": "Kathmandu",
    "state": "Bagmati",
    "postalCode": "44600",
    "country": "Nepal"
  },
  "paymentMethod": "cash_on_delivery",
  "couponCode": "DASH10",
  "notes": "Call before delivery"
}
```

Order response shape:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "orderNumber": "DK-20260612-ABC123",
  "status": "pending",
  "customerEmail": "customer@example.com",
  "customerName": "Customer Name",
  "customerPhone": "+977-9800000000",
  "shippingAddress": {
    "line1": "Street address",
    "line2": "Landmark",
    "city": "Kathmandu",
    "state": "Bagmati",
    "postalCode": "44600",
    "country": "Nepal"
  },
  "subtotal": 1000,
  "shippingCost": 150,
  "tax": 0,
  "couponCode": "DASH10",
  "discountAmount": 100,
  "originalSubtotal": 1100,
  "total": 1050,
  "paymentMethod": "cash_on_delivery",
  "paymentStatus": "pending",
  "notes": "Call before delivery",
  "items": [],
  "statusHistory": [],
  "createdAt": "2026-06-01T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

Admin status update request:

```json
{
  "status": "processing",
  "notes": "Packed and ready"
}
```

Current API controller validation accepts only `pending`, `confirmed`, `processing`, `shipped`, `delivered`, and `cancelled`. It does not yet accept `pending_admin_approval`, even though the database and admin panel use it.

### Profile And Admin Support

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/profile` | Bearer | Get current user's profile. |
| `PUT` | `/api/v1/profile` | Bearer | Update `fullName` and `avatarUrl`. |
| `GET` | `/api/v1/admin/dashboard/stats` | Admin | Product, order, and user summary. |
| `GET` | `/api/v1/admin/users` | Admin | List users, optional `role`, `page`, `pageSize`. |
| `PUT` | `/api/v1/admin/users/:id/role` | Admin | Update profile role. |
| `PATCH` | `/api/v1/admin/users/:userId/role` | Admin | Update Supabase Auth app metadata role and profile role. |

Profile update request:

```json
{
  "fullName": "Customer Name",
  "avatarUrl": "https://..."
}
```

Role update request:

```json
{
  "role": "admin"
}
```

Current API role validation accepts `customer` and `admin`. Database migrations also support `staff`.

### Internal Routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/internal/orders/:orderId/notify` | `X-Order-Notify-Secret` | Claim a new order notification, then send admin email and FCM push asynchronously. |
| `GET` | `/api/v1/internal/test-notify-email` | `X-Order-Notify-Secret` | Send a synthetic admin order email for SMTP/Resend testing. |

Notify response:

```json
{
  "ok": true
}
```

The notify route returns `202` after scheduling the notification work. It marks `orders.admin_notification_status` from `pending` to `sent` before sending, and skips rows that are not pending.

### Storefront Next.js API Routes

These are local to `apps/web`, not `apps/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/coupons/apply` | Validate coupon code against cart items. |
| `GET` | `/api/storefront-products?key=<section>&max=<n>` | Resolve curated storefront section slugs to products. |

### Admin Next.js API Routes

These are local to `apps/admin`, not `apps/api`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/admin/fcm-token` | Save current admin browser FCM token. |
| `GET` | `/api/firebase-config` | Return Firebase web config to the service worker. |
| `GET` | `/api/env-check` | Debug Supabase env/key metadata. Keep restricted or remove in production. |

## Error Response Format

Most API errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid quantity",
    "fields": [
      { "field": "quantity", "message": "Quantity must be between 1 and 99" }
    ]
  }
}
```

Known error codes:

| Code | HTTP status |
| --- | --- |
| `VALIDATION_ERROR` | `400` |
| `UNAUTHORIZED` | `401` |
| `FORBIDDEN` | `403` |
| `PRODUCT_NOT_FOUND` | `404` |
| `NOT_FOUND` | `404` |
| `CONFLICT` | `409` |
| `INTERNAL_SERVER_ERROR` | `500` |

Internal notify routes currently return simpler `{ "error": "..." }` payloads for some errors.

## How To Add New Routes

1. Create or extend a module under `apps/api/src/modules/<name>/`.
2. Keep route registration in a `routes.ts` or `routes/express.routes.ts` file.
3. Put validation in a controller or validator, not inline route bodies.
4. Keep database access in repositories/services.
5. Register the route module in `apps/api/src/app.ts`.
6. Add DTO/request types for request and response shapes.
7. Update Swagger/OpenAPI docs and this file.
8. Add focused tests near the module when changing behavior.
