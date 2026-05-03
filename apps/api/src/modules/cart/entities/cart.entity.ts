/**
 * CartEntity - Domain model representing a shopping cart in the database
 * 
 * This entity maps directly to the carts table in Supabase PostgreSQL.
 * It includes all fields from the database schema with proper TypeScript typing.
 * 
 * @remarks
 * - Either userId OR sessionId must be set (enforced by CHECK constraint in DB)
 * - userId is set for authenticated users (references auth.users)
 * - sessionId is set for guest/anonymous users (client-generated UUID)
 * - updatedAt is automatically managed by database trigger
 */

/**
 * CartEntity - Complete cart domain model
 * 
 * Represents a shopping cart with all database fields mapped to TypeScript types.
 * This entity is used internally by the Repository and Service layers.
 * 
 * @remarks
 * - API responses use CartDTO instead of this entity
 * - A user can have only one cart (enforced by unique constraint on user_id)
 * - A session can have only one cart (enforced by unique constraint on session_id)
 * - Cart items are stored in a separate cart_items table
 */
export interface CartEntity {
    /** Unique cart identifier (UUID v4) */
    id: string;

    /** Authenticated user identifier (UUID, nullable, references auth.users) */
    userId: string | null;

    /** Anonymous session identifier (TEXT, nullable, client-generated UUID) */
    sessionId: string | null;

    /** Timestamp when cart was created (auto-generated) */
    createdAt: Date;

    /** Timestamp when cart was last updated (auto-updated by trigger) */
    updatedAt: Date;
}
