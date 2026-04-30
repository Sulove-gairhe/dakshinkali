/**
 * Product Module Types - Barrel Export
 * 
 * Centralized export for all shared types used across the product module.
 * 
 * @remarks
 * - Import from this file for cleaner imports: import { Pagination, PaginatedResult } from '../types'
 * - All types are re-exported from product.types.ts
 */

export type {
    Pagination,
    PaginatedResult,
    ProductFilters,
    PublicProductFilters,
    RepositoryFilters,
} from './product.types';
