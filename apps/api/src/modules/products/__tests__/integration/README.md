# Integration Tests - Product Module

## Overview

Comprehensive integration tests for the Product Module covering full-stack request/response flows with all middleware integrated.

## Test Files

### 1. `setup.ts`
Test environment configuration and utilities.

**Provides:**
- Mock Supabase client
- Mock JWT verifier
- Test context creation
- Route execution helper
- Data seeding utilities

### 2. `product-api.integration.test.ts`
Main integration test suite (50+ test cases).

**Covers:**
- Admin CRUD operations
- Public browsing operations
- Authentication and authorization
- Input validation
- Error handling
- CORS headers
- API versioning
- Error response format

### 3. `rate-limit.integration.test.ts`
Rate limiting integration tests.

**Covers:**
- Admin endpoint rate limiting (100/min)
- Public endpoint rate limiting (1000/hour)
- Rate limit headers
- Per-user and per-IP tracking

## Running Tests

### Run All Integration Tests
```bash
npm test -- apps/api/src/modules/products/__tests__/integration
```

### Run Specific Test File
```bash
npm test -- product-api.integration.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage apps/api/src/modules/products
```

### Watch Mode
```bash
npm test -- --watch product-api.integration.test.ts
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

```typescript
it('should create product with valid admin token', async () => {
    // Arrange - Set up test data
    const productData = {
        name: 'iPhone 15',
        price: 999.99,
        category: 'Electronics',
    };

    // Act - Execute the operation
    const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
        headers: { authorization: 'Bearer admin-token' },
        body: productData,
    });

    // Assert - Verify the results
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe('iPhone 15');
});
```

## Test Context

The test context provides:
- **supabase**: Mock Supabase client
- **productRepository**: Repository instance
- **imageStorageService**: Storage service instance
- **productService**: Service instance
- **adminController**: Admin controller instance
- **publicController**: Public controller instance
- **routes**: All registered routes
- **executeRoute**: Helper to execute routes

## Mock Data

### Mock JWT Tokens
- `admin-token`: Valid admin user token
- `user-token`: Valid non-admin user token
- `invalid-token`: Invalid token (triggers 401)

### Mock Users
- **Admin User:**
  - ID: `admin-user-id`
  - Email: `admin@example.com`
  - Role: `admin`

- **Regular User:**
  - ID: `regular-user-id`
  - Email: `user@example.com`
  - Role: `user`

## Test Categories

### 1. Admin Operations (Authentication Required)
- ✅ Product creation
- ✅ Product listing with filters
- ✅ Product retrieval
- ✅ Product update
- ✅ Product deletion (soft delete)

### 2. Public Operations (No Authentication)
- ✅ Active product listing
- ✅ Active product retrieval
- ✅ Filtering and sorting
- ✅ Pagination

### 3. Security
- ✅ Authentication enforcement
- ✅ Authorization enforcement
- ✅ Input validation
- ✅ Rate limiting

### 4. Performance
- ✅ Caching headers
- ✅ Rate limit headers
- ✅ Pagination

### 5. Error Handling
- ✅ Validation errors (400)
- ✅ Authentication errors (401)
- ✅ Authorization errors (403)
- ✅ Not found errors (404)
- ✅ Consistent error format

## Expected Results

### Test Metrics
- **Total Tests:** 50+
- **Pass Rate:** 100%
- **Execution Time:** < 5 seconds
- **Coverage:** 90%+ (business logic)

### Response Times (In-Memory)
- List endpoints: < 100ms
- Detail endpoints: < 50ms
- Create/Update: < 200ms

## Debugging Tests

### Enable Verbose Logging
```typescript
const ctx = createTestContext();
ctx.logger = (level, message, meta) => {
    console.log(`[${level}] ${message}`, meta);
};
```

### Inspect Test Data
```typescript
// View all products in mock database
const products = ctx.supabase.data.get('products');
console.log('Products:', products);
```

### Debug Route Execution
```typescript
const response = await ctx.executeRoute('GET', '/api/v1/products', {});
console.log('Response:', response);
console.log('Headers:', response.headers);
console.log('Body:', response.body);
```

## Common Issues

### Issue: Tests Failing with 401
**Cause:** Missing or invalid authorization header  
**Solution:** Add `headers: { authorization: 'Bearer admin-token' }`

### Issue: Tests Failing with 404
**Cause:** Product not found or deleted  
**Solution:** Ensure product is created before retrieval

### Issue: Tests Failing with 400
**Cause:** Invalid request data  
**Solution:** Check required fields and validation rules

### Issue: Rate Limit Tests Failing
**Cause:** Rate limiting disabled in test context  
**Solution:** Enable rate limiting in route configuration

## Extending Tests

### Adding New Test Cases

```typescript
describe('New Feature Tests', () => {
    let ctx: TestContext;

    beforeEach(() => {
        ctx = createTestContext();
    });

    it('should test new feature', async () => {
        // Arrange
        const testData = { /* ... */ };

        // Act
        const response = await ctx.executeRoute('POST', '/api/v1/admin/products', {
            headers: { authorization: 'Bearer admin-token' },
            body: testData,
        });

        // Assert
        expect(response.statusCode).toBe(201);
    });
});
```

### Adding New Mock Data

```typescript
beforeEach(() => {
    ctx = createTestContext();
    
    // Seed test data
    ctx.supabase.seedData('products', [
        {
            id: 'test-id-1',
            name: 'Test Product 1',
            price: 100,
            category: 'Test',
            status: 'active',
            images: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null,
        },
    ]);
});
```

## Best Practices

1. **Isolate Tests:** Each test should be independent
2. **Clean Up:** Use beforeEach/afterEach for cleanup
3. **Descriptive Names:** Test names should describe behavior
4. **Arrange-Act-Assert:** Follow AAA pattern
5. **Test One Thing:** Each test should verify one behavior
6. **Use Helpers:** Leverage test context helpers
7. **Mock External Services:** Don't call real APIs
8. **Verify Headers:** Check response headers
9. **Test Error Cases:** Don't just test happy paths
10. **Keep Tests Fast:** Avoid unnecessary delays

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- apps/api/src/modules/products/__tests__/integration
```

## Next Steps

1. **Add E2E Tests:** Test with real database
2. **Add Load Tests:** Test under realistic load
3. **Add Property Tests:** Test universal properties
4. **Add Smoke Tests:** Test production deployment
5. **Add Performance Tests:** Measure response times

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Integration Testing Best Practices](https://martinfowler.com/bliki/IntegrationTest.html)
- [API Testing Guide](https://www.postman.com/api-testing/)
