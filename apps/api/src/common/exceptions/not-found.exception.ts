/**
 * Not found exception for missing resources
 * Maps to HTTP 404 Not Found
 */
export class NotFoundException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundException';
    }
}
