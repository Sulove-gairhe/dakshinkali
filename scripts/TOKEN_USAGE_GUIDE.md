# 🔑 How to Get and Use Access Tokens

## Quick Start

### Step 1: Get Your Access Token

```bash
# Run the script with your credentials
pnpm auth:token admin@example.com YourPassword123

# Or directly with node
node scripts/get-auth-token.js admin@example.com YourPassword123
```

**Output will show:**
- ✅ User info (email, role, expiry)
- 🔑 Your access token
- 📝 Ready-to-use curl commands

---

## Step 2: Use the Token in Terminal

### Option A: Copy the Full Command (Easiest)

The script outputs ready-to-use commands. Just **copy and paste** them:

```bash
# Example output from script:
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Option B: Save Token to Variable (Reusable)

**For bash/zsh (Mac/Linux):**
```bash
# Save token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use it in requests
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN"
```

**For PowerShell (Windows):**
```powershell
# Save token
$TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Use it in requests
curl http://localhost:3002/api/v1/admin/products `
  -H "Authorization: Bearer $TOKEN"
```

---

## Step 3: Test Your API

### Test Admin Endpoints

```bash
# List all products (admin)
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN"

# Get single product (admin)
curl http://localhost:3002/api/v1/admin/products/123 \
  -H "Authorization: Bearer $TOKEN"

# Create product (admin)
curl -X POST http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "price": 99.99,
    "stock": 10,
    "category": "electronics"
  }'

# Update product (admin)
curl -X PUT http://localhost:3002/api/v1/admin/products/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product",
    "price": 149.99
  }'

# Delete product (admin)
curl -X DELETE http://localhost:3002/api/v1/admin/products/123 \
  -H "Authorization: Bearer $TOKEN"
```

### Test Public Endpoints (No Token Needed)

```bash
# List public products
curl http://localhost:3002/api/v1/products

# Get single product
curl http://localhost:3002/api/v1/products/123

# Search products
curl "http://localhost:3002/api/v1/products?search=laptop&category=electronics"
```

---

## Understanding the Token

### What is an Access Token?

An access token is a **JWT (JSON Web Token)** that proves you're authenticated. It contains:
- User ID
- Email
- Role (admin/user)
- Expiration time (~1 hour)

### Token Format

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Parts:**
1. **Header** (algorithm info)
2. **Payload** (user data)
3. **Signature** (verification)

### Where Tokens Are Stored

| Location | Storage Method | Use Case |
|----------|---------------|----------|
| **Browser** | localStorage/sessionStorage | Web apps |
| **Server** | HTTP-only cookies | SSR apps |
| **Mobile** | Secure storage | Native apps |
| **Terminal** | Environment variable | API testing |

---

## Common Issues

### ❌ "Invalid JWT" Error

**Cause:** Token expired or malformed

**Solution:**
```bash
# Get a fresh token
pnpm auth:token admin@example.com YourPassword123
```

### ❌ "403 Forbidden" Error

**Cause:** User doesn't have admin role

**Solution:**
```bash
# Update user role to admin
pnpm auth:update-role admin@example.com admin
```

### ❌ "401 Unauthorized" Error

**Cause:** Token not included or invalid

**Solution:**
```bash
# Make sure you're including the Authorization header
curl http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN"
#  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Don't forget this!
```

### ❌ Token Not Found in Dashboard

**Cause:** Tokens are NOT stored in the user table

**Explanation:** 
- Tokens are session-based and ephemeral
- They're generated on-demand during sign-in
- You can only see them in the authentication response
- Use this script to get tokens for testing

---

## Advanced Usage

### Using with Postman/Insomnia

1. Get token: `pnpm auth:token admin@example.com password`
2. Copy the access token
3. In Postman:
   - Go to **Authorization** tab
   - Select **Bearer Token**
   - Paste your token

### Using with JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
});

const token = data.session?.access_token;

// Use token in API calls
const response = await fetch('http://localhost:3002/api/v1/admin/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Automatic Token Refresh

Supabase automatically refreshes tokens before they expire when using the client library:

```typescript
// Client handles refresh automatically
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token; // Always fresh!
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `pnpm auth:token <email> <password>` | Get access token |
| `export TOKEN="..."` | Save token (bash) |
| `$TOKEN="..."` | Save token (PowerShell) |
| `curl ... -H "Authorization: Bearer $TOKEN"` | Use token in request |

---

## Security Notes

⚠️ **Never commit tokens to git**
⚠️ **Don't share tokens publicly**
⚠️ **Tokens expire after ~1 hour**
⚠️ **Use environment variables for production**

---

## Next Steps

1. ✅ Get your token: `pnpm auth:token admin@example.com password`
2. ✅ Save it to a variable: `export TOKEN="..."`
3. ✅ Test an endpoint: `curl ... -H "Authorization: Bearer $TOKEN"`
4. ✅ Build your app with proper auth flow

**Happy testing! 🚀**
