import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('⚡ Running migration to add product_slug to order_items...');
    
    // Add product_slug column to order_items
    const sql = `
        ALTER TABLE public.order_items 
        ADD COLUMN IF NOT EXISTS product_slug TEXT;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        console.error('❌ RPC exec_sql failed:', error.message);
        console.log('Trying direct query execution via supabase query or manual SQL execution instruction...');
        
        // Let's attempt running another way if exec_sql isn't available
        const { error: queryError } = await supabase.rpc('query', { query_text: sql });
        if (queryError) {
            console.error('❌ Direct query execution failed:', queryError.message);
            console.log('💡 Note: You can run "ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_slug TEXT;" manually in the Supabase Dashboard SQL Editor.');
        } else {
            console.log('✅ Successfully added product_slug column to order_items via direct query!');
        }
    } else {
        console.log('✅ Successfully added product_slug column to order_items via RPC exec_sql!');
    }
}

main().catch(console.error);
