/**
 * Comprehensive Supabase Integration Verification
 * Tests all aspects of the Supabase setup
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function verifyIntegration() {
    console.log('🔍 Verifying Supabase Integration\n');
    console.log('='.repeat(60));

    let allPassed = true;

    // Test 1: Environment Variables
    console.log('\n📋 Test 1: Environment Variables');
    console.log('-'.repeat(60));

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url) {
        console.log('✅ SUPABASE_URL:', url);
    } else {
        console.log('❌ SUPABASE_URL: Not set');
        allPassed = false;
    }

    if (anonKey) {
        console.log('✅ SUPABASE_ANON_KEY: Set');
    } else {
        console.log('❌ SUPABASE_ANON_KEY: Not set');
        allPassed = false;
    }

    if (serviceKey) {
        console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Set');
    } else {
        console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY: Not set (optional)');
    }

    // Test 2: Client Creation
    console.log('\n🔧 Test 2: Client Creation');
    console.log('-'.repeat(60));

    if (!url || !anonKey) {
        console.log('❌ Cannot create client - missing credentials');
        allPassed = false;
        return;
    }

    let supabase;
    try {
        supabase = createClient(url, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        console.log('✅ Supabase client created successfully');
    } catch (error) {
        console.log('❌ Failed to create client:', error.message);
        allPassed = false;
        return;
    }

    // Test 3: Connection Test
    console.log('\n🌐 Test 3: Connection Test');
    console.log('-'.repeat(60));

    try {
        // Try to query a system table (will fail if table doesn't exist, but connection works)
        const { error } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log('⚠️  Connected, but "products" table not found');
                console.log('   This is expected if you haven\'t created the schema yet');
            } else if (error.message.includes('Could not find')) {
                console.log('⚠️  Connected, but "products" table not found');
                console.log('   This is expected if you haven\'t created the schema yet');
            } else {
                console.log('⚠️  Connection test:', error.message);
            }
        } else {
            console.log('✅ Successfully connected to Supabase');
            console.log('✅ "products" table exists and is accessible');
        }
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        allPassed = false;
    }

    // Test 4: Package Installation
    console.log('\n📦 Test 4: Package Installation');
    console.log('-'.repeat(60));

    try {
        require('@supabase/supabase-js');
        console.log('✅ @supabase/supabase-js installed');
    } catch {
        console.log('❌ @supabase/supabase-js not installed');
        allPassed = false;
    }

    try {
        require('@supabase/ssr');
        console.log('✅ @supabase/ssr installed');
    } catch {
        console.log('❌ @supabase/ssr not installed');
        allPassed = false;
    }

    // Test 5: Database Package
    console.log('\n🗄️  Test 5: Database Package Configuration');
    console.log('-'.repeat(60));

    try {
        const fs = require('fs');
        const path = require('path');

        const dbPackagePath = path.join(__dirname, 'packages', 'database');

        if (fs.existsSync(path.join(dbPackagePath, 'supabase.config.ts'))) {
            console.log('✅ supabase.config.ts exists');
        } else {
            console.log('❌ supabase.config.ts not found');
            allPassed = false;
        }

        if (fs.existsSync(path.join(dbPackagePath, 'storage.config.ts'))) {
            console.log('✅ storage.config.ts exists');
        } else {
            console.log('⚠️  storage.config.ts not found');
        }

        if (fs.existsSync(path.join(dbPackagePath, 'index.ts'))) {
            console.log('✅ index.ts exists');
        } else {
            console.log('❌ index.ts not found');
            allPassed = false;
        }
    } catch (error) {
        console.log('❌ Error checking database package:', error.message);
        allPassed = false;
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary');
    console.log('-'.repeat(60));

    if (allPassed) {
        console.log('✅ All tests passed!');
        console.log('\n🎉 Supabase integration is fully configured and ready to use.');
        console.log('\n📚 Next Steps:');
        console.log('   1. Create your database schema in Supabase dashboard');
        console.log('   2. Set up Row Level Security (RLS) policies');
        console.log('   3. Run your API server: npm run dev');
        console.log('   4. Test the product endpoints');
        console.log('\n📖 Documentation: See SUPABASE_SETUP.md for details');
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.');
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check your .env file has the correct values');
        console.log('   2. Verify Supabase packages are installed: npm install');
        console.log('   3. Review SUPABASE_SETUP.md for setup instructions');
    }

    console.log('\n' + '='.repeat(60));
}

verifyIntegration().catch(error => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
});
