/**
 * ProductRepositoryImpl - Concrete implementation of ProductRepository
 * 
 * This class implements all database operations for the Product Module using Supabase.
 * It handles SQL query construction, execution, and row-to-entity mapping.
 * 
 * @remarks
 * - Uses Supabase client for database access
 * - Maps database rows (snake_case) to ProductEntity (camelCase)
 * - Handles JSONB parsing for images field
 * - Converts numeric price to number type
 * - Converts timestamps to Date objects
 * - Translates database errors to domain exceptions
 * 
 * **Validates: Requirements 1.6, 8.1, 8.3, 8.4**
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ProductEntity, ProductImage } from '../entities/product.entity';
import { ProductRepository } from './product.repository';
import { Pagination, PaginatedResult, RepositoryFilters } from '../types/product.types';

/**
 * Database row interface
 * Represents the raw structure returned from Supabase queries
 * Uses snake_case to match PostgreSQL naming conventions
 */
interface ProductRow {
    id: string;
    name: string;
    description: string | null;
    price: string | number;  // Numeric type comes as string or number from Supabase
    category: string;
    status: string;
    images: any;  // JSONB field
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

/**
 * ProductRepositoryImpl
 * 
 * Concrete implementation of ProductRepository interface using Supabase.
 */
export class ProductRepositoryImpl implements ProductRepository {
    constructor(private readonly supabase: SupabaseClient) { }

    /**
     * Insert a new product into the database
     * 
     * @param product - ProductEntity to insert
     * @returns Promise resolving to the inserted ProductEntity with generated fields
     * 
     * @throws Error if insertion fails or unique constraint is violated
     * 
     * @remarks
     * - Converts ProductEntity (camelCase) to database row (snake_case)
     * - Database generates id, created_at, updated_at if not provided
     * - Returns the complete entity with all generated fields
     * - Maps the returned row back to ProductEntity
     * 
     * **Validates: Requirements 1.6, 8.4**
     */
    async insert(product: ProductEntity): Promise<ProductEntity> {
        // Convert ProductEntity to database row format (snake_case)
        const row = {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            status: product.status,
            images: JSON.stringify(product.images), // Convert array to JSONB
        };

        // Execute INSERT query
        const { data, error } = await this.supabase
            .from('products')
            .insert(row)
            .select()
            .single();

        if (error) {
            // Translate database errors to domain exceptions
            if (error.code === '23505') {
                // Unique constraint violation
                throw new Error(
                    `A product with name '${product.name}' already exists in category '${product.category}'.`
                );
            }
            throw new Error(`Failed to insert product: ${error.message}`);
        }

        if (!data) {
            throw new Error('Failed to insert product: No data returned');
        }

        // Map database row to ProductEntity
        return this.mapRowToEntity(data);
    }

    /**
     * Update an existing product with partial data
     * 
     * @param id - Product UUID to update
     * @param updates - Partial ProductEntity with fields to update
     * @returns Promise resolving to the updated ProductEntity
     * 
     * @throws Error if product not found or update fails
     */
    async update(id: string, updates: Partial<ProductEntity>): Promise<ProductEntity> {
        // Convert updates to database row format
        const row: any = {};

        if (updates.name !== undefined) row.name = updates.name;
        if (updates.description !== undefined) row.description = updates.description;
        if (updates.price !== undefined) row.price = updates.price;
        if (updates.category !== undefined) row.category = updates.category;
        if (updates.status !== undefined) row.status = updates.status;
        if (updates.images !== undefined) row.images = JSON.stringify(updates.images);

        // Execute UPDATE query with soft delete filter
        const { data, error } = await this.supabase
            .from('products')
            .update(row)
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(`Product with ID '${id}' not found.`);
            }
            if (error.code === '23505') {
                throw new Error(
                    `A product with name '${updates.name}' already exists in category '${updates.category}'.`
                );
            }
            throw new Error(`Failed to update product: ${error.message}`);
        }

        if (!data) {
            throw new Error(`Product with ID '${id}' not found.`);
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Soft delete a product by setting deleted_at timestamp
     * 
     * @param id - Product UUID to soft delete
     * @returns Promise resolving when deletion is complete
     * 
     * @throws Error if product not found or already deleted
     */
    async softDelete(id: string): Promise<void> {
        const { data, error } = await this.supabase
            .from('products')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .is('deleted_at', null)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Product with ID '${id}' not found or already deleted.`);
        }
    }

    /**
     * Find a product by ID
     * 
     * @param id - Product UUID to find
     * @param includeDeleted - If true, include soft-deleted products
     * @returns Promise resolving to ProductEntity or null if not found
     */
    async findById(id: string, includeDeleted: boolean = false): Promise<ProductEntity | null> {
        let query = this.supabase
            .from('products')
            .select()
            .eq('id', id);

        if (!includeDeleted) {
            query = query.is('deleted_at', null);
        }

        const { data, error } = await query.single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to find product: ${error.message}`);
        }

        if (!data) {
            return null;
        }

        return this.mapRowToEntity(data);
    }

    /**
     * Find all products with filtering, sorting, and pagination
     * 
     * @param filters - RepositoryFilters for query conditions
     * @param pagination - Pagination parameters
     * @returns Promise resolving to PaginatedResult with products and metadata
     */
    async findAll(
        filters: RepositoryFilters,
        pagination: Pagination
    ): Promise<PaginatedResult<ProductEntity>> {
        // Build base query
        let query = this.supabase.from('products').select('*', { count: 'exact' });

        // Apply soft delete filter
        if (!filters.includeDeleted) {
            query = query.is('deleted_at', null);
        }

        // Apply filters
        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.minPrice !== undefined) {
            query = query.gte('price', filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            query = query.lte('price', filters.maxPrice);
        }

        if (filters.search) {
            // Case-insensitive search in name and description
            const searchPattern = `%${filters.search}%`;
            query = query.or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`);
        }

        // Apply sorting
        const sortBy = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'desc';
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Apply pagination
        const offset = (pagination.page - 1) * pagination.pageSize;
        query = query.range(offset, offset + pagination.pageSize - 1);

        // Execute query
        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Failed to find products: ${error.message}`);
        }

        const total = count || 0;
        const totalPages = Math.ceil(total / pagination.pageSize);

        return {
            data: (data || []).map(row => this.mapRowToEntity(row)),
            total,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages,
        };
    }

    /**
     * Check if a product with the given name exists in the specified category
     * 
     * @param name - Product name to check
     * @param category - Product category to check within
     * @param excludeId - Optional product ID to exclude from check
     * @returns Promise resolving to true if product exists, false otherwise
     */
    async existsByNameAndCategory(
        name: string,
        category: string,
        excludeId?: string
    ): Promise<boolean> {
        let query = this.supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('name', name)
            .eq('category', category)
            .is('deleted_at', null);

        if (excludeId) {
            query = query.neq('id', excludeId);
        }

        const { count, error } = await query;

        if (error) {
            throw new Error(`Failed to check product existence: ${error.message}`);
        }

        return (count || 0) > 0;
    }

    /**
     * Map database row to ProductEntity
     * 
     * Handles all type conversions:
     * - JSONB to ProductImage[]
     * - numeric/string to number (price)
     * - string timestamps to Date objects
     * - snake_case to camelCase
     * 
     * @param row - Raw database row
     * @returns ProductEntity with proper types
     * 
     * @remarks
     * This is a critical method that ensures type safety between database and domain layers.
     * All database rows MUST pass through this mapping function.
     * 
     * **Validates: Requirements 8.4**
     */
    private mapRowToEntity(row: ProductRow): ProductEntity {
        // Parse JSONB images field
        let images: ProductImage[] = [];
        if (row.images) {
            try {
                // Handle both string and already-parsed object
                const parsed = typeof row.images === 'string'
                    ? JSON.parse(row.images)
                    : row.images;
                images = Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.error('Failed to parse images JSONB:', error);
                images = [];
            }
        }

        // Parse numeric price to number
        const price = typeof row.price === 'string'
            ? parseFloat(row.price)
            : row.price;

        // Parse timestamps to Date objects
        const createdAt = new Date(row.created_at);
        const updatedAt = new Date(row.updated_at);
        const deletedAt = row.deleted_at ? new Date(row.deleted_at) : null;

        return {
            id: row.id,
            name: row.name,
            description: row.description,
            price,
            category: row.category,
            status: row.status as any, // Type assertion for ProductStatus
            images,
            createdAt,
            updatedAt,
            deletedAt,
        };
    }
}
