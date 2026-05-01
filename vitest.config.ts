import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                '**/*.test.ts',
                '**/__tests__/**',
                '**/dist/**',
                '**/build/**',
                '**/*.config.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './apps/api/src'),
            '@packages/database': path.resolve(__dirname, './packages/database'),
        },
    },
});
