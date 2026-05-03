#!/usr/bin/env node

/**
 * Promote a Supabase Auth user to admin by email.
 *
 * Usage:
 *   node scripts/make-admin.js admin@example.com
 *
 * This script uses SUPABASE_SERVICE_ROLE_KEY and must only run server-side.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function findUserByEmail(supabase, email) {
    const perPage = 100;
    let page = 1;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
        if (user) return user;

        if (data.users.length < perPage) return null;
        page += 1;
    }
}

async function makeAdmin(email) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const user = await findUserByEmail(supabase, email);
    if (!user) {
        console.error(`No Supabase Auth user found for email: ${email}`);
        process.exit(1);
    }

    const nextAppMetadata = {
        ...(user.app_metadata || {}),
        role: 'admin',
    };

    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: nextAppMetadata,
    });
    if (error) throw error;

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (profileError) {
        console.warn(`Auth user updated, but profile role sync failed: ${profileError.message}`);
    }

    console.log(`Updated ${data.user.email} (${data.user.id})`);
    console.log(`raw_app_meta_data.role = ${data.user.app_metadata?.role}`);
    console.log('Log in again to receive a fresh access token with the new app_metadata role.');
}

const email = process.argv[2];
if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/make-admin.js admin@example.com');
    process.exit(1);
}

makeAdmin(email).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
