# 🚀 Quick Start: Using Access Tokens

## ✅ What You Just Did

You successfully:
1. ✅ Created a test admin user: `testadmin@example.com`
2. ✅ Got an access token (valid for 1 hour)
3. ✅ Ready to test your API!

---

## 📋 Copy-Paste Commands

### Step 1: Save Token to Variable

**For bash/zsh (Mac/Linux/Git Bash):**
```bash
export TOKEN="eyJhbGciOiJFUzI1NiIsImtpZCI6ImQ1NWJiNjBjLTAzN2QtNGM4Ny04MTI2LWQwN2YwMzNkNDNjOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3R4cGZqbW54aWZ3aXdxeHd0eGxmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyYzFmMGQwZC1iYTQ3LTQwZDktYWM1Yy1hMDAzMDBmZjc1MmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc3ODA4Njc1LCJpYXQiOjE3Nzc4MDUwNzUsImVtYWlsIjoidGVzdGFkbWluQGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicm9sZSI6ImFkbWluIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Nzc4MDUwNzV9XSwic2Vzc2lvbl9pZCI6ImRkMzYwZjNjLTM4MDUtNDRiNi05YWFhLWMzYmEyNTg3ZDA1MiIsImlzX2Fub255bW91cyI6ZmFsc2V9._RZLWr2JN-a5UnnV4BFdeN0EXVrs2C25mdrn_ckAmNjs-pekOaVXWLBtVao_51GYP0Y_YEHTBe_8xP7CmRoDpQ"
```

**For PowerShell (Windows):**
```powershell
$TOKEN="eyJhbGciOiJFUzI1NiIsImtpZCI6ImQ1NWJiNjBjLTAzN2QtNGM4Ny04MTI2LWQwN2YwMzNkNDNjOCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3R4cGZqbW54aWZ3aXdxeHd0eGxmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIyYzFmMGQwZC1iYTQ3LTQwZDktYWM1Yy1hMDAzMDBmZjc1MmQiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc3ODA4Njc1LCJpYXQiOjE3Nzc4MDUwNzUsImVtYWlsIjoidGVzdGFkbWluQGV4YW1wbGUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicm9sZSI6ImFkbWluIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Nzc4MDUwNzV9XSwic2Vzc2lvbl9pZCI6ImRkMzYwZjNjLTM4MDUtNDRiNi05YWFhLWMzYmEyNTg3ZDA1MiIsImlzX2Fub255bW91cyI6ZmFsc2V9._RZLWr2JN-a5UnnV4BFdeN0EXVrs2C25mdrn_ckAmNjs-pekOaVXWLBtVao_51GYP0Y_YEHTBe_8xP7CmRoDpQ"
```

### Step 2: Test API Endpoints

**Make sure your API is running first:**
```bash
pnpm --filter @dakshinkali/api run dev
```

**Then test these commands:**

```bash
# Test admin endpoint (requires auth)
curl http://localhost:3002/api/v1/admin/products -H "Authorization: Bearer $TOKEN"

# Test public endpoint (no auth needed)
curl http://localhost:3002/api/v1/products

# Create a product (admin only)
curl -X POST http://localhost:3002/api/v1/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Laptop",
    "description": "A test laptop",
    "price": 999.99,
    "stock": 5,
    "category": "electronics"
  }'
```

---

## 🔄 When Token Expires (After 1 Hour)

Just run the script again:

```bash
pnpm auth:token testadmin@example.com TestAdmin123!
```

Then copy the new token and save it to `$TOKEN` again.

---

## 📚 More Information

- **Full guide**: `scripts/TOKEN_USAGE_GUIDE.md`
- **All auth commands**: `pnpm run` (see auth:* scripts)

---

## 🎯 Your Test Credentials

| Field | Value |
|-------|-------|
| **Email** | testadmin@example.com |
| **Password** | TestAdmin123! |
| **Role** | admin |
| **Token Expires** | 60 minutes |

---

## ✨ What's Next?

Now you can:
1. ✅ Test all your API endpoints with authentication
2. ✅ Build your frontend with proper auth flow
3. ✅ Create more users with different roles
4. ✅ Implement protected routes

**Happy coding! 🚀**
