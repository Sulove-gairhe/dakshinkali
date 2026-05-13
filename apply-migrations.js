#!/usr/bin/env node

/**
 * Migration Application Script
 * 
 * Applies all SQL migrations to the hosted Supabase instance.
 * Uses the service role key for admin access.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Migration files in order
const migrations = [
    '20260430103821_create_products_table.sql',
    '20260430104000_create_product_indexes.sql',
    '20260503000000_create_profiles_table.sql',
    '20260503100000_create_carts_table.sql',
    '20260503100100_create_cart_items_table.sql',
    '20260503120000_create_orders_tables.sql'
];

/**
 * Execute SQL migration
 */
async function executeMigration(filename) {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);

    try {
        console.log(`\n📄 Reading: ${filename}`);
        const sql = readFileSync(filepath, 'utf-8');

        console.log(`⚙️  Executing migration...`);

        // Execute the SQL using Supabase RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If exec_sql doesn't exist, try direct query
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.log(`⚠️  RPC method not available, trying direct execution...`);

                // Split by semicolons and execute each statement
                const statements = sql
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--'));

                for (const statement of statements) {
                    const { error: stmtError } = await supabase.rpc('query', { query_text: statement });
                    if (stmtError) {
                        throw stmtError;
                    }
                }
            } else {
                throw error;
            }
        }

        console.log(`✅ Successfully applied: ${filename}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to apply ${filename}:`, error.message);
        return false;
    }
}

/**
 * Check if tables exist
 */
async function checkTables() {
    console.log('\n🔍 Checking existing tables...\n');

    const tables = ['products', 'profiles', 'carts', 'cart_items', 'orders', 'order_items'];

    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(0);

        if (error) {
            console.log(`   ${table}: ❌ (${error.message})`);
        } else {
            console.log(`   ${table}: ✅`);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Supabase Migration Application Tool');
    console.log('=====================================');
    console.log(`📍 Target: ${SUPABASE_URL}`);

    // Check current state
    await checkTables();

    console.log('\n📦 Applying migrations...');
    console.log('=========================');

    let successCount = 0;
    let failCount = 0;

    for (const migration of migrations) {
        const success = await executeMigration(migration);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    // Check final state
    await checkTables();

    if (failCount > 0) {
        console.log('\n⚠️  Some migrations failed. Please check the errors above.');
        console.log('💡 Tip: You may need to apply migrations manually via Supabase Dashboard SQL Editor.');
        process.exit(1);
    } else {
        console.log('\n🎉 All migrations applied successfully!');
        console.log('✨ Your database is ready to use.');
    }
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
