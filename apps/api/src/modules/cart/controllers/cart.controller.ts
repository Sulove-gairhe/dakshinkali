import { AuthUser } from '../../../common/middleware/auth.middleware';
import { ValidationException } from '../../../common/exceptions/validation.exception';
import { UnauthorizedException } from '../../../common/exceptions/unauthorized.exception';
import { CartDTO } from '../dto/cart.dto';
import { CartService } from '../services/cart.service';

type CartResponse = CartDTO | {
    id: null;
    userId: string | null;
    items: [];
    subtotal: 0;
    total: 0;
    itemCount: 0;
    createdAt: null;
    updatedAt: null;
};

interface CartOwner {
    userId: string | null;
    sessionId: string | null;
}

export class CartController {
    constructor(private readonly cartService: CartService) { }

    async addItem(user: AuthUser | undefined, sessionId: string | undefined, body: any): Promise<{ status: number; data: CartDTO }> {
        const owner = this.resolveOwner(user, sessionId);
        const productId = this.validateUUID(body?.productId, 'productId');
        const quantity = this.validateQuantity(body?.quantity, false);

        const cart = await this.cartService.addToCart(owner.userId, owner.sessionId, productId, quantity);
        return { status: 201, data: cart };
    }

    async getCart(user: AuthUser | undefined, sessionId: string | undefined): Promise<{ status: number; data: CartResponse }> {
        const owner = this.resolveOwner(user, sessionId);
        const cart = await this.cartService.getCart(owner.userId, owner.sessionId);

        return {
            status: 200,
            data: cart || {
                id: null,
                userId: owner.userId,
                items: [],
                subtotal: 0,
                total: 0,
                itemCount: 0,
                createdAt: null,
                updatedAt: null,
            },
        };
    }

    async updateItem(user: AuthUser | undefined, sessionId: string | undefined, itemId: string, body: any): Promise<{ status: number; data: CartDTO }> {
        const owner = this.resolveOwner(user, sessionId);
        const validItemId = this.validateUUID(itemId, 'id');
        const quantity = this.validateQuantity(body?.quantity, true);

        const cart = await this.cartService.updateCartItem(owner.userId, owner.sessionId, validItemId, quantity);
        return { status: 200, data: cart };
    }

    async removeItem(user: AuthUser | undefined, sessionId: string | undefined, itemId: string): Promise<{ status: number; data: CartDTO }> {
        const owner = this.resolveOwner(user, sessionId);
        const validItemId = this.validateUUID(itemId, 'id');

        const cart = await this.cartService.removeCartItem(owner.userId, owner.sessionId, validItemId);
        return { status: 200, data: cart };
    }

    async clearCart(user: AuthUser | undefined, sessionId: string | undefined): Promise<{ status: number }> {
        const owner = this.resolveOwner(user, sessionId);
        await this.cartService.clearCart(owner.userId, owner.sessionId);
        return { status: 204 };
    }

    async mergeCart(user: AuthUser | undefined, body: any): Promise<{ status: number; data: CartDTO }> {
        if (!user) {
            throw new UnauthorizedException('Authentication required to merge carts.');
        }

        const sessionId = this.validateSessionId(body?.sessionId);
        const cart = await this.cartService.mergeCarts(user.id, sessionId);
        return { status: 200, data: cart };
    }

    private resolveOwner(user: AuthUser | undefined, sessionId: string | undefined): CartOwner {
        if (user) {
            return { userId: user.id, sessionId: null };
        }

        return { userId: null, sessionId: this.validateSessionId(sessionId) };
    }

    private validateSessionId(sessionId: unknown): string {
        if (typeof sessionId !== 'string' || sessionId.trim() === '') {
            throw new UnauthorizedException('Guest cart requests require X-Session-ID.');
        }

        return sessionId.trim();
    }

    private validateUUID(value: unknown, field: string): string {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (typeof value !== 'string' || !uuidRegex.test(value)) {
            throw new ValidationException('Invalid UUID', [
                { field, message: `${field} must be a valid UUID` },
            ]);
        }

        return value;
    }

    private validateQuantity(value: unknown, allowZero: boolean): number {
        if (!Number.isInteger(value)) {
            throw new ValidationException('Invalid quantity', [
                { field: 'quantity', message: 'Quantity must be an integer' },
            ]);
        }

        const min = allowZero ? 0 : 1;
        if ((value as number) < min || (value as number) > 99) {
            throw new ValidationException('Invalid quantity', [
                { field: 'quantity', message: `Quantity must be between ${min} and 99` },
            ]);
        }

        return value as number;
    }
}
