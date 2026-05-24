/**
 * Resolves Supabase anon/publishable keys and ensures they match the project URL.
 */

export function getProjectRefFromUrl(supabaseUrl: string | undefined): string | null {
    if (!supabaseUrl) {
        return null;
    }

    try {
        const hostname = new URL(supabaseUrl).hostname;
        const [ref] = hostname.split('.');
        return ref || null;
    } catch {
        return null;
    }
}

export function getProjectRefFromJwtKey(key: string): string | null {
    if (!key.startsWith('eyJ')) {
        return null;
    }

    try {
        const payload = key.split('.')[1];
        if (!payload) {
            return null;
        }

        const decoded = JSON.parse(
            Buffer.from(payload, 'base64url').toString('utf8'),
        ) as { ref?: string };

        return decoded.ref ?? null;
    } catch {
        return null;
    }
}

function keyMatchesUrl(supabaseUrl: string, key: string): boolean {
    const urlRef = getProjectRefFromUrl(supabaseUrl);
    if (!urlRef) {
        return true;
    }

    const jwtRef = getProjectRefFromJwtKey(key);
    if (jwtRef) {
        return jwtRef === urlRef;
    }

    // Publishable keys (sb_publishable_...) cannot be decoded; assume valid.
    return key.startsWith('sb_publishable_');
}

/**
 * Pick the first API key that matches NEXT_PUBLIC_SUPABASE_URL.
 * Prevents "Invalid API key" when ANON_KEY is from a different Supabase project.
 */
export function resolveSupabaseAnonKey(
    supabaseUrl: string | undefined,
): { key: string } | { error: string } {
    if (!supabaseUrl) {
        return {
            error:
                'Missing NEXT_PUBLIC_SUPABASE_URL. Set it in apps/web/.env.local (or Vercel env).',
        };
    }

    const candidates = [
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        process.env.SUPABASE_ANON_KEY,
    ].filter((value): value is string => Boolean(value?.trim()));

    if (candidates.length === 0) {
        return {
            error:
                'Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (JWT anon or sb_publishable_...) in apps/web/.env.local.',
        };
    }

    const matching = candidates.find((key) => keyMatchesUrl(supabaseUrl, key));
    if (matching) {
        return { key: matching };
    }

    const urlRef = getProjectRefFromUrl(supabaseUrl);
    const mismatched = candidates
        .map((key) => getProjectRefFromJwtKey(key) || key.slice(0, 12))
        .join(', ');

    return {
        error:
            `Supabase API key does not match NEXT_PUBLIC_SUPABASE_URL (project ${urlRef ?? 'unknown'}). ` +
            `Keys reference: ${mismatched}. ` +
            'Copy the anon or publishable key from the same project in Supabase Dashboard → Settings → API.',
    };
}
