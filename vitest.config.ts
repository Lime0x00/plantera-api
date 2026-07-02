import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
