/**
 * CartEntity - Domain model representing a shopping cart in the database
 * 
 * This entity maps directly to the carts table in Supabase PostgreSQL.
 * Supports both authenticated users (user_id) and anonymous users (session_id).
 * 
 * Requirements: AR-1 (Repository layer for data access)
 */

/**
 * Cart entity representing a user's shopping cart
 * 
 * @property id - Unique cart identifier (UUID)
 * @property userId - Authenticated user ID (NULL for anonymous carts)
 * @property sessionId - Session ID for anonymous users (NULL for authenticated carts)
 * @property createdAt - Timestamp when cart was created
 * @property updatedAt - Timestamp when cart was last updated
 */
export interface CartEntity {
    /**
     * Unique cart identifier (UUID)
     */
    id: string;

    /**
     * Authenticated user ID (NULL for anonymous carts)
     * Either userId OR sessionId must be set, not both
     */
    userId: string | null;

    /**
     * Session ID for anonymous users (NULL for authenticated carts)
     * Either userId OR sessionId must be set, not both
     */
    sessionId: string | null;

    /**
     * Timestamp when cart was created
     */
    createdAt: Date;

    /**
     * Timestamp when cart was last updated
     * Automatically updated by database trigger
     */
    updatedAt: Date;
}

/**
 * Database row type from carts table
 * Used for mapping database results to CartEntity
 */
export interface CartRow {
    id: string;
    user_id: string | null;
    session_id: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Map database row to CartEntity
 * 
 * @param row - Database row from carts table
 * @returns CartEntity with properly typed and parsed fields
 */
export function mapRowToCartEntity(row: CartRow): CartEntity {
    return {
        id: row.id,
        userId: row.user_id,
        sessionId: row.session_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
