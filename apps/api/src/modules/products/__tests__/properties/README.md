# Property-Based Tests for Product Module

This directory contains property-based tests that validate universal correctness properties across all inputs for the Product Module.

## What is Property-Based Testing?

Property-based testing (PBT) validates that certain properties hold true for ALL possible inputs, not just specific examples. Instead of writing individual test cases, you define properties (invariants) that should always be true, and the testing framework generates hundreds of random inputs to verify the property.

## Framework

We use **fast-check** for property-based testing in TypeScript.

## Test Configuration

- **Minimum iterations**: 100 runs per property test (as per spec requirements)
- **Verbose mode**: Enabled to show detailed output on failures
- **Tag format**: `Feature: product-module, Property {number}: {property_text}`

## Implemented Property Tests

### Property 1: Filter Correctness ✅

**File**: `filter-correctness.property.test.ts`

**Validates**: Requirements 2.2, 5.3, 5.4

**Property Statement**: For any combination of filters (category, price range, status) applied to a product query, all returned products SHALL match ALL specified filter criteria.

**Test Coverage**:
1. **Main property test**: Verifies all returned products match ALL filters and all excluded products fail at least one filter
2. **Category filter**: Verifies category filtering works correctly
3. **Status filter**: Verifies status filtering works correctly
4. **Price range filter**: Verifies minPrice and maxPrice filtering works correctly
5. **Search filter**: Verifies case-insensitive search in name and description
6. **Soft delete exclusion**: Verifies deleted products are excluded when includeDeleted=false
7. **Soft delete inclusion**: Verifies deleted products are included when includeDeleted=true
8. **Multiple filters**: Verifies combination of filters works correctly
9. **Empty result**: Verifies empty array returned when no products match
10. **Empty input**: Verifies empty array returned for empty product list
11. **No filters**: Verifies default behavior with no filters applied

**Generators**:
- `productEntityArbitrary`: Generates random valid ProductEntity objects
- `productStatusArbitrary`: Generates random ProductStatus values
- `repositoryFiltersArbitrary`: Generates random filter combinations with validation

**Key Features**:
- Tests 100+ random combinations per property
- Validates both inclusion (products that match) and exclusion (products that don't match)
- Tests edge cases (empty lists, no filters, impossible filters)
- Tests individual filters and combinations
- Ensures minPrice <= maxPrice constraint

## Running Property Tests

```bash
# Run all property tests
npm test -- apps/api/src/modules/products/__tests__/properties

# Run specific property test
npm test -- apps/api/src/modules/products/__tests__/properties/filter-correctness.property.test.ts

# Run with watch mode
npm run test:watch -- apps/api/src/modules/products/__tests__/properties
```

## Understanding Test Output

When a property test **passes**:
- The property holds for all 100+ generated test cases
- No counterexamples were found

When a property test **fails**:
- fast-check will show the **smallest failing example** (shrunk counterexample)
- The output shows the exact input that violated the property
- Use this to debug and fix the implementation

## Future Property Tests

The following property tests are planned (see tasks.md):

- **Property 2**: Public API Exclusion of Deleted and Inactive Products
- **Property 3**: DTO Mapping Correctness
- **Property 4**: DTO Internal Field Exclusion
- **Property 5**: DTO CamelCase Naming Convention
- **Property 6**: Repository Row-to-Entity Mapping
- **Property 7**: Filename Uniqueness
- **Property 8**: Image File Validation
- **Property 9**: Error Response Format Consistency
- **Property 10**: ISO 8601 Timestamp Formatting
- **Property 11**: DTO Mapper Error Handling
- **Property 12**: DTO Mapper Null Handling
- **Property 13**: Sort Order Correctness
- **Property 14**: Search Result Relevance

## Best Practices

1. **Keep properties simple**: Each property should test one invariant
2. **Use meaningful generators**: Ensure generated data is realistic
3. **Test edge cases**: Include tests for empty inputs, boundary values
4. **Document properties clearly**: State what the property validates
5. **Tag tests properly**: Use the format specified in the spec
6. **Run enough iterations**: Minimum 100 runs per property

## References

- [fast-check documentation](https://fast-check.dev/)
- [Property-Based Testing Guide](https://fast-check.dev/docs/introduction/)
- Product Module Design Document: `.kiro/specs/product-module/design.md`
- Product Module Requirements: `.kiro/specs/product-module/requirements.md`
