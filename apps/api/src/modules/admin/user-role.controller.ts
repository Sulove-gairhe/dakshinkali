import { SupabaseClient, User } from '@supabase/supabase-js';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { ProfileRepository, ProfileRole } from '../profiles/profile.repository';

export interface UpdateAuthUserRoleResponse {
    id: string;
    email: string | null;
    role: ProfileRole;
    appMetadata: Record<string, any>;
    profileUpdated: boolean;
}

export class AdminUserRoleController {
    constructor(
        private readonly supabase: SupabaseClient,
        private readonly profileRepository: ProfileRepository
    ) { }

    async updateAuthUserRole(userId: string, body: any): Promise<{ status: number; data: UpdateAuthUserRoleResponse }> {
        this.validateUUID(userId, 'userId');
        const role = this.validateRole(body?.role);

        const { data: existingUserData, error: fetchError } = await this.supabase.auth.admin.getUserById(userId);
        if (fetchError || !existingUserData.user) {
            throw new NotFoundException(`Auth user with ID '${userId}' not found.`);
        }

        const existingUser = existingUserData.user;
        const existingAppMetadata = this.getAppMetadata(existingUser);
        const nextAppMetadata = {
            ...existingAppMetadata,
            role,
        };

        const { data: updatedUserData, error: updateError } = await this.supabase.auth.admin.updateUserById(userId, {
            app_metadata: nextAppMetadata,
        });
        if (updateError || !updatedUserData.user) {
            throw new Error(`Failed to update auth user role: ${updateError?.message || 'No user returned'}`);
        }

        let profileUpdated = false;
        try {
            await this.profileRepository.updateRole(userId, role);
            profileUpdated = true;
        } catch {
            profileUpdated = false;
        }

        const updatedUser = updatedUserData.user;
        return {
            status: 200,
            data: {
                id: updatedUser.id,
                email: updatedUser.email ?? null,
                role,
                appMetadata: this.getAppMetadata(updatedUser),
                profileUpdated,
            },
        };
    }

    private getAppMetadata(user: User): Record<string, any> {
        return { ...(user.app_metadata || {}) };
    }

    private validateRole(value: unknown): ProfileRole {
        if (value !== 'customer' && value !== 'admin') {
            throw new ValidationException('Invalid role', [{ field: 'role', message: 'Role must be customer or admin' }]);
        }
        return value;
    }

    private validateUUID(value: unknown, field: string): string {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
            throw new ValidationException('Invalid UUID', [{ field, message: `${field} must be a valid UUID` }]);
        }
        return value;
    }
}
