import { NotFoundException } from '../../../common/exceptions/not-found.exception';

/**
 * Cart not found exception
 * Thrown when a cart with the specified ID or user/session does not exist
 */
export class CartNotFoundException extends NotFoundException {
    constructor(identifier: string) {
        super(`Cart not found for ${identifier}.`);
        this.name = 'CartNotFoundException';
    }
}
