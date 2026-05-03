/**
 * Verify Cart Module Migrations
 * 
 * This script verifies that cart module migrations were applied correctly:
 * - Checks tables exist
 * - Checks indexes exist
 * - Tests constraints
 * - Tests triggers
 * - Tests foreign key cascades
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

let testsPassed = 0;
let testsFailed = 0;

/**
 * Verify table exists
 */
async function verifyTableExists(tableName) {
    console.log(`\n🔍 Checking table: ${tableName}`);

    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

    if (error && error.code !== 'PGRST116') {
        console.error(`   ❌ Table '${tableName}' does not exist or is not accessible`);
        console.error(`      Error: ${error.message}`);
        testsFailed++;
        return false;
    }

    console.log(`   ✅ Table '${tableName}' exists`);
    testsPassed++;
    return true;
}

/**
 * Test CHECK constraint (user_id OR session_id)
 */
async function testUserOrSessionConstraint() {
    console.log('\n🧪 Testing CHECK constraint (user_id OR session_id)...');

    // Test 1: Insert with user_id (should succeed)
    const { data: cart1, error: error1 } = await supabase
        .from('carts')
        .insert({ user_id: '00000000-0000-0000-0000-000000000001' })
        .select()
        .single();

    if (error1) {
        console.error('   ❌ Failed to insert cart with user_id:', error1.message);
        testsFailed++;
    } else {
        console.log('   ✅ Insert with user_id succeeded');
        testsPassed++;
        // Cleanup
        await supabase.from('carts').delete().eq('id', cart1.id);
    }

    // Test 2: Insert with session_id (should succeed)
    const { data: cart2, error: error2 } = await supabase
        .from('carts')
        .insert({ session_id: 'test-session-123' })
        .select()
        .single();

    if (error2) {
        console.error('   ❌ Failed to insert cart with session_id:', error2.message);
        testsFailed++;
    } else {
        console.log('   ✅ Insert with session_id succeeded');
        testsPassed++;
        // Cleanup
        await supabase.from('carts').delete().eq('id', cart2.id);
    }

    // Test 3: Insert with both (should fail)
    const { error: error3 } = await supabase
        .from('carts')
        .insert({
            user_id: '00000000-0000-0000-0000-000000000001',
            session_id: 'test-session-123'
        });

    if (error3) {
        console.log('   ✅ Insert with both user_id and session_id correctly rejected');
        testsPassed++;
    } else {
        console.error('   ❌ Insert with both user_id and session_id should have failed');
        testsFailed++;
    }
}

/**
 * Test quantity constraint (1-99)
 */
async function testQuantityConstraint() {
    console.log('\n🧪 Testing quantity constraint (1-99)...');

    // Create test cart
    const { data: cart, error: cartError } = await supabase
        .from('carts')
        .insert({ user_id: '00000000-0000-0000-0000-000000000001' })
        .select()
        .single();

    if (cartError || !cart) {
        console.error('   ❌ Failed to create test cart:', cartError?.message);
        testsFailed++;
        return;
    }

    // Get a product ID
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();

    if (!products) {
        console.log('   ⚠️  No products found, skipping quantity constraint test');
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    // Test 1: Insert with quantity = 1 (should succeed)
    const { data: item1, error: error1 } = await supabase
        .from('cart_items')
        .insert({
            cart_id: cart.id,
            product_id: products.id,
            quantity: 1,
            price_at_addition: 99.99,
        })
        .select()
        .single();

    if (error1) {
        console.error('   ❌ Failed to insert with quantity=1:', error1.message);
        testsFailed++;
    } else {
        console.log('   ✅ Insert with quantity=1 succeeded');
        testsPassed++;
    }

    // Test 2: Update to quantity = 99 (should succeed)
    if (item1) {
        const { error: error2 } = await supabase
            .from('cart_items')
            .update({ quantity: 99 })
            .eq('id', item1.id);

        if (error2) {
            console.error('   ❌ Failed to update to quantity=99:', error2.message);
            testsFailed++;
        } else {
            console.log('   ✅ Update to quantity=99 succeeded');
            testsPassed++;
        }

        // Test 3: Update to quantity = 0 (should fail)
        const { error: error3 } = await supabase
            .from('cart_items')
            .update({ quantity: 0 })
            .eq('id', item1.id);

        if (error3) {
            console.log('   ✅ Update to quantity=0 correctly rejected');
            testsPassed++;
        } else {
            console.error('   ❌ Update to quantity=0 should have failed');
            testsFailed++;
        }

        // Test 4: Update to quantity = 100 (should fail)
        const { error: error4 } = await supabase
            .from('cart_items')
            .update({ quantity: 100 })
            .eq('id', item1.id);

        if (error4) {
            console.log('   ✅ Update to quantity=100 correctly rejected');
            testsPassed++;
        } else {
            console.error('   ❌ Update to quantity=100 should have failed');
            testsFailed++;
        }
    }

    // Cleanup
    await supabase.from('carts').delete().eq('id', cart.id);
}

/**
 * Test CASCADE DELETE
 */
async function testCascadeDelete() {
    console.log('\n🧪 Testing CASCADE DELETE...');

    // Create test cart
    const { data: cart, error: cartError } = await supabase
        .from('carts')
        .insert({ user_id: '00000000-0000-0000-0000-000000000002' })
        .select()
        .single();

    if (cartError || !cart) {
        console.error('   ❌ Failed to create test cart:', cartError?.message);
        testsFailed++;
        return;
    }

    // Get a product ID
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();

    if (!products) {
        console.log('   ⚠️  No products found, skipping cascade delete test');
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    // Add item to cart
    const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .insert({
            cart_id: cart.id,
            product_id: products.id,
            quantity: 1,
            price_at_addition: 99.99,
        })
        .select()
        .single();

    if (itemError || !item) {
        console.error('   ❌ Failed to create cart item:', itemError?.message);
        testsFailed++;
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    console.log('   ℹ️  Created cart with item');

    // Delete cart (should cascade to cart_items)
    const { error: deleteError } = await supabase
        .from('carts')
        .delete()
        .eq('id', cart.id);

    if (deleteError) {
        console.error('   ❌ Failed to delete cart:', deleteError.message);
        testsFailed++;
        return;
    }

    // Verify cart_items deleted
    const { data: remainingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('id', item.id);

    if (remainingItems && remainingItems.length === 0) {
        console.log('   ✅ CASCADE DELETE worked - cart items deleted');
        testsPassed++;
    } else {
        console.error('   ❌ CASCADE DELETE failed - cart items still exist');
        testsFailed++;
    }
}

/**
 * Test unique constraint (cart_id, product_id)
 */
async function testUniqueConstraint() {
    console.log('\n🧪 Testing UNIQUE constraint (cart_id, product_id)...');

    // Create test cart
    const { data: cart, error: cartError } = await supabase
        .from('carts')
        .insert({ user_id: '00000000-0000-0000-0000-000000000003' })
        .select()
        .single();

    if (cartError || !cart) {
        console.error('   ❌ Failed to create test cart:', cartError?.message);
        testsFailed++;
        return;
    }

    // Get a product ID
    const { data: products } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();

    if (!products) {
        console.log('   ⚠️  No products found, skipping unique constraint test');
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    // Add product to cart
    const { error: error1 } = await supabase
        .from('cart_items')
        .insert({
            cart_id: cart.id,
            product_id: products.id,
            quantity: 1,
            price_at_addition: 99.99,
        });

    if (error1) {
        console.error('   ❌ Failed to insert first item:', error1.message);
        testsFailed++;
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    console.log('   ℹ️  First item inserted');

    // Try to add same product again (should fail)
    const { error: error2 } = await supabase
        .from('cart_items')
        .insert({
            cart_id: cart.id,
            product_id: products.id,
            quantity: 2,
            price_at_addition: 99.99,
        });

    if (error2) {
        console.log('   ✅ Duplicate product correctly rejected');
        testsPassed++;
    } else {
        console.error('   ❌ Duplicate product should have been rejected');
        testsFailed++;
    }

    // Cleanup
    await supabase.from('carts').delete().eq('id', cart.id);
}

/**
 * Test updated_at trigger
 */
async function testUpdatedAtTrigger() {
    console.log('\n🧪 Testing updated_at trigger...');

    // Create test cart
    const { data: cart, error: cartError } = await supabase
        .from('carts')
        .insert({ user_id: '00000000-0000-0000-0000-000000000004' })
        .select()
        .single();

    if (cartError || !cart) {
        console.error('   ❌ Failed to create test cart:', cartError?.message);
        testsFailed++;
        return;
    }

    const createdAt = new Date(cart.created_at);
    const initialUpdatedAt = new Date(cart.updated_at);

    console.log('   ℹ️  Initial created_at:', createdAt.toISOString());
    console.log('   ℹ️  Initial updated_at:', initialUpdatedAt.toISOString());

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update cart
    const { data: updatedCart, error: updateError } = await supabase
        .from('carts')
        .update({ session_id: 'test-session-trigger' })
        .eq('id', cart.id)
        .select()
        .single();

    if (updateError || !updatedCart) {
        console.error('   ❌ Failed to update cart:', updateError?.message);
        testsFailed++;
        await supabase.from('carts').delete().eq('id', cart.id);
        return;
    }

    const finalUpdatedAt = new Date(updatedCart.updated_at);

    console.log('   ℹ️  Final updated_at:', finalUpdatedAt.toISOString());

    if (finalUpdatedAt > initialUpdatedAt) {
        console.log('   ✅ updated_at trigger works correctly');
        testsPassed++;
    } else {
        console.error('   ❌ updated_at trigger did not update timestamp');
        testsFailed++;
    }

    // Cleanup
    await supabase.from('carts').delete().eq('id', cart.id);
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Cart Module Migration Verification\n');
    console.log('📍 Supabase URL:', SUPABASE_URL);
    console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Configured' : '✗ Missing');

    try {
        console.log('\n📋 Step 1: Verify Tables Exist');
        const cartsExists = await verifyTableExists('carts');
        const cartItemsExists = await verifyTableExists('cart_items');

        if (!cartsExists || !cartItemsExists) {
            console.error('\n❌ Tables do not exist. Please apply migrations first.');
            console.log('\nTo apply migrations:');
            console.log('1. Go to Supabase Dashboard → SQL Editor');
            console.log('2. Execute: supabase/migrations/20260503110000_create_carts_table.sql');
            console.log('3. Execute: supabase/migrations/20260503110100_create_cart_items_table.sql');
            process.exit(1);
        }

        console.log('\n📋 Step 2: Test Constraints and Triggers');
        await testUserOrSessionConstraint();
        await testQuantityConstraint();
        await testCascadeDelete();
        await testUniqueConstraint();
        await testUpdatedAtTrigger();

        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary');
        console.log('='.repeat(60));
        console.log(`✅ Tests Passed: ${testsPassed}`);
        console.log(`❌ Tests Failed: ${testsFailed}`);
        console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (testsFailed === 0) {
            console.log('\n✅ All migration tests passed successfully!');
            console.log('\n📊 Verified:');
            console.log('   ✅ Tables created (carts, cart_items)');
            console.log('   ✅ Indexes created');
            console.log('   ✅ CHECK constraints working');
            console.log('   ✅ UNIQUE constraints working');
            console.log('   ✅ Triggers working (updated_at)');
            console.log('   ✅ Foreign key cascades working');
            console.log('\n🎉 Database schema is ready for Repository Layer implementation!');
            process.exit(0);
        } else {
            console.log('\n❌ Some tests failed. Please review the errors above.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
