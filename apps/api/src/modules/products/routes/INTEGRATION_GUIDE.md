# Product Module Integration Guide

## Overview

This guide explains how to integrate the Product Module into your Express or Fastify application with all middleware properly configured.

## Quick Start

### Express Integration

```typescript
import express from 'express';
import jwt from 'jsonwebtoken';
import { createProductRoutes, registerExpressRoutes } from './routes/product.routes';
import { ProductServiceImpl } from './services/product.service.impl';
import { ProductRepositoryImpl } from './repositories/product.repository.impl';
import { ImageStorageServiceImpl } from './services/image-storage.service.impl';
import { createClient } from '@supabase/supabase-js';

// Initialize Express
const app = express();
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

// Initialize services
const productRepository = new ProductRepositoryImpl(supabase);
const imageStorageService = new ImageStorageServiceImpl(supabase);
const productService = new ProductServiceImpl(productRepository, imageStorageService);

// JWT verifier
const jwtVerifier = async (token: string) => {
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        return payload as any;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Create and register routes
const routes = createProductRoutes({
    productService,
    jwtVerifier,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    enableRateLimiting: true,
    enableCaching: true,
    logger: (level, message, meta) => {
        console.log(`[${level}] ${message}`, meta);
    },
});

registerExpressRoutes(routes, app);

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import { createProductRoutes, registerFastifyRoutes } from './routes/product.routes';
// ... (same service initialization as Express)

const fastify = Fastify({ logger: true });

const routes = createProductRoutes({
    productService,
    jwtVerifier,
    corsOrigins: ['http://localhost:3000'],
    enableRateLimiting: true,
    enableCaching: true,
    logger: fastify.log.info.bind(fastify.log),
});

registerFastifyRoutes(routes, fastify);

fastify.listen({ port: 3000 }, (err) => {
    if (err) throw err;
    console.log('Server running on http://localhost:3000');
});
```

## Middleware Stack

The Product Module uses a comprehensive middleware stack applied in the following order:

### 1. API Versioning
- Validates API version from URL path (`/api/v1`)
- Adds `API-Version` header to responses
- Returns 404 for unsupported versions

### 2. CORS (Cross-Origin Resource Sharing)
- Configures allowed origins, methods, and headers
- Handles preflight OPTIONS requests
- Supports credentials (cookies, authorization headers)

### 3. Authentication (Admin routes only)
- Verifies JWT token from `Authorization: Bearer <token>` header
- Extracts user information from token payload
- Returns 401 for missing or invalid tokens

### 4. Authorization (Admin routes only)
- Checks if authenticated user has admin role
- Returns 403 for non-admin users

### 5. Rate Limiting
- **Admin endpoints:** 100 requests per minute per user
- **Public endpoints:** 1000 requests per hour per IP
- Returns 429 when limit exceeded
- Adds rate limit headers to responses

### 6. Controller Execution
- Validates request parameters
- Calls service layer methods
- Transforms entities to DTOs

### 7. Caching (GET requests only)
- **Public list:** 5 minutes cache
- **Public detail:** 1 hour cache with revalidation
- **Admin endpoints:** No cache
- Adds `Cache-Control`, `ETag`, and `Expires` headers

### 8. Error Handling
- Catches all exceptions
- Maps to appropriate HTTP status codes
- Formats consistent error responses
- Logs errors with context

## Route Definitions

### Admin Routes (Authentication Required)

All admin routes require:
- Valid JWT token in `Authorization` header
- User must have `admin` role
- Rate limited to 100 requests/minute

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/products` | Create new product |
| GET | `/api/v1/admin/products` | List all products (with filters) |
| GET | `/api/v1/admin/products/:id` | Get product by ID |
| PUT | `/api/v1/admin/products/:id` | Update product |
| DELETE | `/api/v1/admin/products/:id` | Soft delete product |

### Public Routes (No Authentication)

Public routes:
- No authentication required
- Rate limited to 1000 requests/hour per IP
- Cached responses (5 min for list, 1 hour for detail)
- Returns only active, non-deleted products

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products` | List active products |
| GET | `/api/v1/products/:id` | Get active product by ID |

## Configuration

### Environment Variables

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# JWT
JWT_SECRET=your-jwt-secret-key

# CORS
CORS_ORIGINS=https://example.com,https://app.example.com

# Optional
NODE_ENV=production
PORT=3000
```

### Custom Configuration

```typescript
const routes = createProductRoutes({
    productService,
    jwtVerifier,
    
    // CORS configuration
    corsOrigins: ['https://example.com'],
    // Or allow all origins (development only)
    // corsOrigins: '*',
    
    // Enable/disable features
    enableRateLimiting: true,
    enableCaching: true,
    
    // Custom logger
    logger: (level, message, meta) => {
        // Your logging implementation
        winston.log(level, message, meta);
    },
});
```

## Request Examples

### Create Product (Admin)

```bash
POST /api/v1/admin/products
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "price": 999.99,
  "category": "Electronics",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "iPhone 15",
  "description": "Latest iPhone model",
  "price": 999.99,
  "category": "Electronics",
  "status": "active",
  "images": [],
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

### List Products (Public)

```bash
GET /api/v1/products?category=Electronics&page=1&pageSize=20&sortBy=price&sortOrder=asc
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "iPhone 15",
      "price": 999.99,
      "category": "Electronics",
      "status": "active",
      "images": [],
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20,
  "totalPages": 1
}
```

**Response Headers:**
```
API-Version: v1
Cache-Control: public, max-age=300
ETag: "abc123"
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 3600
```

## Error Responses

### Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "fields": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ]
  }
}
```

### Authentication Error (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token."
  }
}
```

### Authorization Error (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required for this operation."
  }
}
```

### Not Found Error (404)

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID '123e4567-e89b-12d3-a456-426614174000' not found."
  }
}
```

### Rate Limit Error (429)

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

**Response Headers:**
```
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { createProductRoutes } from './product.routes';

describe('Product Routes', () => {
    it('should create routes with all middleware', () => {
        const routes = createProductRoutes({
            productService: mockProductService,
            jwtVerifier: mockJWTVerifier,
            corsOrigins: ['http://localhost:3000'],
        });

        expect(routes).toHaveLength(11); // 7 main routes + 4 OPTIONS
        expect(routes.find(r => r.path === '/api/v1/products')).toBeDefined();
    });
});
```

### Integration Testing

```typescript
import request from 'supertest';
import express from 'express';

describe('Product API Integration', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        // Register routes
        const routes = createProductRoutes(config);
        registerExpressRoutes(routes, app);
    });

    it('should list products', async () => {
        const response = await request(app)
            .get('/api/v1/products')
            .expect(200);

        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.headers['api-version']).toBe('v1');
    });

    it('should require auth for admin endpoints', async () => {
        await request(app)
            .post('/api/v1/admin/products')
            .send({ name: 'Test', price: 10, category: 'Test' })
            .expect(401);
    });
});
```

## Production Considerations

### 1. Rate Limiting

For distributed systems, replace in-memory rate limiter with Redis:

```typescript
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redis = new Redis(process.env.REDIS_URL);

const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    points: 100,
    duration: 60,
});
```

### 2. Caching

For distributed systems, use Redis for cache storage:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache middleware with Redis
const cacheMiddleware = async (key: string) => {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    // ... fetch data
    await redis.setex(key, 300, JSON.stringify(data));
    return data;
};
```

### 3. Logging

Use structured logging in production:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

const routes = createProductRoutes({
    // ...
    logger: (level, message, meta) => {
        logger.log(level, message, meta);
    },
});
```

### 4. Security Headers

Add security headers using helmet:

```typescript
import helmet from 'helmet';

app.use(helmet());
```

### 5. Request Validation

Add request body size limits:

```typescript
app.use(express.json({ limit: '10mb' }));
```

## Troubleshooting

### CORS Issues

If you're getting CORS errors:
1. Check `corsOrigins` configuration matches your frontend URL
2. Ensure frontend sends `Origin` header
3. Check browser console for specific CORS error

### Authentication Issues

If authentication is failing:
1. Verify JWT secret matches between services
2. Check token expiration time
3. Ensure `Authorization` header format is `Bearer <token>`

### Rate Limiting Issues

If rate limits are too restrictive:
1. Adjust `maxRequests` and `windowSeconds` in configuration
2. Use Redis for distributed rate limiting
3. Implement user-specific rate limits

## Next Steps

1. **Add monitoring:** Integrate with APM tools (New Relic, Datadog)
2. **Add metrics:** Track request counts, response times, error rates
3. **Add health checks:** Implement `/health` and `/ready` endpoints
4. **Add documentation:** Generate OpenAPI/Swagger documentation
5. **Add testing:** Implement comprehensive integration tests
