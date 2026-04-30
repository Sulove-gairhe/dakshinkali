/**
 * Conflict exception for business rule violations
 * Maps to HTTP 409 Conflict
 */
export class ConflictException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConflictException';
    }
}
