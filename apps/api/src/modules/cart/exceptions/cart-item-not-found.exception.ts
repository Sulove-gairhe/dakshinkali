import { NotFoundException } from '../../../common/exceptions/not-found.exception';

/**
 * Cart item not found exception
 * Thrown when a cart item with the specified ID does not exist
 */
export class CartItemNotFoundException extends NotFoundException {
    constructor(itemId: string) {
        super(`Cart item with ID '${itemId}' not found.`);
        this.name = 'CartItemNotFoundException';
    }
}
