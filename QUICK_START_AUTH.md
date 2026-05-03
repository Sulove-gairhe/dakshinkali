# 🚀 Quick Start: Supabase Auth Setup

**3 simple steps to get authentication working**

---

## Step 1: Apply Migration (2 minutes)

### Get Instructions
```bash
pnpm run auth:migrate
```

This will show you:
- Direct link to your Supabase SQL Editor
- Migration file location
- Verification query

### Apply Migration
1. Click the link shown (or go to: https://supabase.com/dashboard/project/txpfjmnxifwiwqxwtxlf/sql/new)
2. Open `supabase/migrations/20260503000000_create_profiles_table.sql`
3. Copy ALL the SQL
4. Paste into Supabase SQL Editor
5. Click **"Run"**

### Verify
Run this in SQL Editor:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
```

Should return 1 row. ✅

---

## Step 2: Create Admin User (1 minute)

```bash
pnpm run auth:create-admin admin@example.com SecurePassword123!
```

**Expected output**:
```
✅ User created: [uuid]
📧 Email: admin@example.com
👑 Role set to: admin
```

---

## Step 3: Test Authentication (1 minute)

### Start API
```bash
pnpm --filter @dakshinkali/api run dev
```

### Test Auth (in another terminal)
```bash
pnpm run auth:test admin@example.com SecurePassword123!
```

**Expected output**:
```
✅ All tests passed!

Authentication is working correctly:
  ✓ User can log in
  ✓ JWT token is generated
  ✓ Profile exists with correct role
  ✓ API accepts and verifies token
```

---

## ✅ Success!

Your backend authentication is now fully functional! 🎉

---

## Next Steps

### Frontend Setup (Optional)

Add authentication to your Next.js apps:

1. **Update Web App** (`apps/web`):
   - Add `@dakshinkali/auth` to package.json
   - Wrap app with `<AuthProvider>`
   - Create login page

2. **Update Admin App** (`apps/admin`):
   - Same as web app
   - Add admin dashboard

**See**: `agent/docs/AUTH_IMPLEMENTATION_STEPS.md` for detailed frontend setup

---

## Useful Commands

```bash
# Create more users
pnpm run auth:create-admin user@example.com password123

# Change user role
pnpm run auth:update-role user@example.com customer

# Test auth anytime
pnpm run auth:test user@example.com password123

# Start all apps
pnpm dev
```

---

## Troubleshooting

### "User already exists"
```bash
pnpm run auth:update-role existing@example.com admin
```

### "401 Unauthorized" in test
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify API is running

### "403 Forbidden" in test
```bash
pnpm run auth:update-role user@example.com admin
```

---

## Documentation

- **Quick Reference**: `agent/docs/AUTH_QUICK_REFERENCE.md`
- **Complete Guide**: `agent/docs/AUTH_CLI_GUIDE.md`
- **Implementation Steps**: `agent/docs/AUTH_IMPLEMENTATION_STEPS.md`

---

**That's it! You're ready to build authenticated features.** 🚀
