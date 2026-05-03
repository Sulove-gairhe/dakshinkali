import { ValidationException } from '../../../common/exceptions/validation.exception';

/**
 * Invalid quantity exception
 * Thrown when a cart item quantity is outside the valid range (1-99)
 */
export class InvalidQuantityException extends ValidationException {
    constructor(quantity: number) {
        super(`Invalid quantity '${quantity}'. Quantity must be between 1 and 99.`, [
            { field: 'quantity', message: 'Quantity must be between 1 and 99' }
        ]);
        this.name = 'InvalidQuantityException';
    }
}
