/**
 * User profile from public.profiles
 */
export type UserProfile = {
    id: string;
    email: string;
    full_name: string | null;
    role: 'customer' | 'admin';
    avatar_url: string | null;
    created_at?: string;
    updated_at?: string;
};

export type UserRole = 'customer' | 'admin';
