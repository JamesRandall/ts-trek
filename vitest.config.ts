import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        globals: true,
        include: [
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
            'tests/**/*.test.{ts,tsx}',
            'tests/**/*.spec.{ts,tsx}',
        ],
        exclude: [
            'tests/e2e/**', // let Playwright pick these up
            'node_modules/**',
            'dist/**'
        ],
        coverage: { provider: 'v8', reporter: ['text', 'html'] },
    },
});
