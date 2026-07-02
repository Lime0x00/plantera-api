import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts', 'src/worker.ts'],
  format: ['esm'],
  clean: true,
  outDir: 'dist',
  shims: true,
  esbuildPlugins: [
    {
      name: 'external-prisma',
      setup(build) {
        build.onResolve({ filter: /generated\/prisma/ }, (args) => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
  external: ['@prisma/client'],
});
