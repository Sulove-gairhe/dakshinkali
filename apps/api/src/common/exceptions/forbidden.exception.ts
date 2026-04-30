/**
 * Forbidden exception for authorization failures
 * Maps to HTTP 403 Forbidden
 */
export class ForbiddenException extends Error {
    constructor(message: string = 'Admin access required for this operation.') {
        super(message);
        this.name = 'ForbiddenException';
    }
}
