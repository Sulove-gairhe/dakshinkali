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
import { getUserRole } from './auth-helpers';
import type { UserProfile, UserRole } from './types';
import { isAdminRole } from './types';

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

function resolveRoleFromUser(user: User | null): UserRole | null {
    if (!user) {
        return null;
    }

    const metadataRole =
        user.app_metadata?.role || user.user_metadata?.role;

    if (metadataRole === 'admin' || metadataRole === 'staff' || metadataRole === 'customer') {
        return metadataRole;
    }

    return null;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);

    const loadProfile = useCallback(async (client: SupabaseClient, currentUser: User) => {
        const { data, error } = await client
            .from('profiles')
            .select('id, email, full_name, role, avatar_url, created_at, updated_at')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.warn('Failed to load profile:', error.message);
        }

        if (data) {
            const nextProfile = data as UserProfile;
            setProfile(nextProfile);
            setRole(nextProfile.role);
            return;
        }

        const metadataRole = resolveRoleFromUser(currentUser);
        const fallbackRole = metadataRole ?? 'customer';
        setProfile({
            id: currentUser.id,
            email: currentUser.email ?? '',
            full_name:
                (currentUser.user_metadata?.full_name as string | undefined) ?? null,
            role: fallbackRole,
            avatar_url: null,
        });
        setRole(fallbackRole);
    }, []);

    const clearProfile = useCallback(() => {
        setProfile(null);
        setRole(null);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!supabase || !user) {
            clearProfile();
            return;
        }

        await loadProfile(supabase, user);
        const resolvedRole = await getUserRole(supabase);
        if (resolvedRole === 'admin' || resolvedRole === 'staff' || resolvedRole === 'customer') {
            setRole(resolvedRole);
        }
    }, [supabase, user, loadProfile, clearProfile]);

    useEffect(() => {
        let subscription: { unsubscribe: () => void } | undefined;

        try {
            const client = createBrowserClient();
            setSupabase(client);

            client.auth.getSession().then(({ data: { session: nextSession } }) => {
                setSession(nextSession);
                const nextUser = nextSession?.user ?? null;
                setUser(nextUser);
                setRole(resolveRoleFromUser(nextUser));

                if (nextUser) {
                    void loadProfile(client, nextUser).finally(() => setLoading(false));
                } else {
                    clearProfile();
                    setLoading(false);
                }
            });

            const {
                data: { subscription: authSubscription },
            } = client.auth.onAuthStateChange((_event, nextSession) => {
                setSession(nextSession);
                const nextUser = nextSession?.user ?? null;
                setUser(nextUser);
                setRole(resolveRoleFromUser(nextUser));

                if (nextUser) {
                    void loadProfile(client, nextUser);
                } else {
                    clearProfile();
                }

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
    }, [loadProfile, clearProfile]);

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
                    data: {
                        role: 'customer',
                        ...metadata,
                    },
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
        clearProfile();
    }, [requireClient, clearProfile]);

    const refreshSession = useCallback(async () => {
        const { client, error: clientError } = requireClient();
        if (clientError || !client) {
            return;
        }

        await client.auth.refreshSession();
    }, [requireClient]);

    const isAuthenticated = !!user && !!session;
    const isAdmin = role === 'admin';

    const value: AuthContextValue = {
        user,
        session,
        profile,
        role,
        loading,
        isLoading: loading,
        isAuthenticated,
        isAdmin,
        supabase,
        configError,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
