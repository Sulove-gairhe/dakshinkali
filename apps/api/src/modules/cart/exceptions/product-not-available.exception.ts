import { ValidationException } from '../../../common/exceptions/validation.exception';

/**
 * Product not available exception
 * Thrown when attempting to add an inactive or deleted product to cart
 */
export class ProductNotAvailableException extends ValidationException {
    constructor(productId: string, reason: string = 'Product is not available') {
        super(`Product with ID '${productId}' is not available. ${reason}`, [
            { field: 'productId', message: reason }
        ]);
        this.name = 'ProductNotAvailableException';
    }
}
