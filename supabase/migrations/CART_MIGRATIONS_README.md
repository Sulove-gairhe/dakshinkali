# Cart Module Database Migrations

**Created:** 2026-05-03  
**Module:** Cart Management  
**Status:** Ready for deployment

---

## Migration Files

### 1. `20260503110000_create_carts_table.sql`
Creates the `carts` table for storing user shopping carts.

**Features:**
- UUID primary key with auto-generation
- Support for both authenticated users (`user_id`) and anonymous users (`session_id`)
- CHECK constraint ensures either `user_id` OR `session_id` is set (not both, not neither)
- Automatic timestamp management (`created_at`, `updated_at`)
- Partial indexes for efficient lookups
- Auto-update trigger for `updated_at`

**Schema:**
```sql
carts (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carts_user_or_session CHECK (...)
)
```

**Indexes:**
- `idx_carts_user_id` - Partial index on `user_id` (WHERE user_id IS NOT NULL)
- `idx_carts_session_id` - Partial index on `session_id` (WHERE session_id IS NOT NULL)

---

### 2. `20260503110100_create_cart_items_table.sql`
Creates the `cart_items` table for storing items in shopping carts.

**Features:**
- UUID primary key with auto-generation
- Foreign key to `carts` with CASCADE DELETE
- Foreign key to `products` with CASCADE DELETE
- Quantity constraint (1-99)
- Price snapshot for historical pricing
- Unique constraint per product per cart
- Automatic timestamp management
- Auto-update trigger for `updated_at`

**Schema:**
```sql
cart_items (
  id UUID PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_snapshot NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_items_quantity_range CHECK (quantity >= 1 AND quantity <= 99),
  CONSTRAINT cart_items_price_positive CHECK (price_snapshot > 0),
  CONSTRAINT cart_items_unique_cart_product UNIQUE(cart_id, product_id)
)
```

**Indexes:**
- `idx_cart_items_cart_id` - Index on `cart_id` for fast cart items retrieval
- `idx_cart_items_product_id` - Index on `product_id` for fast product reference checks

---

## Dependencies

### Required Migrations
These migrations depend on:
1. **Products table** - `cart_items.product_id` references `products.id`
2. **update_updated_at_column() function** - Created in products migration

**Ensure these exist before running cart migrations.**

---

## Deployment Instructions

### Local Development (Supabase CLI)

```bash
# Navigate to project root
cd /path/to/project

# Run migrations
supabase db push

# Or apply specific migrations
supabase migration up
```

### Production (Supabase Dashboard)

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `20260503110000_create_carts_table.sql`
3. Execute migration
4. Copy contents of `20260503110100_create_cart_items_table.sql`
5. Execute migration
6. Verify tables and indexes created

---

## Verification Queries

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('carts', 'cart_items');
```

**Expected:** 2 rows (carts, cart_items)

---

### Check Indexes Exist
```sql
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('carts', 'cart_items');
```

**Expected:** 4 indexes
- `idx_carts_user_id`
- `idx_carts_session_id`
- `idx_cart_items_cart_id`
- `idx_cart_items_product_id`

---

### Check Constraints
```sql
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN ('carts'::regclass, 'cart_items'::regclass);
```

**Expected Constraints:**
- `carts_user_or_session` (CHECK)
- `cart_items_quantity_range` (CHECK)
- `cart_items_price_positive` (CHECK)
- `cart_items_unique_cart_product` (UNIQUE)
- Foreign keys for `cart_id` and `product_id`

---

### Check Triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('carts', 'cart_items');
```

**Expected:** 2 triggers
- `update_carts_updated_at` on `carts`
- `update_cart_items_updated_at` on `cart_items`

---

### Test CHECK Constraint (user_id OR session_id)
```sql
-- Should succeed (user_id set)
INSERT INTO carts (user_id) VALUES (gen_random_uuid());

-- Should succeed (session_id set)
INSERT INTO carts (session_id) VALUES ('test-session-123');

-- Should FAIL (both NULL)
INSERT INTO carts (user_id, session_id) VALUES (NULL, NULL);

-- Should FAIL (both set)
INSERT INTO carts (user_id, session_id) 
VALUES (gen_random_uuid(), 'test-session-123');

-- Cleanup
DELETE FROM carts WHERE user_id IS NOT NULL OR session_id IS NOT NULL;
```

---

### Test Quantity Constraint
```sql
-- Create test cart
INSERT INTO carts (user_id) VALUES (gen_random_uuid()) RETURNING id;

-- Should succeed (quantity = 1)
INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
VALUES ('<cart_id>', '<product_id>', 1, 99.99);

-- Should succeed (quantity = 99)
UPDATE cart_items SET quantity = 99 WHERE id = '<item_id>';

-- Should FAIL (quantity = 0)
UPDATE cart_items SET quantity = 0 WHERE id = '<item_id>';

-- Should FAIL (quantity = 100)
UPDATE cart_items SET quantity = 100 WHERE id = '<item_id>';

-- Cleanup
DELETE FROM carts WHERE id = '<cart_id>';
```

---

### Test CASCADE DELETE
```sql
-- Create test cart with items
INSERT INTO carts (user_id) VALUES (gen_random_uuid()) RETURNING id;
INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
VALUES ('<cart_id>', '<product_id>', 1, 99.99);

-- Delete cart (should cascade to cart_items)
DELETE FROM carts WHERE id = '<cart_id>';

-- Verify cart_items deleted
SELECT COUNT(*) FROM cart_items WHERE cart_id = '<cart_id>';
-- Expected: 0
```

---

### Test Unique Constraint
```sql
-- Create test cart
INSERT INTO carts (user_id) VALUES (gen_random_uuid()) RETURNING id;

-- Add product to cart
INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
VALUES ('<cart_id>', '<product_id>', 1, 99.99);

-- Should FAIL (duplicate product in same cart)
INSERT INTO cart_items (cart_id, product_id, quantity, price_snapshot)
VALUES ('<cart_id>', '<product_id>', 2, 99.99);

-- Cleanup
DELETE FROM carts WHERE id = '<cart_id>';
```

---

### Test updated_at Trigger
```sql
-- Create test cart
INSERT INTO carts (user_id) VALUES (gen_random_uuid()) RETURNING id, created_at, updated_at;

-- Wait 1 second
SELECT pg_sleep(1);

-- Update cart (should auto-update updated_at)
UPDATE carts SET user_id = gen_random_uuid() WHERE id = '<cart_id>' 
RETURNING created_at, updated_at;

-- Verify updated_at > created_at
SELECT created_at, updated_at, (updated_at > created_at) as trigger_works
FROM carts WHERE id = '<cart_id>';

-- Cleanup
DELETE FROM carts WHERE id = '<cart_id>';
```

---

## Rollback Instructions

### Rollback Order (Reverse of Creation)
```sql
-- Drop cart_items table first (has foreign key to carts)
DROP TABLE IF EXISTS cart_items CASCADE;

-- Drop carts table
DROP TABLE IF EXISTS carts CASCADE;
```

**Note:** Triggers are automatically dropped when tables are dropped.

---

## Performance Considerations

### Partial Indexes
- `idx_carts_user_id` and `idx_carts_session_id` are **partial indexes**
- Only index non-NULL values (saves space and improves performance)
- Queries with `WHERE user_id IS NOT NULL` will use the index

### Foreign Key Indexes
- `idx_cart_items_cart_id` speeds up JOIN queries and CASCADE DELETE
- `idx_cart_items_product_id` speeds up product reference checks

### Expected Query Performance
- Find cart by user_id: **< 10ms** (indexed)
- Find cart by session_id: **< 10ms** (indexed)
- Find cart items by cart_id: **< 20ms** (indexed)
- Delete cart with items: **< 50ms** (CASCADE DELETE)

---

## Security Considerations

### Row Level Security (RLS)
**Note:** RLS policies are NOT included in these migrations. They should be added separately based on your authentication strategy.

**Recommended RLS Policies:**

```sql
-- Enable RLS on carts
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own carts
CREATE POLICY carts_user_policy ON carts
  FOR ALL
  USING (user_id = auth.uid());

-- Enable RLS on cart_items
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only see items in their own carts
CREATE POLICY cart_items_user_policy ON cart_items
  FOR ALL
  USING (
    cart_id IN (
      SELECT id FROM carts WHERE user_id = auth.uid()
    )
  );
```

---

## Migration Status

- ✅ **Migration 1:** `20260503110000_create_carts_table.sql` - Ready
- ✅ **Migration 2:** `20260503110100_create_cart_items_table.sql` - Ready
- ⏳ **Deployment:** Pending
- ⏳ **Verification:** Pending

---

## Next Steps

1. ✅ Review migration files
2. ⏳ Deploy to local Supabase instance
3. ⏳ Run verification queries
4. ⏳ Test constraints and triggers
5. ⏳ Deploy to staging environment
6. ⏳ Deploy to production environment
7. ⏳ Proceed to Repository Layer implementation

---

**Created:** 2026-05-03  
**Status:** Ready for deployment  
**Phase:** Database Schema (Phase 1 of Cart Module)
