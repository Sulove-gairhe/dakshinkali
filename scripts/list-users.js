#!/usr/bin/env node

/**
 * List Users - Show all users in the database
 * 
 * Usage:
 *   node scripts/list-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

async function listUsers() {
    console.log('👥 Fetching users from database...\n');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Get all profiles
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`❌ Error fetching profiles: ${error.message}`);
            process.exit(1);
        }

        if (!profiles || profiles.length === 0) {
            console.log('📭 No users found in database.');
            console.log('');
            console.log('To create a user, run:');
            console.log('  pnpm run auth:create-admin <email> <password>');
            console.log('');
            console.log('Example:');
            console.log('  pnpm run auth:create-admin admin@example.com SecurePass123!');
            return;
        }

        console.log(`✅ Found ${profiles.length} user(s):\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        profiles.forEach((profile, index) => {
            console.log(`\n${index + 1}. ${profile.email}`);
            console.log(`   ID:        ${profile.id}`);
            console.log(`   Role:      ${profile.role}`);
            console.log(`   Full Name: ${profile.full_name || '(not set)'}`);
            console.log(`   Created:   ${new Date(profile.created_at).toLocaleString()}`);
        });

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📋 To get access tokens for a user, run:');
        console.log('   node scripts/get-auth-tokens.js <email> <password>');
        console.log('');
        console.log('Example:');
        console.log(`   node scripts/get-auth-tokens.js ${profiles[0].email} YourPassword123!`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listUsers();
