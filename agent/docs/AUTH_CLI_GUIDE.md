# Supabase Auth - CLI Setup Guide

**Complete authentication setup using Supabase CLI (no manual dashboard steps!)**

---

## 🎯 Overview

This guide uses the Supabase CLI and custom scripts to automate the entire auth setup process. No need to manually use the Supabase Dashboard!

---

## ✅ Prerequisites

- [x] Supabase CLI installed (already in package.json)
- [x] `.env` file with Supabase credentials
- [x] Supabase project created (remote or local)

---

## 📋 Quick Start (3 Commands)

```bash
# 1. Link to your Supabase project and apply migration
pnpm run auth:migrate

# 2. Create an admin user
pnpm run auth:create-admin admin@example.com SecurePass123!

# 3. Test authentication
pnpm run auth:test admin@example.com SecurePass123!
```

That's it! Your auth is now fully configured. 🎉

---

## 📖 Detailed Steps

### Step 1: Link to Supabase Project

First, link your local project to your remote Supabase project:

```bash
# Option A: Link to existing project
pnpm run db:link

# You'll be prompted for:
# - Project ref (from your Supabase URL)
# - Database password

# Option B: Use environment variables
# The auth:migrate script will do this automatically
```

**Get your project ref**:
- From URL: `https://YOUR_PROJECT_REF.supabase.co`
- Or from Supabase Dashboard > Project Settings > General

---

### Step 2: Apply Auth Migration

Apply the profiles table migration to your database:

```bash
pnpm run auth:migrate
```

**What this does**:
1. Links to your Supabase project (if not already linked)
2. Pushes all migrations in `supabase/migrations/` to your database
3. Creates the `profiles` table
4. Sets up RLS policies
5. Creates triggers for automatic profile creation

**Expected output**:
```
🔐 Applying Supabase Auth Migration...

📋 Project: your-project-ref

🔗 Linking to Supabase project...
✓ Linked to project

📦 Applying migrations...
✓ Applied migration 20260503000000_create_profiles_table.sql

✅ Migration applied successfully!
```

**Verify migration**:
```bash
# Check if profiles table exists
supabase db diff --schema public
```

---

### Step 3: Create Admin User

Create your first admin user:

```bash
pnpm run auth:create-admin <email> <password>
```

**Example**:
```bash
pnpm run auth:create-admin admin@example.com MySecurePassword123!
```

**What this does**:
1. Creates a new user in `auth.users`
2. Auto-confirms the email (no confirmation needed)
3. Creates a profile in `public.profiles`
4. Sets the role to `admin`

**Expected output**:
```
🔐 Creating admin user...

✅ User created: 12345678-1234-1234-1234-123456789012
📧 Email: admin@example.com
👑 Role set to: admin

✅ Admin user created successfully!

You can now log in with:
  Email: admin@example.com
  Password: MySecurePassword123!
```

---

### Step 4: Test Authentication

Test the complete auth flow:

```bash
# Make sure API is running first
pnpm --filter @dakshinkali/api run dev

# In another terminal, run the test
pnpm run auth:test <email> <password>
```

**Example**:
```bash
pnpm run auth:test admin@example.com MySecurePassword123!
```

**What this tests**:
1. ✅ User can log in with credentials
2. ✅ JWT access token is generated
3. ✅ User profile exists with correct role
4. ✅ API accepts and verifies the token
5. ✅ Protected endpoint returns data

**Expected output**:
```
🧪 Testing Authentication Flow...

1️⃣  Logging in...
   ✅ Login successful
   👤 User ID: 12345678-1234-1234-1234-123456789012
   📧 Email: admin@example.com

2️⃣  Getting access token...
   ✅ Token obtained
   🔑 Token (first 50 chars): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOi...

3️⃣  Fetching user profile...
   ✅ Profile fetched
   👑 Role: admin
   📝 Full Name: (not set)

4️⃣  Testing API endpoint...
   📡 Calling: http://localhost:3002/api/v1/admin/products
   ✅ API call successful
   📦 Products count: 0

✅ All tests passed!

Authentication is working correctly:
  ✓ User can log in
  ✓ JWT token is generated
  ✓ Profile exists with correct role
  ✓ API accepts and verifies token
```

---

## 🛠️ Additional Commands

### Update User Role

Change a user's role:

```bash
pnpm run auth:update-role <email> <role>
```

**Examples**:
```bash
# Promote user to admin
pnpm run auth:update-role user@example.com admin

# Demote admin to customer
pnpm run auth:update-role admin@example.com customer
```

**Valid roles**: `admin`, `customer`

---

### Database Commands

```bash
# Push all migrations to remote database
pnpm run db:push

# Create a new migration
pnpm run db:migration:new <migration_name>

# Example: Create a new migration
pnpm run db:migration:new add_user_preferences

# Reset local database (WARNING: deletes all data)
pnpm run db:reset

# Start local Supabase (for development)
pnpm run db:start

# Stop local Supabase
pnpm run db:stop
```

---

### Supabase CLI Commands

```bash
# View database status
supabase status

# View database logs
supabase logs db

# View auth logs
supabase logs auth

# Open Supabase Studio (local UI)
supabase studio

# Generate TypeScript types from database
supabase gen types typescript --local > types/supabase.ts

# View all users
supabase db query "SELECT id, email, created_at FROM auth.users"

# View all profiles
supabase db query "SELECT * FROM public.profiles"
```

---

## 🔍 Verification Queries

Run these SQL queries to verify your setup:

```bash
# Check if profiles table exists
supabase db query "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
"

# Check RLS is enabled
supabase db query "
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'profiles'
"

# List all users with roles
supabase db query "
  SELECT p.id, p.email, p.role, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC
"

# Count users by role
supabase db query "
  SELECT role, COUNT(*) as count
  FROM public.profiles
  GROUP BY role
"

# Find all admins
supabase db query "
  SELECT email, full_name 
  FROM public.profiles 
  WHERE role = 'admin'
"
```

---

## 🐛 Troubleshooting

### Issue: "Project not linked"

**Solution**:
```bash
# Link manually
pnpm run db:link

# Or set environment variable
export SUPABASE_PROJECT_REF=your-project-ref
```

### Issue: "Migration already applied"

**Solution**:
```bash
# Check migration status
supabase migration list

# If migration is already applied, you're good!
```

### Issue: "User already exists"

**Solution**:
```bash
# Update existing user's role instead
pnpm run auth:update-role existing@example.com admin
```

### Issue: "Cannot connect to database"

**Solution**:
```bash
# Check if local Supabase is running
supabase status

# If not, start it
pnpm run db:start

# Or check your .env file for correct credentials
```

### Issue: "Test fails with 401 Unauthorized"

**Solution**:
```bash
# Verify JWT secret is correct
echo $SUPABASE_SERVICE_ROLE_KEY

# Check if API is using Supabase auth (not mock)
# Should see "Supabase JWT verifier" in API logs
```

### Issue: "Test fails with 403 Forbidden"

**Solution**:
```bash
# Check user role
supabase db query "
  SELECT email, role 
  FROM public.profiles 
  WHERE email = 'your-email@example.com'
"

# Update to admin if needed
pnpm run auth:update-role your-email@example.com admin
```

---

## 📁 Script Files

All scripts are located in `scripts/` directory:

| Script | Purpose |
|--------|---------|
| `apply-auth-migration.sh` | Links project and applies migrations |
| `create-admin-user.js` | Creates a new admin user |
| `update-user-role.js` | Updates user role |
| `test-auth.js` | Tests complete auth flow |

---

## 🔄 Workflow Examples

### Development Workflow

```bash
# 1. Start local Supabase
pnpm run db:start

# 2. Apply migrations
pnpm run db:push

# 3. Create test admin
pnpm run auth:create-admin dev@example.com password123

# 4. Start API
pnpm --filter @dakshinkali/api run dev

# 5. Test auth
pnpm run auth:test dev@example.com password123
```

### Production Deployment

```bash
# 1. Link to production project
supabase link --project-ref your-prod-ref

# 2. Apply migrations
pnpm run db:push

# 3. Create production admin (use strong password!)
pnpm run auth:create-admin admin@yourdomain.com $(openssl rand -base64 32)

# 4. Verify
supabase db query "SELECT email, role FROM public.profiles WHERE role = 'admin'"
```

### Adding New Users

```bash
# Create customer user
pnpm run auth:create-admin customer@example.com password123

# Update to customer role (default is admin in script)
pnpm run auth:update-role customer@example.com customer

# Verify
supabase db query "SELECT email, role FROM public.profiles WHERE email = 'customer@example.com'"
```

---

## 🎓 Best Practices

### 1. Use Environment Variables

Never hardcode credentials:
```bash
# Good
pnpm run auth:create-admin $ADMIN_EMAIL $ADMIN_PASSWORD

# Bad
pnpm run auth:create-admin admin@example.com password123
```

### 2. Use Strong Passwords

Generate secure passwords:
```bash
# Generate random password
openssl rand -base64 32

# Use in script
pnpm run auth:create-admin admin@example.com $(openssl rand -base64 32)
```

### 3. Version Control Migrations

Always commit migration files:
```bash
git add supabase/migrations/
git commit -m "Add auth migration"
```

### 4. Test Before Production

Always test migrations locally first:
```bash
# Test locally
pnpm run db:start
pnpm run db:push
pnpm run auth:test admin@example.com password

# Then apply to production
supabase link --project-ref prod-ref
pnpm run db:push
```

### 5. Backup Before Migrations

Backup production database before applying migrations:
```bash
# Backup via Supabase Dashboard
# Or use pg_dump if you have direct access
```

---

## 📚 Next Steps

After completing CLI setup:

1. ✅ **Frontend Setup**: Add AuthProvider to Next.js apps
2. ✅ **Create Login Pages**: Use auth hooks
3. ✅ **Test End-to-End**: Login → API call → Success
4. ✅ **Deploy**: Apply migrations to production

**See**: `AUTH_IMPLEMENTATION_STEPS.md` for frontend setup

---

## 🎉 Success Checklist

- [ ] Migration applied successfully
- [ ] Admin user created
- [ ] Auth test passes all checks
- [ ] API accepts JWT tokens
- [ ] Role-based access works
- [ ] Ready for frontend integration

---

**All done via CLI! No manual dashboard steps needed.** 🚀
