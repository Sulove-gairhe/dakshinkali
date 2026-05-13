#!/usr/bin/env node

/**
 * Database Status Checker
 * 
 * Checks which tables exist in your Supabase database
 * and identifies missing migrations.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const requiredTables = [
    { name: 'products', migration: '20260430103821_create_products_table.sql' },
    { name: 'profiles', migration: '20260503000000_create_profiles_table.sql' },
    { name: 'carts', migration: '20260503100000_create_carts_table.sql' },
    { name: 'cart_items', migration: '20260503100100_create_cart_items_table.sql' },
    { name: 'orders', migration: '20260503120000_create_orders_tables.sql' },
    { name: 'order_items', migration: '20260503120000_create_orders_tables.sql' }
];

async function checkTable(tableName) {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

    return !error;
}

async function main() {
    console.log('🔍 Checking Database Status');
    console.log('===========================\n');
    console.log(`📍 Target: ${SUPABASE_URL}\n`);

    const results = [];

    for (const table of requiredTables) {
        const exists = await checkTable(table.name);
        results.push({ ...table, exists });

        const status = exists ? '✅' : '❌';
        console.log(`${status} ${table.name.padEnd(15)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    const missing = results.filter(r => !r.exists);

    console.log('\n📊 Summary');
    console.log('==========');
    console.log(`✅ Existing: ${results.filter(r => r.exists).length}`);
    console.log(`❌ Missing:  ${missing.length}`);

    if (missing.length > 0) {
        console.log('\n⚠️  Missing Tables Detected!');
        console.log('===========================\n');
        console.log('You need to apply these migrations:\n');

        const uniqueMigrations = [...new Set(missing.map(m => m.migration))];
        uniqueMigrations.forEach((migration, index) => {
            console.log(`${index + 1}. supabase/migrations/${migration}`);
        });

        console.log('\n📖 How to apply:');
        console.log('   1. Open Supabase Dashboard SQL Editor:');
        console.log(`      https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}/sql`);
        console.log('   2. Copy the content of each migration file');
        console.log('   3. Paste and run in SQL Editor');
        console.log('   4. Run this script again to verify\n');
        console.log('📄 See MIGRATION_GUIDE.md for detailed instructions');
    } else {
        console.log('\n🎉 All required tables exist!');
        console.log('✨ Your database is ready to use.');
    }
}

main().catch(error => {
    console.error('💥 Error:', error.message);
    process.exit(1);
});
