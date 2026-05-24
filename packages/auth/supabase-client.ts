/**
 * Supabase Client Configuration for Next.js
 * 
 * Provides browser and server-side Supabase clients with proper configuration.
 * Handles session management and token refresh automatically.
 */

import { createBrowserClient as createClient, createServerClient as createServer } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveSupabaseAnonKey } from './supabase-env';

/**
 * Auth client configuration
 */
export interface AuthClientConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
}

/**
 * Get configuration from environment variables
 */
function getConfig(): AuthClientConfig {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const resolved = resolveSupabaseAnonKey(supabaseUrl);

    if ('error' in resolved) {
        throw new Error(resolved.error);
    }

    if (!supabaseUrl) {
        throw new Error(
            'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL.',
        );
    }

    return { supabaseUrl, supabaseAnonKey: resolved.key };
}

/**
 * Create browser-side Supabase client
 * 
 * Use this in client components and client-side code.
 * Automatically handles session persistence and token refresh.
 * 
 * @returns Supabase client for browser
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * import { createBrowserClient } from '@dakshinkali/auth';
 * 
 * export function LoginForm() {
 *   const supabase = createBrowserClient();
 *   
 *   const handleLogin = async (email: string, password: string) => {
 *     const { data, error } = await supabase.auth.signInWithPassword({
 *       email,
 *       password,
 *     });
 *   };
 *   
 *   return <form>...</form>;
 * }
 * ```
 */
export function createBrowserClient(): SupabaseClient {
    const { supabaseUrl, supabaseAnonKey } = getConfig();

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce', // Use PKCE flow for better security
        },
        global: {
            headers: {
                'x-application-name': 'dakshinkali-electronics',
            },
        },
    });
}

/**
 * Create server-side Supabase client
 * 
 * Use this in Server Components, Server Actions, and API Routes.
 * Requires cookies for session management.
 * 
 * @param cookieStore - Next.js cookies() object
 * @returns Supabase client for server
 * 
 * @example
 * ```typescript
 * // In Server Component
 * import { cookies } from 'next/headers';
 * import { createServerClient } from '@dakshinkali/auth';
 * 
 * export default async function ProfilePage() {
 *   const supabase = createServerClient(cookies());
 *   const { data: { user } } = await supabase.auth.getUser();
 *   
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // In Server Action
 * 'use server';
 * 
 * import { cookies } from 'next/headers';
 * import { createServerClient } from '@dakshinkali/auth';
 * 
 * export async function updateProfile(formData: FormData) {
 *   const supabase = createServerClient(cookies());
 *   const { data: { user } } = await supabase.auth.getUser();
 *   
 *   if (!user) {
 *     throw new Error('Not authenticated');
 *   }
 *   
 *   // Update profile...
 * }
 * ```
 */
export function createServerClient(cookieStore: any): SupabaseClient {
    const { supabaseUrl, supabaseAnonKey } = getConfig();

    return createServer(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    // Handle cookie setting errors (e.g., in middleware)
                }
            },
            remove(name: string, options: any) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    // Handle cookie removal errors
                }
            },
        },
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false, // Server-side doesn't need URL detection
            flowType: 'pkce',
        },
        global: {
            headers: {
                'x-application-name': 'dakshinkali-electronics',
            },
        },
    });
}
