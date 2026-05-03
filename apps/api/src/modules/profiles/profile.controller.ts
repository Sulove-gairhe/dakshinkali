import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { ValidationException } from '../../common/exceptions/validation.exception';
import { AuthUser } from '../../common/middleware/auth.middleware';
import { UnauthorizedException } from '../../common/exceptions/unauthorized.exception';
import { ProfileEntity, ProfileRepository, ProfileRole } from './profile.repository';

function mapProfile(profile: ProfileEntity) {
    return {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
    };
}

export class ProfileController {
    constructor(private readonly repository: ProfileRepository) { }

    async getMe(user?: AuthUser) {
        const currentUser = this.requireUser(user);
        const profile = await this.repository.findById(currentUser.id);
        if (!profile) throw new NotFoundException('Profile not found.');
        return { status: 200, data: mapProfile(profile) };
    }

    async updateMe(user: AuthUser | undefined, body: any) {
        const currentUser = this.requireUser(user);
        const profile = await this.repository.updateProfile(currentUser.id, {
            fullName: this.optionalString(body?.fullName, 'fullName'),
            avatarUrl: this.optionalString(body?.avatarUrl, 'avatarUrl'),
        });
        return { status: 200, data: mapProfile(profile) };
    }

    async listUsers(query: any) {
        const page = this.positiveInteger(query.page, 'page', 1);
        const pageSize = Math.min(this.positiveInteger(query.pageSize, 'pageSize', 20), 100);
        const role = query.role ? this.validateRole(query.role) : undefined;
        const result = await this.repository.list(page, pageSize, role);
        return {
            status: 200,
            data: {
                ...result,
                data: result.data.map(mapProfile),
            },
        };
    }

    async updateUserRole(id: string, body: any) {
        this.validateUUID(id, 'id');
        const role = this.validateRole(body?.role);
        const profile = await this.repository.updateRole(id, role);
        return { status: 200, data: mapProfile(profile) };
    }

    private requireUser(user?: AuthUser): AuthUser {
        if (!user) throw new UnauthorizedException('Authentication required.');
        return user;
    }

    private optionalString(value: unknown, field: string): string | null | undefined {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (typeof value !== 'string') {
            throw new ValidationException('Invalid profile data', [{ field, message: `${field} must be a string` }]);
        }
        return value.trim();
    }

    private validateRole(value: unknown): ProfileRole {
        if (value !== 'customer' && value !== 'admin') {
            throw new ValidationException('Invalid role', [{ field: 'role', message: 'Role must be customer or admin' }]);
        }
        return value;
    }

    private positiveInteger(value: unknown, field: string, fallback: number): number {
        if (value === undefined) return fallback;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1) {
            throw new ValidationException('Invalid pagination', [{ field, message: `${field} must be a positive integer` }]);
        }
        return parsed;
    }

    private validateUUID(value: unknown, field: string): string {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
            throw new ValidationException('Invalid UUID', [{ field, message: `${field} must be a valid UUID` }]);
        }
        return value;
    }
}
