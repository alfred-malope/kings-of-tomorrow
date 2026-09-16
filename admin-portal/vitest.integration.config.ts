import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest configuration for Firebase Emulator integration tests.
 *
 * These tests exercise the Firestore/Storage security rules against the
 * Firebase Local Emulator Suite and are NOT part of the default `npm run test`
 * run. Start the emulator first (see CONTRIBUTING.md), then run:
 *
 *   npm run test:integration
 *
 * A `node` environment is used here (no jsdom / SvelteKit plugins) because the
 * @firebase/rules-unit-testing SDK runs against the emulator over the network.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
    // The emulator can be slow to respond on cold start.
    testTimeout: 30_000,
    hookTimeout: 30_000
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  }
});
