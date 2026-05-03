#!/usr/bin/env node

/**
 * Script to get Supabase access token for testing API endpoints
 * Usage: node scripts/get-auth-token.js <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing environment variables');
    console.error('   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env');
    process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('❌ Usage: node scripts/get-auth-token.js <email> <password>');
    console.error('   Example: node scripts/get-auth-token.js admin@example.com MyPassword123');
    process.exit(1);
}

async function getToken() {
    console.log('🔐 Signing in to Supabase...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ Authentication failed:', error.message);
        process.exit(1);
    }

    if (!data.session) {
        console.error('❌ No session returned');
        process.exit(1);
    }

    const { access_token, refresh_token, expires_in, user } = data.session;

    console.log('✅ Authentication successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 USER INFO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${user.email}`);
    console.log(`User ID:  ${user.id}`);
    console.log(`Role:     ${user.app_metadata?.role || 'user'}`);
    console.log(`Expires:  ${expires_in} seconds (${Math.floor(expires_in / 60)} minutes)\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 ACCESS TOKEN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(access_token);
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 COPY-PASTE COMMANDS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💾 Save token to variable (bash/zsh):');
    console.log(`export TOKEN="${access_token}"\n`);

    console.log('💾 Save token to variable (PowerShell):');
    console.log(`$TOKEN="${access_token}"\n`);

    console.log('🧪 Test authenticated request (bash/zsh):');
    console.log(`curl http://localhost:3002/api/v1/admin/products \\
  -H "Authorization: Bearer ${access_token}"\n`);

    console.log('🧪 Test authenticated request (PowerShell):');
    console.log(`curl http://localhost:3002/api/v1/admin/products \`
  -H "Authorization: Bearer ${access_token}"\n`);

    console.log('🧪 Using saved variable (bash/zsh):');
    console.log(`curl http://localhost:3002/api/v1/admin/products \\
  -H "Authorization: Bearer $TOKEN"\n`);

    console.log('🧪 Using saved variable (PowerShell):');
    console.log(`curl http://localhost:3002/api/v1/admin/products \`
  -H "Authorization: Bearer $TOKEN"\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 REFRESH TOKEN (for reference)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(refresh_token);
    console.log('');

    console.log('⏰ Token expires in ~1 hour. Run this script again to get a new token.\n');
}

getToken().catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
