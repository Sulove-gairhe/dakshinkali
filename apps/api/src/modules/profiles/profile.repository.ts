import { SupabaseClient } from '@supabase/supabase-js';

export type ProfileRole = 'customer' | 'admin';

export interface ProfileEntity {
    id: string;
    email: string;
    fullName: string | null;
    phone?: string | null;
    role: ProfileRole;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export class ProfileRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    async findById(id: string): Promise<ProfileEntity | null> {
        const { data, error } = await this.supabase.from('profiles').select().eq('id', id).single();
        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to find profile: ${error.message}`);
        }
        return this.mapProfile(data);
    }

    async list(page: number, pageSize: number, role?: ProfileRole): Promise<{ data: ProfileEntity[]; total: number; page: number; pageSize: number; totalPages: number }> {
        let query = this.supabase.from('profiles').select('*', { count: 'exact' });
        if (role) query = query.eq('role', role);
        const offset = (page - 1) * pageSize;
        const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
        if (error) throw new Error(`Failed to list profiles: ${error.message}`);
        const total = count || 0;
        return {
            data: (data || []).map(row => this.mapProfile(row)),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

async updateProfile(id: string, data: { fullName?: string | null; phone?: string | null; avatarUrl?: string | null }): Promise<ProfileEntity> {
        const row: any = {};
        if (data.fullName !== undefined) row.full_name = data.fullName;
        if (data.phone !== undefined) row.phone = data.phone;
        if (data.avatarUrl !== undefined) row.avatar_url = data.avatarUrl;

        const { data: updated, error } = await this.supabase.from('profiles').update(row).eq('id', id).select().single();
        if (error || !updated) throw new Error(`Failed to update profile: ${error?.message || 'Profile not found'}`);
        return this.mapProfile(updated);
    }

    async updateRole(id: string, role: ProfileRole): Promise<ProfileEntity> {
        const { data, error } = await this.supabase.from('profiles').update({ role }).eq('id', id).select().single();
        if (error || !data) throw new Error(`Failed to update user role: ${error?.message || 'Profile not found'}`);
        return this.mapProfile(data);
    }

    async stats(): Promise<{ totalUsers: number; adminUsers: number; customerUsers: number }> {
        const { data, error, count } = await this.supabase.from('profiles').select('role', { count: 'exact' });
        if (error) throw new Error(`Failed to load user stats: ${error.message}`);
        return {
            totalUsers: count || 0,
            adminUsers: (data || []).filter(row => row.role === 'admin').length,
            customerUsers: (data || []).filter(row => row.role === 'customer').length,
        };
    }

    private mapProfile(row: any): ProfileEntity {
        return {
            id: row.id,
            email: row.email,
            fullName: row.full_name,
            phone: row.phone,
            role: row.role,
            avatarUrl: row.avatar_url,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
