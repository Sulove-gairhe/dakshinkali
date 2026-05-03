import { ForbiddenException } from '../../../common/exceptions/forbidden.exception';

/**
 * Unauthorized cart access exception
 * Thrown when a user attempts to access or modify a cart that doesn't belong to them
 */
export class UnauthorizedCartAccessException extends ForbiddenException {
    constructor(message: string = 'You do not have permission to access this cart.') {
        super(message);
        this.name = 'UnauthorizedCartAccessException';
    }
}
