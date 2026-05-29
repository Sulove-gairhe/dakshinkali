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
    console.log('🔍 Querying all products...');
    const { data, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('❌ Error querying products:', error.message);
        return;
    }

    console.log(`✅ Found ${data.length} products:`);
    const uniqueBadges = new Set();
    const uniqueSources = new Set();
    data.forEach(p => {
        const sf = p.storefront_data || {};
        if (sf.badge) uniqueBadges.add(sf.badge);
        if (sf.badges) sf.badges.forEach(b => uniqueBadges.add(b));
        if (sf.source) uniqueSources.add(sf.source);
        if (String(sf.badge).toLowerCase().includes('import') || String(sf.badge).toLowerCase().includes('manual') || String(p.category).toLowerCase().includes('import')) {
            console.log(`Match Product: ${p.name} | Category: ${p.category} | Badge: ${sf.badge} | Source: ${sf.source}`);
        }
    });
    console.log('Unique Badges:', Array.from(uniqueBadges));
    console.log('Unique Sources:', Array.from(uniqueSources));
}

main().catch(console.error);
