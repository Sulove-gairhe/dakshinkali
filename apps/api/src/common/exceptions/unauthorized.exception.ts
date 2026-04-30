/**
 * Unauthorized exception for authentication failures
 * Maps to HTTP 401 Unauthorized
 */
export class UnauthorizedException extends Error {
    constructor(message: string = 'Authentication required. Please provide a valid access token.') {
        super(message);
        this.name = 'UnauthorizedException';
    }
}
