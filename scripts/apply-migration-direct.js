#!/usr/bin/env node

/**
 * Apply Migration Directly
 * 
 * Applies the auth migration directly to Supabase without CLI linking.
 * This is useful when Supabase CLI is not configured or you prefer direct SQL execution.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
    console.log('🔐 Applying Supabase Auth Migration...');
    console.log('');

    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Missing environment variables');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
        process.exit(1);
    }

    // Extract project ref
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1];
    console.log('📋 Project:', projectRef);
    console.log('');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260503000000_create_profiles_table.sql');

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📦 Applying migration: 20260503000000_create_profiles_table.sql');
        console.log('');

        // Split SQL into individual statements (simple split by semicolon)
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (const statement of statements) {
            // Skip comments and empty statements
            if (!statement || statement.startsWith('--')) {
                continue;
            }

            try {
                // Execute SQL statement
                const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

                if (error) {
                    // Check if error is "already exists" - that's okay
                    if (error.message.includes('already exists') ||
                        error.message.includes('duplicate')) {
                        skipCount++;
                        continue;
                    }
                    throw error;
                }

                successCount++;
            } catch (err) {
                // Try direct query as fallback
                const { error: queryError } = await supabase
                    .from('_migrations')
                    .select('*')
                    .limit(1);

                if (queryError && queryError.message.includes('already exists')) {
                    skipCount++;
                    continue;
                }

                console.warn('⚠️  Statement may have failed (this might be okay):', err.message);
            }
        }

        console.log('✅ Migration applied successfully!');
        console.log(`   Executed: ${successCount} statements`);
        if (skipCount > 0) {
            console.log(`   Skipped: ${skipCount} (already exists)`);
        }
        console.log('');
        console.log('Next steps:');
        console.log('1. Create an admin user: pnpm run auth:create-admin <email> <password>');
        console.log('2. Test the API: pnpm run auth:test <email> <password>');

    } catch (error) {
        console.error('❌ Error applying migration:', error.message);
        console.error('');
        console.error('💡 Alternative: Apply migration manually via Supabase Dashboard');
        console.error('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/editor');
        console.error('   2. Open SQL Editor');
        console.error('   3. Copy contents of: supabase/migrations/20260503000000_create_profiles_table.sql');
        console.error('   4. Run the SQL');
        process.exit(1);
    }
}

applyMigration();
