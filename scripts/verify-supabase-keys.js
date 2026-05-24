#!/usr/bin/env node

/**
 * Verifies Supabase URL and API keys belong to the same project.
 * Loads root .env and apps/web/.env.local when present.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    require('dotenv').config({ path: filePath, override: true });
}

function getProjectRefFromUrl(url) {
    try {
        return new URL(url).hostname.split('.')[0];
    } catch {
        return null;
    }
}

function getProjectRefFromJwt(key) {
    if (!key?.startsWith('eyJ')) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(key.split('.')[1], 'base64url').toString('utf8'),
        );
        return payload.ref ?? null;
    } catch {
        return null;
    }
}

async function main() {
    loadEnvFile(path.join(process.cwd(), '.env'));
    loadEnvFile(path.join(process.cwd(), 'apps/web/.env.local'));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    console.log('Supabase key check\n');
    console.log('URL project ref:', getProjectRefFromUrl(url));
    console.log('ANON_KEY project ref:', getProjectRefFromJwt(anon) || anon?.slice(0, 20));
    console.log(
        'PUBLISHABLE_KEY:',
        publishable ? publishable.slice(0, 20) + '...' : '(not set)',
    );

    const urlRef = getProjectRefFromUrl(url);
    const anonRef = getProjectRefFromJwt(anon);
    if (anonRef && urlRef && anonRef !== urlRef) {
        console.error('\n❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is for a different project than the URL.');
        console.error('   Fix apps/web/.env.local — use the anon or publishable key from the same dashboard project.');
        process.exit(1);
    }

    const key = anon || publishable;
    if (!url || !key) {
        console.error('\n❌ Missing NEXT_PUBLIC_SUPABASE_URL or key in env.');
        process.exit(1);
    }

    const supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await supabase.auth.signInWithPassword({
        email: 'customer1@dakshinkali.shop',
        password: 'TestCustomer@123',
    });

    if (error) {
        console.error('\n❌ Auth test failed:', error.message);
        process.exit(1);
    }

    console.log('\n✅ Keys match URL and test sign-in succeeded.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
