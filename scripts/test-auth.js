#!/usr/bin/env node

/**
 * Test Authentication Script
 * 
 * Tests the authentication flow:
 * 1. Login with credentials
 * 2. Get access token
 * 3. Call protected API endpoint
 * 
 * Usage: node scripts/test-auth.js <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAuth(email, password) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiUrl = process.env.API_URL || 'http://localhost:3002';

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Error: Missing environment variables');
        console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
        process.exit(1);
    }

    console.log('🧪 Testing Authentication Flow...');
    console.log('');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        // Step 1: Login
        console.log('1️⃣  Logging in...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            throw authError;
        }

        console.log('   ✅ Login successful');
        console.log('   👤 User ID:', authData.user.id);
        console.log('   📧 Email:', authData.user.email);
        console.log('');

        // Step 2: Get access token
        console.log('2️⃣  Getting access token...');
        const accessToken = authData.session.access_token;
        console.log('   ✅ Token obtained');
        console.log('   🔑 Token (first 50 chars):', accessToken.substring(0, 50) + '...');
        console.log('');

        // Step 3: Get user profile
        console.log('3️⃣  Fetching user profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            throw profileError;
        }

        console.log('   ✅ Profile fetched');
        console.log('   👑 Role:', profile.role);
        console.log('   📝 Full Name:', profile.full_name || '(not set)');
        console.log('');

        // Step 4: Test API endpoint
        console.log('4️⃣  Testing API endpoint...');
        console.log('   📡 Calling:', `${apiUrl}/api/v1/admin/products`);

        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${apiUrl}/api/v1/admin/products`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        console.log('   ✅ API call successful');
        console.log('   📦 Products count:', data.products?.length || 0);
        console.log('');

        // Success summary
        console.log('✅ All tests passed!');
        console.log('');
        console.log('Authentication is working correctly:');
        console.log('  ✓ User can log in');
        console.log('  ✓ JWT token is generated');
        console.log('  ✓ Profile exists with correct role');
        console.log('  ✓ API accepts and verifies token');
        console.log('');

        // Cleanup
        await supabase.auth.signOut();

    } catch (error) {
        console.error('');
        console.error('❌ Test failed:', error.message);
        console.error('');

        if (error.message.includes('Invalid login credentials')) {
            console.error('💡 Tip: Check that the email and password are correct');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('💡 Tip: Make sure the API server is running');
            console.error('   Run: pnpm --filter @dakshinkali/api run dev');
        } else if (error.message.includes('401')) {
            console.error('💡 Tip: JWT verification might be failing');
            console.error('   Check SUPABASE_SERVICE_ROLE_KEY in .env');
        } else if (error.message.includes('403')) {
            console.error('💡 Tip: User might not have admin role');
            console.error('   Run: node scripts/update-user-role.js <email> admin');
        }

        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('Usage: node scripts/test-auth.js <email> <password>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/test-auth.js admin@example.com SecurePass123!');
    console.log('');
    console.log('Make sure the API server is running:');
    console.log('  pnpm --filter @dakshinkali/api run dev');
    process.exit(1);
}

const [email, password] = args;

// Run the test
testAuth(email, password);
