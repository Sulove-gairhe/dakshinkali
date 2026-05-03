/**
 * Auth Hooks for React/Next.js
 * 
 * Provides React hooks for authentication state management.
 * Must be used within AuthProvider.
 */

'use client';

import { createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Auth context value
 */
export interface AuthContextValue {
    /** Current user */
    user: User | null;
    
    /** Current session */
    session: Session | null;
    
    /** Loading state */
    loading: boolean;
    
    /** Supabase client */
    supabase: SupabaseClient;
    
    /** Sign in with email and password */
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    
    /** Sign up with email and password */
    signUp: (email: string, password: string, metadata?: any) => Promise<{ error: Error | null }>;
    
    /** Sign out */
    signOut: () => Promise<void>;
    
    /** Refresh session */
    refreshSession: () => Promise<void>;
}

/**
 * Auth context
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Use auth hook
 * 
 * Provides access to authentication state and methods.
 * 
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * import { useAuth } from '@dakshinkali/auth';
 * 
 * export function ProfileButton() {
 *   const { user, signOut, loading } = useAuth();
 *   
 *   if (loading) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (!user) {
 *     return <a href="/login">Login</a>;
 *   }
 *   
 *   return (
 *     <div>
 *       <span>{user.email}</span>
 *       <button onClick={signOut}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    
    return context;
}

/**
 * Use user hook
 * 
 * Provides access to current user only.
 * 
 * @returns Current user or null
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * import { useUser } from '@dakshinkali/auth';
 * 
 * export function WelcomeMessage() {
 *   const user = useUser();
 *   
 *   if (!user) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useUser(): User | null {
    const { user } = useAuth();
    return user;
}

/**
 * Use session hook
 * 
 * Provides access to current session only.
 * 
 * @returns Current session or null
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * import { useSession } from '@dakshinkali/auth';
 * 
 * export function SessionInfo() {
 *   const session = useSession();
 *   
 *   if (!session) {
 *     return <div>No active session</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Access token: {session.access_token.substring(0, 20)}...</p>
 *       <p>Expires at: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): Session | null {
    const { session } = useAuth();
    return session;
}
