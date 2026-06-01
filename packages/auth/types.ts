/**
 * User profile from public.profiles
 */
export type UserProfile = {
    id: string;
    email: string;
    full_name: string | null;
    role: 'customer' | 'staff' | 'admin';
    avatar_url: string | null;
    created_at?: string;
    updated_at?: string;
};

export type UserRole = 'customer' | 'staff' | 'admin';

export function isAdminRole(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'staff';
}

export function isSuperAdmin(role: UserRole | null | undefined): boolean {
    return role === 'admin';
}
