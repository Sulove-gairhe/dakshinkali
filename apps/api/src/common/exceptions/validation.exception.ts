/**
 * Validation exception for invalid input data
 * Maps to HTTP 400 Bad Request
 */
export class ValidationException extends Error {
    public readonly fields?: Array<{ field: string; message: string }>;

    constructor(message: string, fields?: Array<{ field: string; message: string }>) {
        super(message);
        this.name = 'ValidationException';
        this.fields = fields;
    }
}
