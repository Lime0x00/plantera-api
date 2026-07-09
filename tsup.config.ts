import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/worker.ts', 'database/seeders/main.seeder.ts'],
  format: ['cjs'],
  platform: 'node',
  clean: true,
  outDir: 'dist',
  shims: true,
  external: ['@prisma/client'],
});
