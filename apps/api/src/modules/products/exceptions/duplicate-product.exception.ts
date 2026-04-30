import { ConflictException } from '../../../common/exceptions/conflict.exception';

/**
 * Duplicate product exception
 * Thrown when attempting to create a product with a name that already exists in the same category
 */
export class DuplicateProductException extends ConflictException {
    constructor(name: string, category: string) {
        super(`A product with name '${name}' already exists in category '${category}'.`);
        this.name = 'DuplicateProductException';
    }
}
