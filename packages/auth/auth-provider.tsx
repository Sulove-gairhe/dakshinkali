/**
 * Auth Provider Component
 *
 * Provides authentication context to the application.
 * Handles session management and auth state changes.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue } from './use-auth';
import { createBrowserClient } from './supabase-client';

/**
 * Auth provider props
 */
export interface AuthProviderProps {
    children: React.ReactNode;
}

function getConfigErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Authentication is not configured.';
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        let subscription: { unsubscribe: () => void } | undefined;

        try {
            const client = createBrowserClient();
            setSupabase(client);

            client.auth.getSession().then(({ data: { session: nextSession } }) => {
                setSession(nextSession);
                setUser(nextSession?.user ?? null);
                setLoading(false);
            });

            const {
                data: { subscription: authSubscription },
            } = client.auth.onAuthStateChange((_event, nextSession) => {
                setSession(nextSession);
                setUser(nextSession?.user ?? null);
                setLoading(false);
            });

            subscription = authSubscription;
        } catch (error) {
            setConfigError(getConfigErrorMessage(error));
            setLoading(false);
        }

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const requireClient = useCallback(() => {
        if (configError) {
            return {
                client: null,
                error: new Error(configError),
            };
        }

        if (!supabase) {
            return {
                client: null,
                error: new Error('Authentication is still loading.'),
            };
        }

        return { client: supabase, error: null };
    }, [configError, supabase]);

    const signIn = useCallback(
        async (email: string, password: string) => {
            const { client, error: clientError } = requireClient();
            if (clientError || !client) {
                return { error: clientError };
            }

            const { error } = await client.auth.signInWithPassword({
                email,
                password,
            });

            return { error: error ? new Error(error.message) : null };
        },
        [requireClient],
    );

    const signUp = useCallback(
        async (
            email: string,
            password: string,
            metadata?: Record<string, unknown>,
            options?: { emailRedirectTo?: string },
        ) => {
            const { client, error: clientError } = requireClient();
            if (clientError || !client) {
                return {
                    error: clientError,
                    session: null,
                    needsEmailConfirmation: false,
                };
            }

            const emailRedirectTo =
                options?.emailRedirectTo ??
                `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account')}`;

            const { data, error } = await client.auth.signUp({
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
        [requireClient],
    );

    const signInWithGoogle = useCallback(
        async (options?: { redirectPath?: string; emailRedirectTo?: string }) => {
            const { client, error: clientError } = requireClient();
            if (clientError || !client) {
                return { error: clientError };
            }

            const redirectPath = options?.redirectPath ?? '/account';
            const redirectTo =
                options?.emailRedirectTo ??
                `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

            const { error } = await client.auth.signInWithOAuth({
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
        [requireClient],
    );

    const signOut = useCallback(async () => {
        const { client, error: clientError } = requireClient();
        if (clientError || !client) {
            return;
        }

        await client.auth.signOut();
    }, [requireClient]);

    const refreshSession = useCallback(async () => {
        const { client, error: clientError } = requireClient();
        if (clientError || !client) {
            return;
        }

        await client.auth.refreshSession();
    }, [requireClient]);

    const value: AuthContextValue = {
        user,
        session,
        loading,
        supabase,
        configError,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
