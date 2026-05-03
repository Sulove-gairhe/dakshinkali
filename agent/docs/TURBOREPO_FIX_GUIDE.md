# Turborepo Recursive Invocation Fix

## Problem Diagnosis

The `recursive_turbo_invocations` error occurred due to:

1. **Missing `pnpm-workspace.yaml`** - pnpm couldn't identify workspace packages
2. **Missing `package.json` in apps** - apps/web, apps/api, and apps/admin had no package.json
3. **Root executing its own dev script** - Turbo tried to run `dev` on root, which called `turbo run dev` again → infinite loop

## Solution Applied

### 1. Created `pnpm-workspace.yaml` ✅

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

This tells pnpm which directories contain workspace packages.

### 2. Created Missing `package.json` Files ✅

#### apps/web/package.json
- Next.js app on port 3000 (default)
- Script: `next dev`

#### apps/admin/package.json  
- Next.js admin app on port 3001
- Script: `next dev --port 3001`

#### apps/api/package.json
- Express API with nodemon
- Script: `nodemon src/app.ts`

### 3. Update `turbo.json` (MANUAL STEP REQUIRED)

**Current turbo.json:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {}
  }
}
```

**Replace with:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

**Key change:** Added `"persistent": true` to the `dev` task. This tells Turbo that dev servers are long-running processes.

### 4. Root `package.json` - No Changes Needed ✅

The root package.json is correct:
- `"dev": "turbo run dev"` - orchestrates dev across workspaces
- Root itself has NO dev server (correct behavior)
- Only apps have actual dev scripts

## How It Works Now

```
pnpm dev (root)
  ↓
turbo run dev
  ↓
  ├─ apps/web: next dev (port 3000)
  ├─ apps/admin: next dev --port 3001  
  └─ apps/api: nodemon src/app.ts
```

**No recursion** because:
- Root doesn't run its own dev task
- Turbo only runs dev in workspace packages (apps/*)
- Each app has a concrete dev command (not another turbo call)

## Next Steps

1. **Update turbo.json** with the content above (add `"persistent": true`)
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Run the monorepo:**
   ```bash
   pnpm dev
   ```

## Verification

After running `pnpm dev`, you should see:
- ✓ apps/web running on http://localhost:3000
- ✓ apps/admin running on http://localhost:3001  
- ✓ apps/api running (check console for port)
- ✗ No recursive turbo invocation errors

## Architecture Summary

```
shop-platform/ (root - orchestrator only)
├── apps/
│   ├── web/        ← Next.js storefront (runnable)
│   ├── admin/      ← Next.js admin panel (runnable)
│   └── api/        ← Express API (runnable)
├── packages/
│   ├── database/   ← Supabase client (shared library)
│   ├── types/      ← Shared TypeScript types
│   ├── ui/         ← Shared UI components
│   ├── utils/      ← Shared utilities
│   └── config/     ← Shared configs
└── package.json    ← Root orchestrator (NO dev server)
```

**Rule:** Only apps have `dev` scripts that start servers. Packages are libraries.
