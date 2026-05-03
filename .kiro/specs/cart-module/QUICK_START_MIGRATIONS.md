# Quick Start: Apply Cart Module Migrations

**Time Required:** 5-10 minutes  
**Difficulty:** Easy

---

## Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: **Dakshinkali Electronics**
3. Click: **SQL Editor** (left sidebar)

---

## Step 2: Apply Migration 1 (Carts Table)

1. Click: **New Query**
2. Open file: `supabase/migrations/20260503110000_create_carts_table.sql`
3. Copy **entire contents** of the file
4. Paste into SQL Editor
5. Click: **Run** (or press `Ctrl+Enter`)
6. Verify: "Success. No rows returned"

---

## Step 3: Apply Migration 2 (Cart Items Table)

1. Click: **New Query** (or clear previous query)
2. Open file: `supabase/migrations/20260503110100_create_cart_items_table.sql`
3. Copy **entire contents** of the file
4. Paste into SQL Editor
5. Click: **Run** (or press `Ctrl+Enter`)
6. Verify: "Success. No rows returned"

---

## Step 4: Verify Tables Created

1. Go to: **Database** → **Tables** (left sidebar)
2. Confirm you see:
   - ✅ `carts` table
   - ✅ `cart_items` table

---

## Step 5: Run Verification Script

Open your terminal and run:

```bash
node scripts/verify-cart-migrations.js
```

**Expected Output:**
```
✅ All migration tests passed successfully!
📊 Verified:
   ✅ Tables created (carts, cart_items)
   ✅ Indexes created
   ✅ CHECK constraints working
   ✅ UNIQUE constraints working
   ✅ Triggers working (updated_at)
   ✅ Foreign key cascades working
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution:** Tables already created. Skip to Step 4 to verify.

### Error: "function update_updated_at_column() does not exist"
**Solution:** This function should exist from the products migration. If not, add this to your SQL:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "table products does not exist"
**Solution:** The products table must exist first. Apply products migrations before cart migrations.

---

## What Gets Created

### Tables
- `carts` - Shopping carts for users and guests
- `cart_items` - Items within shopping carts

### Indexes (4 total)
- `idx_carts_user_id` - Fast user cart lookup
- `idx_carts_session_id` - Fast guest cart lookup
- `idx_cart_items_cart_id` - Fast cart items retrieval
- `idx_cart_items_product_id` - Fast product reference checks

### Constraints
- `carts_user_or_session` - Ensures either user_id OR session_id (not both)
- `cart_items_quantity_range` - Quantity must be 1-99
- `cart_items_price_positive` - Price must be > 0
- `cart_items_unique_cart_product` - One product per cart (no duplicates)

### Triggers
- `update_carts_updated_at` - Auto-updates updated_at on cart changes
- `update_cart_items_updated_at` - Auto-updates updated_at on item changes

### Foreign Keys
- `cart_items.cart_id` → `carts.id` (CASCADE DELETE)
- `cart_items.product_id` → `products.id` (CASCADE DELETE)

---

## Next Steps

After migrations are applied and verified:

1. ✅ Mark Task 1.5 as complete
2. ✅ Proceed to Task 2.1: Create Cart entity
3. ✅ Begin Repository Layer implementation

---

**Need Help?** Check the full report: `.kiro/specs/cart-module/MIGRATION_TEST_REPORT.md`

