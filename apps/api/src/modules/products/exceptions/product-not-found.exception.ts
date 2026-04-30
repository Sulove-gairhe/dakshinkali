import { NotFoundException } from '../../../common/exceptions/not-found.exception';

/**
 * Product not found exception
 * Thrown when a product with the specified ID does not exist
 */
export class ProductNotFoundException extends NotFoundException {
    constructor(productId: string) {
        super(`Product with ID '${productId}' not found.`);
        this.name = 'ProductNotFoundException';
    }
}
