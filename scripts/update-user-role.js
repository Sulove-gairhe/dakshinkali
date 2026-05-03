#!/usr/bin/env node

/**
 * Update User Role Script
 * 
 * Updates a user's role in the profiles table.
 * Usage: node scripts/update-user-role.js <email> <role>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function updateUserRole(email, role) {
    // Validate role
    const validRoles = ['admin', 'customer'];
    if (!validRoles.includes(role)) {
        console.error(`❌ Error: Invalid role "${role}"`);
        console.error(`Valid roles: ${validRoles.join(', ')}`);
        process.exit(1);
    }

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

    console.log(`🔄 Updating user role...`);
    console.log('');

    try {
        // Find user by email
        const { data: profile, error: findError } = await supabase
            .from('profiles')
            .select('id, email, role')
            .eq('email', email)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                throw new Error(`User not found: ${email}`);
            }
            throw findError;
        }

        console.log('👤 User found:');
        console.log('   ID:', profile.id);
        console.log('   Email:', profile.email);
        console.log('   Current role:', profile.role);
        console.log('');

        // Update role
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', profile.id);

        if (updateError) {
            throw updateError;
        }

        console.log('✅ Role updated successfully!');
        console.log('   New role:', role);
        console.log('');

        if (role === 'admin') {
            console.log('👑 User is now an admin');
            console.log('   They can access admin routes');
        } else {
            console.log('👤 User is now a customer');
            console.log('   They cannot access admin routes');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node scripts/update-user-role.js <email> <role>');
    console.log('');
    console.log('Roles: admin, customer');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/update-user-role.js user@example.com admin');
    console.log('  node scripts/update-user-role.js user@example.com customer');
    process.exit(1);
}

const [email, role] = args;

// Run the script
updateUserRole(email, role);
