import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  plugins: [sveltekit(), svelteTesting()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    // Integration tests require the Firebase Emulator Suite and are run
    // separately via `npm run test:integration` (see CONTRIBUTING.md).
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/integration/**']
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  }
});
