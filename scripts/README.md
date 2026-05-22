# 🔐 Authentication Scripts

This directory contains scripts to help you work with Supabase authentication.

---

## 📋 Available Scripts

### 1. Get Access Token
```bash
pnpm auth:token <email> <password>
```

**What it does:**
- Signs in to Supabase with your credentials
- Returns your access token and refresh token
- Shows ready-to-use curl commands
- Displays user info (email, role, expiry)

**Example:**
```bash
pnpm auth:token testadmin@example.com TestAdmin123!
```

**Output:**
- ✅ User information
- 🔑 Access token (copy this!)
- 📝 Ready-to-paste curl commands
- 🔄 Refresh token

---

### 2. Create Admin User
```bash
pnpm auth:create-admin <email> <password>
```

**What it does:**
- Creates a new user in Supabase
- Sets their role to 'admin'
- Confirms email automatically

**Example:**
```bash
pnpm auth:create-admin admin@example.com SecurePass123!
```

---

### 3. Update User Role
```bash
pnpm auth:update-role <email> <role>
```

**What it does:**
- Updates an existing user's role
- Valid roles: `admin`, `user`

**Example:**
```bash
pnpm auth:update-role user@example.com admin
```

---

### 4. Test Authentication
```bash
pnpm auth:test <email> <password>
```

**What it does:**
- Tests sign-in functionality
- Verifies token is valid
- Checks user role

**Example:**
```bash
pnpm auth:test testadmin@example.com TestAdmin123!
```

---

## 🚀 Quick Start Guide

### Step 1: Create an Admin User

```bash
pnpm auth:create-admin testadmin@example.com TestAdmin123!
```

### Step 2: Get Access Token

```bash
pnpm auth:token testadmin@example.com TestAdmin123!
```

### Step 3: Save Token to Variable

**Bash/Zsh:**
```bash
export TOKEN="<paste-token-here>"
```

**PowerShell:**
```powershell
$TOKEN="<paste-token-here>"
```

### Step 4: Test API

```bash
# Start API server
pnpm --filter @dakshinkali/api run dev

# Test authenticated endpoint
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Detailed Guides

| Guide | Description |
|-------|-------------|
| **QUICK_START.md** | Fast setup with copy-paste commands |
| **TOKEN_USAGE_GUIDE.md** | Complete guide to using access tokens |

---

## 🔑 Understanding Access Tokens

### What is an Access Token?

An access token is a **JWT (JSON Web Token)** that proves you're authenticated. It contains:
- User ID
- Email
- Role (admin/user)
- Expiration time (~1 hour)

### Where to Use It

**In curl commands:**
```bash
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**In JavaScript/TypeScript:**
```typescript
fetch('http://localhost:3002/api/v1/admin/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**In Postman/Insomnia:**
1. Go to **Authorization** tab
2. Select **Bearer Token**
3. Paste your token

---

## 🎯 Common Use Cases

### Testing Admin Endpoints

```bash
# Get token
pnpm auth:token admin@example.com password

# Save to variable
export TOKEN="<token>"

# Test endpoints
curl http://localhost:3002/api/v1/admin/products -H "Authorization: Bearer $TOKEN"
curl http://localhost:3002/api/v1/admin/products/123 -H "Authorization: Bearer $TOKEN"
```

### Creating Multiple Users

```bash
# Create admin
pnpm auth:create-admin admin@example.com AdminPass123!

# Create regular user
pnpm auth:create-admin user@example.com UserPass123!

# Update to regular user role
pnpm auth:update-role user@example.com user
```

### Debugging Auth Issues

```bash
# Test if credentials work
pnpm auth:test admin@example.com password

# Get fresh token
pnpm auth:token admin@example.com password

# Check user role in Supabase Dashboard
# Go to: Authentication > Users > Click user > Check raw_user_meta_data.role
```

---

## ❓ FAQ

### Q: Where do I paste the token in terminal?

**A:** You have two options:

**Option 1: Direct paste (one-time use)**
```bash
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Option 2: Save to variable (reusable)**
```bash
# Save it
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use it multiple times
curl http://localhost:3002/api/v1/admin/products -H "Authorization: Bearer $TOKEN"
curl http://localhost:3002/api/v1/admin/products/123 -H "Authorization: Bearer $TOKEN"
```

### Q: Why can't I see tokens in Supabase Dashboard?

**A:** Tokens are **not stored in the database**. They are:
- Generated on-demand during sign-in
- Session-based (temporary)
- Only visible in the authentication response

Use the `pnpm auth:token` script to get tokens for testing.

### Q: How long do tokens last?

**A:** Access tokens expire after **1 hour**. When expired, run the script again:
```bash
pnpm auth:token admin@example.com password
```

### Q: What's the difference between access token and refresh token?

| Token Type | Purpose | Lifetime | Usage |
|------------|---------|----------|-------|
| **Access Token** | Authenticate API requests | ~1 hour | Include in Authorization header |
| **Refresh Token** | Get new access tokens | ~7 days | Used by Supabase client to refresh |

For manual testing, you only need the **access token**.

### Q: Can I use the same token for multiple requests?

**A:** Yes! Until it expires (~1 hour), you can reuse the same token for all requests.

### Q: What if I get "Invalid JWT" error?

**Possible causes:**
1. Token expired → Get a new one
2. Token malformed → Copy the full token
3. Wrong environment → Check SUPABASE_URL in .env

**Solution:**
```bash
# Get fresh token
pnpm auth:token admin@example.com password
```

---

## 🛠️ Script Files

| File | Purpose |
|------|---------|
| `get-auth-token.js` | Get access token with formatted output |
| `create-admin-user.js` | Create new admin user |
| `update-user-role.js` | Change user role |
| `test-auth.js` | Test authentication flow |
| `save-token.sh` | Auto-save token to variable (bash) |
| `save-token.ps1` | Auto-save token to variable (PowerShell) |

---

## 🔒 Security Notes

⚠️ **Important:**
- Never commit tokens to git
- Don't share tokens publicly
- Tokens expire after 1 hour
- Use environment variables in production
- Don't log tokens in production code

---

## 📚 Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **JWT.io**: https://jwt.io (decode tokens to see contents)

---

## 🆘 Need Help?

1. Check **TOKEN_USAGE_GUIDE.md** for detailed examples
2. Check **QUICK_START.md** for fast setup
3. Check project README files for architecture docs
4. Run `pnpm auth:test` to verify your setup

---

**Happy authenticating! 🚀**
