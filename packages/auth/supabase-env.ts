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

        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            '=',
        );
        const decodedPayload =
            typeof atob === 'function'
                ? decodeURIComponent(
                      Array.from(atob(padded))
                          .map((char) =>
                              `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
                          )
                          .join(''),
                  )
                : Buffer.from(padded, 'base64').toString('utf8');
        const decoded = JSON.parse(decodedPayload) as { ref?: string };

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

    // Publishable keys and other non-JWT keys cannot expose a project ref here.
    return !key.startsWith('eyJ');
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
        .map((key) => getProjectRefFromJwtKey(key) || '[undecodable key]')
        .join(', ');

    return {
        error:
            `Supabase API key does not match NEXT_PUBLIC_SUPABASE_URL (project ${urlRef ?? 'unknown'}). ` +
            `Keys reference: ${mismatched}. ` +
            'Copy the anon or publishable key from the same project in Supabase Dashboard → Settings → API.',
    };
}
