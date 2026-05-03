import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { AdminUserRoleController } from './user-role.controller';

const userId = '11111111-1111-4111-8111-111111111111';

function createController() {
    const supabase = {
        auth: {
            admin: {
                getUserById: vi.fn(async () => ({
                    data: {
                        user: {
                            id: userId,
                            email: 'admin@example.com',
                            app_metadata: {
                                provider: 'email',
                                providers: ['email'],
                            },
                        },
                    },
                    error: null,
                })),
                updateUserById: vi.fn(async (_id: string, update: any) => ({
                    data: {
                        user: {
                            id: userId,
                            email: 'admin@example.com',
                            app_metadata: update.app_metadata,
                        },
                    },
                    error: null,
                })),
            },
        },
    };
    const profileRepository = {
        updateRole: vi.fn(async () => ({
            id: userId,
            email: 'admin@example.com',
            fullName: null,
            role: 'admin',
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })),
    };

    return {
        controller: new AdminUserRoleController(supabase as any, profileRepository as any),
        supabase,
        profileRepository,
    };
}

describe('AdminUserRoleController', () => {
    it('updates Supabase app_metadata role while preserving existing metadata', async () => {
        const { controller, supabase, profileRepository } = createController();

        const result = await controller.updateAuthUserRole(userId, { role: 'admin' });

        expect(result.status).toBe(200);
        expect(supabase.auth.admin.getUserById).toHaveBeenCalledWith(userId);
        expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith(userId, {
            app_metadata: {
                provider: 'email',
                providers: ['email'],
                role: 'admin',
            },
        });
        expect(profileRepository.updateRole).toHaveBeenCalledWith(userId, 'admin');
        expect(result.data).toEqual({
            id: userId,
            email: 'admin@example.com',
            role: 'admin',
            appMetadata: {
                provider: 'email',
                providers: ['email'],
                role: 'admin',
            },
            profileUpdated: true,
        });
    });

    it('rejects invalid roles', async () => {
        const { controller } = createController();

        await expect(controller.updateAuthUserRole(userId, { role: 'owner' })).rejects.toBeInstanceOf(ValidationException);
    });

    it('rejects invalid user IDs', async () => {
        const { controller } = createController();

        await expect(controller.updateAuthUserRole('bad-id', { role: 'admin' })).rejects.toBeInstanceOf(ValidationException);
    });

    it('returns not found when Supabase Auth user does not exist', async () => {
        const { controller, supabase } = createController();
        supabase.auth.admin.getUserById.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'User not found' },
        });

        await expect(controller.updateAuthUserRole(userId, { role: 'admin' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('still returns success when profile role sync fails after auth metadata update', async () => {
        const { controller, profileRepository } = createController();
        profileRepository.updateRole.mockRejectedValueOnce(new Error('Profile missing'));

        const result = await controller.updateAuthUserRole(userId, { role: 'admin' });

        expect(result.data.profileUpdated).toBe(false);
        expect(result.data.appMetadata.role).toBe('admin');
    });
});
