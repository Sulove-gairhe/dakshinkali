# Installation Guide

## Prerequisites

- Node.js 18+ installed
- npm (comes with Node.js)

## Quick Install

### Option 1: Using npm (Recommended for Windows)

```bash
# Install dependencies
npm install

# Run tests
npm test
```

### Option 2: Using pnpm (Optional)

If you prefer pnpm:

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Run tests
pnpm test
```

## Verify Installation

After running `npm install`, verify the installation:

```bash
# Check if vitest is installed
npm list vitest

# Should show: vitest@1.0.0 or similar
```

## Run Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Expected Output

After running `npm test`, you should see:

```
✓ apps/api/src/modules/products/__tests__/integration/product-api.integration.test.ts (50)
✓ apps/api/src/modules/products/__tests__/integration/rate-limit.integration.test.ts (6)

Test Files  2 passed (2)
Tests  56 passed (56)
Duration  2.5s
```

## Troubleshooting

### "Missing script: test"

This means dependencies haven't been installed yet.

**Solution:**
```bash
npm install
```

### "Cannot find module 'vitest'"

Dependencies are missing or installation failed.

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### "pnpm: command not found"

You don't have pnpm installed. Use npm instead:

**Solution:**
```bash
# Use npm instead
npm install
npm test
```

Or install pnpm:
```bash
npm install -g pnpm
```

### Tests not running

Make sure you're in the project root directory:

```bash
# Check current directory
pwd

# Should show: /path/to/dakshinkali

# If not, navigate to project root
cd /path/to/dakshinkali
```

## Next Steps

After successful installation:

1. ✅ Run tests: `npm test`
2. ✅ Check coverage: `npm run test:coverage`
3. ✅ Review report: See `PRODUCTION_CONFIDENCE_REPORT.md`
4. ✅ Read quick start: See `TESTING_QUICKSTART.md`

## Package Manager Comparison

| Feature | npm | pnpm |
|---------|-----|------|
| Installation | Built-in with Node.js | Requires separate install |
| Speed | Standard | Faster |
| Disk Space | Standard | More efficient |
| Compatibility | Universal | Excellent |
| Recommended for | Windows, beginners | Advanced users |

**For this project:** Both npm and pnpm work perfectly. Use whichever you prefer!

## Development Workflow

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Run tests in watch mode during development
npm run test:watch

# 3. Run full test suite before committing
npm test

# 4. Check coverage before pushing
npm run test:coverage
```

## CI/CD Setup

The project is ready for CI/CD. Example GitHub Actions:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
```

## Support

For more detailed information:
- **Quick Start:** See `TESTING_QUICKSTART.md`
- **Detailed Setup:** See `apps/api/src/modules/products/__tests__/TESTING_SETUP_GUIDE.md`
- **Production Report:** See `apps/api/src/modules/products/__tests__/PRODUCTION_CONFIDENCE_REPORT.md`
