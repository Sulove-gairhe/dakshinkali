import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log('🔍 Querying products table...');
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error querying products:', error.message);
        return;
    }

    console.log(`✅ Found ${data.length} products:`);
    data.forEach(p => {
        console.log(`- ID: ${p.id} | Name: ${p.name} | Category: ${p.category} | Price: ${p.price}`);
    });
}

main().catch(console.error);
