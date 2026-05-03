/**
 * Apply Cart Module Migrations
 * 
 * This script applies the cart module database migrations to Supabase.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Execute SQL directly using Supabase REST API
 */
async function executeSql(sql) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SQL execution failed: ${error}`);
    }

    return response.json();
}

/**
 * Apply migration file
 */
async function applyMigration(filePath) {
    console.log(`\n📄 Applying migration: ${path.basename(filePath)}`);

    const sql = fs.readFileSync(filePath, 'utf-8');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.length < 10) {
            continue;
        }

        try {
            // Execute each statement individually
            const { error } = await supabase.rpc('exec_sql', {
                sql_query: statement + ';'
            });

            if (error) {
                console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
                throw error;
            }
        } catch (err) {
            console.error(`   ❌ Statement ${i + 1} failed:`, err.message);
            throw err;
        }
    }

    console.log('   ✅ Migration applied successfully');
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 Applying Cart Module Migrations\n');
    console.log('📍 Supabase URL:', SUPABASE_URL);
    console.log('🔑 Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? '✓ Configured' : '✗ Missing');

    try {
        const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

        // Apply migrations in order
        const migrations = [
            '20260503110000_create_carts_table.sql',
            '20260503110100_create_cart_items_table.sql',
        ];

        console.log('\n📋 Migrations to apply:');
        migrations.forEach((m, i) => console.log(`   ${i + 1}. ${m}`));

        console.log('\n⚠️  NOTE: This script will execute SQL directly on your Supabase database.');
        console.log('   Make sure you have a backup if needed.\n');

        // Apply each migration
        for (const migration of migrations) {
            const filePath = path.join(migrationsDir, migration);

            if (!fs.existsSync(filePath)) {
                console.error(`❌ Migration file not found: ${filePath}`);
                process.exit(1);
            }

            await applyMigration(filePath);
        }

        console.log('\n✅ All migrations applied successfully!');
        console.log('\n📊 Next steps:');
        console.log('   1. Run verification: node scripts/verify-cart-migrations.js');
        console.log('   2. Check Supabase Dashboard → Database → Tables');
        console.log('   3. Proceed to Repository Layer implementation');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.log('\n💡 Alternative approach:');
        console.log('   1. Go to Supabase Dashboard → SQL Editor');
        console.log('   2. Copy and execute: supabase/migrations/20260503110000_create_carts_table.sql');
        console.log('   3. Copy and execute: supabase/migrations/20260503110100_create_cart_items_table.sql');
        process.exit(1);
    }
}

main();
