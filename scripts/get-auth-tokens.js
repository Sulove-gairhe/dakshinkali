#!/usr/bin/env node

/**
 * Get Auth Tokens - Generate JWT tokens for testing
 * 
 * Usage:
 *   node scripts/get-auth-tokens.js <email> <password>
 * 
 * Example:
 *   node scripts/get-auth-tokens.js admin@example.com password123
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
    console.error('❌ Usage: node scripts/get-auth-tokens.js <email> <password>');
    console.error('');
    console.error('Example:');
    console.error('  node scripts/get-auth-tokens.js admin@example.com password123');
    process.exit(1);
}

async function getTokens() {
    console.log('🔐 Getting auth tokens...\n');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        // Sign in
        console.log(`📧 Signing in as: ${email}`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error(`❌ Login failed: ${error.message}`);
            process.exit(1);
        }

        if (!data.session) {
            console.error('❌ No session returned');
            process.exit(1);
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.warn(`⚠️  Could not fetch profile: ${profileError.message}`);
        }

        console.log('✅ Login successful!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 USER INFORMATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`User ID:    ${data.user.id}`);
        console.log(`Email:      ${data.user.email}`);
        console.log(`Role:       ${profile?.role || 'unknown'}`);
        console.log(`Full Name:  ${profile?.full_name || '(not set)'}`);
        console.log('');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 ACCESS TOKEN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(data.session.access_token);
        console.log('');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 REFRESH TOKEN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(data.session.refresh_token);
        console.log('');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 USAGE EXAMPLES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('# Test API endpoint (bash):');
        console.log(`curl http://localhost:3002/api/v1/admin/products \\`);
        console.log(`  -H "Authorization: Bearer ${data.session.access_token}"`);
        console.log('');
        console.log('# Test API endpoint (PowerShell):');
        console.log(`$token = "${data.session.access_token}"`);
        console.log('Invoke-RestMethod -Uri "http://localhost:3002/api/v1/admin/products" `');
        console.log('  -Headers @{ Authorization = "Bearer $token" }');
        console.log('');
        console.log('# Test in browser console:');
        console.log(`fetch('http://localhost:3002/api/v1/admin/products', {`);
        console.log(`  headers: { 'Authorization': 'Bearer ${data.session.access_token}' }`);
        console.log('}).then(r => r.json()).then(console.log)');
        console.log('');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏰ TOKEN EXPIRY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const expiresAt = new Date(data.session.expires_at * 1000);
        console.log(`Expires at: ${expiresAt.toLocaleString()}`);
        console.log(`Valid for:  ${Math.floor((data.session.expires_at * 1000 - Date.now()) / 1000 / 60)} minutes`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getTokens();
