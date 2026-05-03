#!/usr/bin/env node

/**
 * Show Migration Instructions
 * 
 * Displays instructions for applying the auth migration via Supabase Dashboard.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('');
console.log('🔐 Supabase Auth Migration Instructions');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Get project info
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl) {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    if (projectRef) {
        console.log('📋 Your Project: ' + projectRef);
        console.log('🔗 Dashboard: https://supabase.com/dashboard/project/' + projectRef);
        console.log('');
    }
}

console.log('📝 Steps to Apply Migration:');
console.log('');
console.log('1. Open Supabase Dashboard SQL Editor:');
if (supabaseUrl) {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
} else {
    console.log('   https://supabase.com/dashboard → Your Project → SQL Editor');
}
console.log('');
console.log('2. Copy the migration SQL:');
console.log('   File: supabase/migrations/20260503000000_create_profiles_table.sql');
console.log('');
console.log('3. Paste into SQL Editor and click "Run"');
console.log('');
console.log('4. Verify migration:');
console.log('   Run this query to check:');
console.log('   SELECT * FROM information_schema.tables WHERE table_name = \'profiles\';');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✨ After migration is applied:');
console.log('');
console.log('   Create admin user:');
console.log('   $ pnpm run auth:create-admin admin@example.com SecurePass123!');
console.log('');
console.log('   Test authentication:');
console.log('   $ pnpm run auth:test admin@example.com SecurePass123!');
console.log('');

// Show migration file location
const migrationPath = path.join(__dirname, '../supabase/migrations/20260503000000_create_profiles_table.sql');
if (fs.existsSync(migrationPath)) {
    console.log('📄 Migration file ready at:');
    console.log('   ' + migrationPath);
    console.log('');
}
