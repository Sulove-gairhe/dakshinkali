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
    const [supabase] = useState(() => {
        const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!hasUrl || !hasKey) {
            return null;
        }

        return createBrowserClient();
    });

    // Initialize auth state
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

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
            if (!supabase) {
                return { error: new Error('Supabase environment variables are not configured.') };
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            return { error };
        },
        [supabase]
    );

    // Sign up with email and password
    const signUp = useCallback(
        async (email: string, password: string, metadata?: any) => {
            if (!supabase) {
                return { error: new Error('Supabase environment variables are not configured.') };
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata,
                },
            });

            return { error };
        },
        [supabase]
    );

    // Sign out
    const signOut = useCallback(async () => {
        if (!supabase) {
            return;
        }

        await supabase.auth.signOut();
    }, [supabase]);

    // Refresh session
    const refreshSession = useCallback(async () => {
        if (!supabase) {
            return;
        }

        await supabase.auth.refreshSession();
    }, [supabase]);

    const value: AuthContextValue = {
        user,
        session,
        loading,
        supabase,
        signIn,
        signUp,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
