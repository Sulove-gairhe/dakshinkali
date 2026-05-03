/**
 * Auth Package - Shared Authentication Utilities
 * 
 * Provides reusable authentication utilities for Next.js applications.
 * Includes Supabase client setup, auth hooks, and helper functions.
 */

// Supabase client configuration
export {
    createBrowserClient,
    createServerClient,
    type AuthClientConfig,
} from './supabase-client';

// Auth hooks for React/Next.js
export {
    useAuth,
    useUser,
    useSession,
    type AuthContextValue,
} from './use-auth';

// Auth helpers
export {
    getAccessToken,
    refreshSession,
    signOut,
    type AuthTokens,
} from './auth-helpers';

// Auth provider
export { AuthProvider } from './auth-provider';

// Types
export type { User, Session } from '@supabase/supabase-js';
