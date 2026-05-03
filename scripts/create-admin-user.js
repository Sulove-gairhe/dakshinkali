#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Creates a new user and sets their role to 'admin' in the profiles table.
 * Usage: node scripts/create-admin-user.js <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createAdminUser(email, password) {
    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Missing environment variables');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
        process.exit(1);
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    console.log('🔐 Creating admin user...');
    console.log('');

    try {
        // Create user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                role: 'admin',
            },
        });

        if (authError) {
            throw authError;
        }

        console.log('✅ User created:', authData.user.id);
        console.log('📧 Email:', authData.user.email);

        // Update profile role to admin
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', authData.user.id);

        if (profileError) {
            throw profileError;
        }

        console.log('👑 Role set to: admin');
        console.log('');
        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('You can now log in with:');
        console.log(`  Email: ${email}`);
        console.log(`  Password: ${password}`);
        console.log('');
        console.log('Next step: Test authentication');
        console.log('  pnpm run auth:test');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node scripts/create-admin-user.js <email> <password>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/create-admin-user.js admin@example.com SecurePass123!');
    process.exit(1);
}

const [email, password] = args;

// Validate email
if (!email.includes('@')) {
    console.error('❌ Error: Invalid email address');
    process.exit(1);
}

// Validate password
if (password.length < 6) {
    console.error('❌ Error: Password must be at least 6 characters');
    process.exit(1);
}

// Run the script
createAdminUser(email, password);
