/**
 * Auth Provider Component
 * 
 * Provides authentication context to the application.
 * Handles session management and auth state changes.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './use-auth';
import { createBrowserClient } from './supabase-client';

/**
 * Auth provider props
 */
export interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * Auth Provider
 * 
 * Wrap your application with this provider to enable auth hooks.
 * 
 * @example
 * ```typescript
 * // app/layout.tsx
 * import { AuthProvider } from '@dakshinkali/auth';
 * 
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase] = useState(() => createBrowserClient());

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    // Sign in with email and password
    const signIn = useCallback(
        async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            return { error: error ? new Error(error.message) : null };
        },
        [supabase]
    );

    // Sign up with email and password
    const signUp = useCallback(
        async (
            email: string,
            password: string,
            metadata?: Record<string, unknown>,
            options?: { emailRedirectTo?: string },
        ) => {
            const emailRedirectTo =
                options?.emailRedirectTo ??
                (typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account')}`
                    : undefined);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                    emailRedirectTo,
                },
            });

            return {
                error: error ? new Error(error.message) : null,
                session: data.session,
                needsEmailConfirmation: !error && !data.session,
            };
        },
        [supabase]
    );

    const signInWithGoogle = useCallback(
        async (options?: { redirectPath?: string; emailRedirectTo?: string }) => {
            const redirectPath = options?.redirectPath ?? '/account';
            const redirectTo =
                options?.emailRedirectTo ??
                (typeof window !== 'undefined'
                    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`
                    : undefined);

            if (!redirectTo) {
                return { error: new Error('Google sign-in is only available in the browser.') };
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            return { error: error ? new Error(error.message) : null };
        },
        [supabase]
    );

    // Sign out
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, [supabase]);

    // Refresh session
    const refreshSession = useCallback(async () => {
        await supabase.auth.refreshSession();
    }, [supabase]);

    const value: AuthContextValue = {
        user,
        session,
        loading,
        supabase,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
