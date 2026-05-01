/**
 * Integration Test Setup
 * 
 * Configures test environment for full-stack integration testing.
 * Sets up test database, mock services, and test utilities.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ProductServiceImpl } from '../../services/product.service.impl';
import { ProductRepositoryImpl } from '../../repositories/product.repository.impl';
import { ImageStorageServiceImpl } from '../../services/image-storage.service.impl';
import { AdminProductController } from '../../controllers/admin-product.controller';
import { PublicProductController } from '../../controllers/public-product.controller';
import { createProductRoutes, RouteHandler, Route } from '../../routes/product.routes';
import { JWTPayload } from '../../../../common/middleware';

/**
 * Mock Supabase client for testing
 */
export class MockSupabaseClient {
    private data: Map<string, any[]> = new Map();
    private idCounter = 1;

    constructor() {
        this.data.set('products', []);
    }

    from(table: string) {
        return {
            select: (columns: string = '*') => ({
                eq: (column: string, value: any) => this.selectEq(table, column, value),
                neq: (column: string, value: any) => this.selectNeq(table, column, value),
                is: (column: string, value: any) => this.selectIs(table, column, value),
                gte: (column: string, value: any) => this.selectGte(table, column, value),
                lte: (column: string, value: any) => this.selectLte(table, column, value),
                ilike: (column: string, value: any) => this.selectIlike(table, column, value),
                order: (column: string, options?: any) => this.selectOrder(table, column, options),
                range: (from: number, to: number) => this.selectRange(table, from, to),
                single: () => this.selectSingle(table),
            }),
            insert: (data: any) => this.insert(table, data),
            update: (data: any) => ({
                eq: (column: string, value: any) => this.updateEq(table, data, column, value),
            }),
        };
    }

    private selectEq(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const filtered = rows.filter(row => row[column] === value);
        return { data: filtered, error: null };
    }

    private selectNeq(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const filtered = rows.filter(row => row[column] !== value);
        return { data: filtered, error: null };
    }

    private selectIs(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const filtered = rows.filter(row => row[column] === value);
        return { data: filtered, error: null };
    }

    private selectGte(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const filtered = rows.filter(row => row[column] >= value);
        return { data: filtered, error: null };
    }

    private selectLte(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const filtered = rows.filter(row => row[column] <= value);
        return { data: filtered, error: null };
    }

    private selectIlike(table: string, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const searchTerm = value.replace(/%/g, '').toLowerCase();
        const filtered = rows.filter(row =>
            row[column]?.toLowerCase().includes(searchTerm)
        );
        return { data: filtered, error: null };
    }

    private selectOrder(table: string, column: string, options?: any) {
        const rows = this.data.get(table) || [];
        const sorted = [...rows].sort((a, b) => {
            if (options?.ascending) {
                return a[column] > b[column] ? 1 : -1;
            }
            return a[column] < b[column] ? 1 : -1;
        });
        return { data: sorted, error: null };
    }

    private selectRange(table: string, from: number, to: number) {
        const rows = this.data.get(table) || [];
        const sliced = rows.slice(from, to + 1);
        return { data: sliced, error: null };
    }

    private selectSingle(table: string) {
        const rows = this.data.get(table) || [];
        return { data: rows[0] || null, error: null };
    }

    private insert(table: string, data: any) {
        const rows = this.data.get(table) || [];
        const newRow = {
            ...data,
            id: data.id || `test-id-${this.idCounter++}`,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
        };
        rows.push(newRow);
        this.data.set(table, rows);
        return { data: newRow, error: null };
    }

    private updateEq(table: string, data: any, column: string, value: any) {
        const rows = this.data.get(table) || [];
        const index = rows.findIndex(row => row[column] === value);
        if (index !== -1) {
            rows[index] = {
                ...rows[index],
                ...data,
                updated_at: new Date().toISOString(),
            };
            this.data.set(table, rows);
            return { data: rows[index], error: null };
        }
        return { data: null, error: { message: 'Not found' } };
    }

    // Storage mock
    storage = {
        from: (bucket: string) => ({
            upload: async (path: string, file: any) => ({
                data: { path },
                error: null,
            }),
            remove: async (paths: string[]) => ({
                data: paths,
                error: null,
            }),
            getPublicUrl: (path: string) => ({
                data: { publicUrl: `https://storage.example.com/${bucket}/${path}` },
            }),
        }),
    };

    // Helper to clear data
    clearData() {
        this.data.clear();
        this.data.set('products', []);
        this.idCounter = 1;
    }

    // Helper to seed data
    seedData(table: string, rows: any[]) {
        this.data.set(table, rows);
    }
}

/**
 * Mock JWT verifier for testing
 */
export const mockJWTVerifier = (token: string): JWTPayload => {
    if (token === 'invalid-token') {
        throw new Error('Invalid token');
    }

    if (token === 'admin-token') {
        return {
            sub: 'admin-user-id',
            email: 'admin@example.com',
            role: 'admin',
        };
    }

    if (token === 'user-token') {
        return {
            sub: 'regular-user-id',
            email: 'user@example.com',
            role: 'user',
        };
    }

    throw new Error('Unknown token');
};

/**
 * Test context with all dependencies
 */
export interface TestContext {
    supabase: MockSupabaseClient;
    productRepository: ProductRepositoryImpl;
    imageStorageService: ImageStorageServiceImpl;
    productService: ProductServiceImpl;
    adminController: AdminProductController;
    publicController: PublicProductController;
    routes: Route[];
    executeRoute: (method: string, path: string, options?: {
        headers?: Record<string, string>;
        params?: Record<string, string>;
        query?: Record<string, any>;
        body?: any;
        ip?: string;
    }) => Promise<any>;
}

/**
 * Create test context with all dependencies
 */
export function createTestContext(): TestContext {
    const supabase = new MockSupabaseClient() as any;
    const productRepository = new ProductRepositoryImpl(supabase);
    const imageStorageService = new ImageStorageServiceImpl(supabase);
    const productService = new ProductServiceImpl(productRepository, imageStorageService);
    const adminController = new AdminProductController(productService);
    const publicController = new PublicProductController(productService);

    const routes = createProductRoutes({
        productService,
        jwtVerifier: mockJWTVerifier,
        corsOrigins: ['http://localhost:3000'],
        enableRateLimiting: false, // Disable for most tests
        enableCaching: true,
    });

    /**
     * Execute a route handler with given parameters
     */
    const executeRoute = async (
        method: string,
        path: string,
        options: {
            headers?: Record<string, string>;
            params?: Record<string, string>;
            query?: Record<string, any>;
            body?: any;
            ip?: string;
        } = {}
    ) => {
        const route = routes.find(r => r.method === method && r.path === path);
        if (!route) {
            throw new Error(`Route not found: ${method} ${path}`);
        }

        const context = {
            method,
            url: path,
            headers: options.headers || {},
            params: options.params || {},
            query: options.query || {},
            body: options.body,
            ip: options.ip || '127.0.0.1',
        };

        return await route.handler(context);
    };

    return {
        supabase,
        productRepository,
        imageStorageService,
        productService,
        adminController,
        publicController,
        routes,
        executeRoute,
    };
}

/**
 * Global test setup
 */
let testContext: TestContext;

beforeAll(() => {
    testContext = createTestContext();
});

beforeEach(() => {
    // Clear database before each test
    testContext.supabase.clearData();
});

afterEach(() => {
    // Cleanup after each test
    testContext.supabase.clearData();
});

afterAll(() => {
    // Final cleanup
});

export { testContext };
