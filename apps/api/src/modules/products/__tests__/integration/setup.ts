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
        const self = this;
        return {
            select: (columns: string = '*', options?: any) => {
                const selectQuery = {
                    _table: table,
                    _columns: columns,
                    _options: options,
                    _filters: [] as Array<{ type: string; column: string; value: any }>,

                    eq(column: string, value: any) {
                        this._filters.push({ type: 'eq', column, value });
                        return this;
                    },
                    neq(column: string, value: any) {
                        this._filters.push({ type: 'neq', column, value });
                        return this;
                    },
                    is(column: string, value: any) {
                        this._filters.push({ type: 'is', column, value });
                        return this;
                    },
                    gte(column: string, value: any) {
                        this._filters.push({ type: 'gte', column, value });
                        return this;
                    },
                    lte(column: string, value: any) {
                        this._filters.push({ type: 'lte', column, value });
                        return this;
                    },
                    ilike(column: string, value: any) {
                        this._filters.push({ type: 'ilike', column, value });
                        return this;
                    },
                    order(column: string, options?: any) {
                        this._order = { column, options };
                        return this;
                    },
                    range(from: number, to: number) {
                        this._range = { from, to };
                        return this;
                    },
                    single() {
                        return self.executeSelect(this, true);
                    },
                    then(resolve: any, reject: any) {
                        return self.executeSelect(this, false).then(resolve, reject);
                    },
                    _order: null as any,
                    _range: null as any,
                };
                return selectQuery;
            },
            insert: (data: any) => ({
                select: () => ({
                    single: () => self.insert(table, data),
                }),
            }),
            update: (data: any) => {
                const updateQuery = {
                    _table: table,
                    _data: data,
                    _filters: [] as Array<{ type: string; column: string; value: any }>,

                    eq(column: string, value: any) {
                        this._filters.push({ type: 'eq', column, value });
                        return this;
                    },
                    is(column: string, value: any) {
                        this._filters.push({ type: 'is', column, value });
                        return this;
                    },
                    select() {
                        return {
                            single: () => self.executeUpdate(this),
                        };
                    },
                };
                return updateQuery;
            },
        };
    }

    private executeSelect(query: any, single: boolean) {
        const rows = this.data.get(query._table) || [];
        let filtered = rows;

        // Apply all filters
        for (const filter of query._filters) {
            if (filter.type === 'eq') {
                filtered = filtered.filter(row => row[filter.column] === filter.value);
            } else if (filter.type === 'neq') {
                filtered = filtered.filter(row => row[filter.column] !== filter.value);
            } else if (filter.type === 'is') {
                filtered = filtered.filter(row => row[filter.column] === filter.value);
            } else if (filter.type === 'gte') {
                // Ensure numeric comparison for gte
                filtered = filtered.filter(row => Number(row[filter.column]) >= Number(filter.value));
            } else if (filter.type === 'lte') {
                // Ensure numeric comparison for lte
                filtered = filtered.filter(row => Number(row[filter.column]) <= Number(filter.value));
            } else if (filter.type === 'ilike') {
                const searchTerm = filter.value.replace(/%/g, '').toLowerCase();
                filtered = filtered.filter(row =>
                    row[filter.column]?.toLowerCase().includes(searchTerm)
                );
            }
        }

        // Apply ordering
        if (query._order) {
            filtered = [...filtered].sort((a, b) => {
                if (query._order.options?.ascending) {
                    return a[query._order.column] > b[query._order.column] ? 1 : -1;
                }
                return a[query._order.column] < b[query._order.column] ? 1 : -1;
            });
        }

        // Store total count BEFORE pagination
        const totalCount = filtered.length;

        // Apply range (pagination)
        if (query._range) {
            filtered = filtered.slice(query._range.from, query._range.to + 1);
        }

        // Handle count option
        if (query._options?.count === 'exact') {
            return Promise.resolve({
                data: query._options?.head ? null : filtered,
                count: totalCount, // Use count from BEFORE pagination
                error: null,
            });
        }

        if (single) {
            return Promise.resolve({ data: filtered[0] || null, error: null });
        }

        return Promise.resolve({ data: filtered, error: null });
    }

    private insert(table: string, data: any) {
        const rows = this.data.get(table) || [];
        // Generate valid UUID v4 for testing
        const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        const newRow = {
            ...data,
            id: data.id || generateUUID(),
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            deleted_at: data.deleted_at !== undefined ? data.deleted_at : null,
        };
        rows.push(newRow);
        this.data.set(table, rows);
        return Promise.resolve({ data: newRow, error: null });
    }

    private executeUpdate(query: any) {
        const rows = this.data.get(query._table) || [];
        let filtered = rows;

        // Apply all filters to find the row to update
        for (const filter of query._filters) {
            if (filter.type === 'eq') {
                filtered = filtered.filter(row => row[filter.column] === filter.value);
            } else if (filter.type === 'is') {
                filtered = filtered.filter(row => row[filter.column] === filter.value);
            }
        }

        if (filtered.length === 0) {
            return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
        }

        // Update the first matching row
        const rowToUpdate = filtered[0];
        const updatedRow = {
            ...rowToUpdate,
            ...query._data,
            updated_at: new Date().toISOString(),
        };

        // Replace in the data store
        const allRows = this.data.get(query._table) || [];
        const index = allRows.findIndex(r => r === rowToUpdate);
        if (index !== -1) {
            allRows[index] = updatedRow;
            this.data.set(query._table, allRows);
        }

        return Promise.resolve({ data: updatedRow, error: null });
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
        // Look up route from context.routes (not closure variable) to support dynamic route replacement
        const route = context.routes.find(r => r.method === method && r.path === path);
        if (!route) {
            throw new Error(`Route not found: ${method} ${path}`);
        }

        const requestContext = {
            method,
            url: path,
            headers: options.headers || {},
            params: options.params || {},
            query: options.query || {},
            body: options.body,
            ip: options.ip || '127.0.0.1',
        };

        return await route.handler(requestContext);
    };

    const context = {
        supabase,
        productRepository,
        imageStorageService,
        productService,
        adminController,
        publicController,
        routes,
        executeRoute,
    };

    return context;
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
