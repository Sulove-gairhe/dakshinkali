# Authentication Scripts

**Automated scripts for Supabase Auth setup and management**

---

## 📋 Available Scripts

### 1. Apply Auth Migration

Applies the profiles table migration to your Supabase database.

**Usage**:
```bash
pnpm run auth:migrate
```

**What it does**:
- Links to your Supabase project
- Pushes all migrations to database
- Creates profiles table with RLS policies
- Sets up automatic profile creation trigger

**Files**:
- `apply-auth-migration.sh` (Unix/Mac/Linux)
- `apply-auth-migration.ps1` (Windows PowerShell)

---

### 2. Create Admin User

Creates a new user with admin role.

**Usage**:
```bash
pnpm run auth:create-admin <email> <password>
```

**Example**:
```bash
pnpm run auth:create-admin admin@example.com SecurePass123!
```

**What it does**:
- Creates user in auth.users
- Auto-confirms email
- Creates profile in public.profiles
- Sets role to 'admin'

**File**: `create-admin-user.js`

---

### 3. Update User Role

Updates an existing user's role.

**Usage**:
```bash
pnpm run auth:update-role <email> <role>
```

**Example**:
```bash
pnpm run auth:update-role user@example.com admin
```

**Valid roles**: `admin`, `customer`

**File**: `update-user-role.js`

---

### 4. Test Authentication

Tests the complete authentication flow.

**Usage**:
```bash
# Start API first
pnpm --filter @dakshinkali/api run dev

# In another terminal
pnpm run auth:test <email> <password>
```

**Example**:
```bash
pnpm run auth:test admin@example.com SecurePass123!
```

**What it tests**:
1. User login
2. JWT token generation
3. Profile retrieval
4. API authentication

**File**: `test-auth.js`

---

## 🚀 Quick Start

```bash
# 1. Apply migration
pnpm run auth:migrate

# 2. Create admin user
pnpm run auth:create-admin admin@example.com password

# 3. Test authentication
pnpm run auth:test admin@example.com password
```

---

## 📝 Requirements

### Environment Variables

All scripts require these environment variables in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Dependencies

- Node.js 18+
- pnpm
- Supabase CLI (already in package.json)
- @supabase/supabase-js
- node-fetch

---

## 🔧 Script Details

### apply-auth-migration.sh / .ps1

**Platform**: Cross-platform (auto-detected)

**Requirements**:
- Supabase CLI installed
- .env file with credentials
- Internet connection

**Process**:
1. Loads environment variables from .env
2. Extracts project ref from SUPABASE_URL
3. Links to Supabase project
4. Pushes migrations to database

**Error handling**:
- Checks for .env file
- Validates required variables
- Exits on link/push failure

---

### create-admin-user.js

**Platform**: Cross-platform (Node.js)

**Requirements**:
- @supabase/supabase-js installed
- Service role key in .env

**Process**:
1. Validates email and password
2. Creates user with admin.createUser()
3. Auto-confirms email
4. Updates profile role to 'admin'

**Validation**:
- Email must contain '@'
- Password must be 6+ characters
- Role defaults to 'admin'

---

### update-user-role.js

**Platform**: Cross-platform (Node.js)

**Requirements**:
- @supabase/supabase-js installed
- Service role key in .env

**Process**:
1. Validates role (admin or customer)
2. Finds user by email
3. Updates profile role

**Error handling**:
- User not found
- Invalid role
- Database errors

---

### test-auth.js

**Platform**: Cross-platform (Node.js)

**Requirements**:
- @supabase/supabase-js installed
- node-fetch installed
- API server running

**Process**:
1. Logs in with credentials
2. Extracts access token
3. Fetches user profile
4. Calls protected API endpoint

**Tests**:
- ✅ Login successful
- ✅ Token generated
- ✅ Profile exists with role
- ✅ API accepts token

---

## 🐛 Troubleshooting

### "Project not linked"

```bash
# Link manually
supabase link --project-ref your-project-ref
```

### "User already exists"

```bash
# Update existing user instead
pnpm run auth:update-role existing@example.com admin
```

### "Cannot connect to database"

```bash
# Check Supabase status
supabase status

# Verify .env credentials
cat .env | grep SUPABASE
```

### "Test fails with ECONNREFUSED"

```bash
# Make sure API is running
pnpm --filter @dakshinkali/api run dev
```

---

## 📚 Documentation

For detailed guides, see:
- `agent/docs/AUTH_CLI_GUIDE.md` - Complete CLI guide
- `agent/docs/AUTH_QUICK_REFERENCE.md` - Code snippets
- `agent/docs/AUTH_SETUP_COMPLETE.md` - Setup overview

---

## 🔒 Security Notes

1. **Never commit .env** - Contains sensitive keys
2. **Use strong passwords** - Generate with `openssl rand -base64 32`
3. **Service role key** - Keep secret, never expose to frontend
4. **Test locally first** - Use local Supabase before production

---

## 🎯 Best Practices

1. **Version control migrations** - Commit migration files
2. **Test before production** - Always test locally first
3. **Backup before migrations** - Backup production database
4. **Use environment variables** - Never hardcode credentials
5. **Strong passwords** - Use password generators

---

## 📊 Script Status

| Script | Status | Platform |
|--------|--------|----------|
| apply-auth-migration.sh | ✅ Ready | Unix/Mac/Linux |
| apply-auth-migration.ps1 | ✅ Ready | Windows |
| create-admin-user.js | ✅ Ready | Cross-platform |
| update-user-role.js | ✅ Ready | Cross-platform |
| test-auth.js | ✅ Ready | Cross-platform |

---

**All scripts are production-ready and tested!** 🚀
