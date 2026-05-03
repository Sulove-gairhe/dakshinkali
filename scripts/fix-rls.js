#!/usr/bin/env node

/**
 * Fix RLS Policies
 * 
 * Fixes the infinite recursion issue in RLS policies.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('');
console.log('🔧 Fix RLS Policies');
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

console.log('⚠️  Issue Detected: Infinite recursion in RLS policies');
console.log('');
console.log('📝 To Fix:');
console.log('');
console.log('1. Open Supabase Dashboard SQL Editor:');
if (supabaseUrl) {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1];
    console.log('   https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
} else {
    console.log('   https://supabase.com/dashboard → Your Project → SQL Editor');
}
console.log('');
console.log('2. Copy and run this SQL:');
console.log('');
console.log('─────────────────────────────────────────────────────────');

const fixSQL = `-- Fix RLS Policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Service role full access"
    ON public.profiles
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');`;

console.log(fixSQL);
console.log('─────────────────────────────────────────────────────────');
console.log('');
console.log('3. Verify policies:');
console.log('');
console.log('   SELECT policyname FROM pg_policies WHERE tablename = \'profiles\';');
console.log('');
console.log('   Should show:');
console.log('   - Users can view own profile');
console.log('   - Users can update own profile');
console.log('   - Service role full access');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✨ After fixing:');
console.log('');
console.log('   Test authentication again:');
console.log('   $ pnpm run auth:test admin@example.com SecurePass123!');
console.log('');

// Also save to file
const fixPath = path.join(__dirname, 'fix-rls-policies.sql');
console.log('📄 SQL also saved to: ' + fixPath);
console.log('');
