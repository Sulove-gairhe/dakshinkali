#!/usr/bin/env node

/**
 * DEV/STAGING ONLY — Seed test customer and admin Supabase Auth users.
 *
 * Never run automatically in production builds. Requires service role key.
 *
 * Usage:
 *   node scripts/seed-auth-users.js
 *   pnpm auth:seed
 *
 * Passwords are passed only via this local script (not stored in the repo).
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/** @type {{ email: string; password: string; role: 'customer' | 'admin'; full_name: string }[]} */
const SEED_USERS = [
    {
        email: 'customer1@dakshinkali.shop',
        password: 'TestCustomer@123',
        role: 'customer',
        full_name: 'Test Customer One',
    },
    {
        email: 'customer2@dakshinkali.shop',
        password: 'TestCustomer@123',
        role: 'customer',
        full_name: 'Test Customer Two',
    },
    {
        email: 'customer3@dakshinkali.shop',
        password: 'TestCustomer@123',
        role: 'customer',
        full_name: 'Test Customer Three',
    },
    {
        email: 'admin1@dakshinkali.shop',
        password: 'TestAdmin@123',
        role: 'admin',
        full_name: 'Test Admin One',
    },
    {
        email: 'admin2@dakshinkali.shop',
        password: 'TestAdmin@123',
        role: 'admin',
        full_name: 'Test Admin Two',
    },
];

async function findUserByEmail(supabase, email) {
    const perPage = 100;
    let page = 1;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) throw error;

        const user = data.users.find(
            (candidate) => candidate.email?.toLowerCase() === email.toLowerCase(),
        );
        if (user) return user;

        if (data.users.length < perPage) return null;
        page += 1;
    }
}

async function upsertSeedUser(supabase, seedUser) {
    const existing = await findUserByEmail(supabase, seedUser.email);

    if (!existing) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: seedUser.email,
            password: seedUser.password,
            email_confirm: true,
            user_metadata: {
                role: seedUser.role,
                full_name: seedUser.full_name,
            },
            app_metadata: {
                role: seedUser.role,
            },
        });

        if (error) throw error;

        await syncProfile(supabase, data.user.id, seedUser);
        console.log(`✅ Created ${seedUser.email} (${seedUser.role})`);
        return;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: seedUser.password,
        email_confirm: true,
        user_metadata: {
            ...(existing.user_metadata || {}),
            role: seedUser.role,
            full_name: seedUser.full_name,
        },
        app_metadata: {
            ...(existing.app_metadata || {}),
            role: seedUser.role,
        },
    });

    if (error) throw error;

    await syncProfile(supabase, data.user.id, seedUser);
    console.log(`♻️  Updated ${seedUser.email} (${seedUser.role})`);
}

async function syncProfile(supabase, userId, seedUser) {
    const { error } = await supabase.from('profiles').upsert(
        {
            id: userId,
            email: seedUser.email,
            full_name: seedUser.full_name,
            role: seedUser.role,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
    );

    if (error) {
        console.warn(`   Profile sync warning for ${seedUser.email}: ${error.message}`);
    }
}

async function main() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    console.log('🌱 Seeding dev/staging auth users (manual script only)...');
    console.log('');

    for (const seedUser of SEED_USERS) {
        await upsertSeedUser(supabase, seedUser);
    }

    console.log('');
    console.log('Done. These accounts are for local/dev/staging only.');
    console.log('Customers: customer1@dakshinkali.shop … customer3@dakshinkali.shop');
    console.log('Admins: admin1@dakshinkali.shop, admin2@dakshinkali.shop');
    console.log('Re-login after seeding so JWT app_metadata includes the latest role.');
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
