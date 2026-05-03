/**
 * Auth Helper Functions
 * 
 * Utility functions for authentication operations.
 * Works with both browser and server-side Supabase clients.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Auth tokens structure
 */
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

/**
 * Get access token from current session
 * 
 * @param supabase - Supabase client
 * @returns Access token or null if not authenticated
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const token = await getAccessToken(supabase);
 * 
 * if (token) {
 *   // Use token for API calls
 *   fetch('/api/v1/admin/products', {
 *     headers: {
 *       'Authorization': `Bearer ${token}`,
 *     },
 *   });
 * }
 * ```
 */
export async function getAccessToken(
    supabase: SupabaseClient
): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Get all auth tokens from current session
 * 
 * @param supabase - Supabase client
 * @returns Auth tokens or null if not authenticated
 */
export async function getAuthTokens(
    supabase: SupabaseClient
): Promise<AuthTokens | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return null;
    }

    return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
    };
}

/**
 * Refresh the current session
 * 
 * @param supabase - Supabase client
 * @returns New session or null if refresh failed
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const session = await refreshSession(supabase);
 * 
 * if (session) {
 *   console.log('Session refreshed successfully');
 * }
 * ```
 */
export async function refreshSession(supabase: SupabaseClient) {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
        console.error('Failed to refresh session:', error.message);
        return null;
    }

    return session;
}

/**
 * Sign out the current user
 * 
 * @param supabase - Supabase client
 * @returns True if sign out was successful
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const success = await signOut(supabase);
 * 
 * if (success) {
 *   router.push('/login');
 * }
 * ```
 */
export async function signOut(supabase: SupabaseClient): Promise<boolean> {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Failed to sign out:', error.message);
        return false;
    }

    return true;
}

/**
 * Check if user is authenticated
 * 
 * @param supabase - Supabase client
 * @returns True if user is authenticated
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const isAuth = await isAuthenticated(supabase);
 * 
 * if (!isAuth) {
 *   router.push('/login');
 * }
 * ```
 */
export async function isAuthenticated(supabase: SupabaseClient): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

/**
 * Get current user
 * 
 * @param supabase - Supabase client
 * @returns Current user or null
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const user = await getCurrentUser(supabase);
 * 
 * if (user) {
 *   console.log('Logged in as:', user.email);
 * }
 * ```
 */
export async function getCurrentUser(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Get user role from profile
 * 
 * @param supabase - Supabase client
 * @returns User role or null
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const role = await getUserRole(supabase);
 * 
 * if (role === 'admin') {
 *   // Show admin features
 * }
 * ```
 */
export async function getUserRole(
    supabase: SupabaseClient
): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Try to get role from user metadata first
    const role = user.app_metadata?.role || user.user_metadata?.role;

    if (role) {
        return role;
    }

    // Fallback: fetch from profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role || null;
}

/**
 * Check if user has specific role
 * 
 * @param supabase - Supabase client
 * @param role - Role to check
 * @returns True if user has the role
 * 
 * @example
 * ```typescript
 * const supabase = createBrowserClient();
 * const isAdmin = await hasRole(supabase, 'admin');
 * 
 * if (isAdmin) {
 *   // Show admin dashboard
 * }
 * ```
 */
export async function hasRole(
    supabase: SupabaseClient,
    role: string
): Promise<boolean> {
    const userRole = await getUserRole(supabase);
    return userRole === role;
}
