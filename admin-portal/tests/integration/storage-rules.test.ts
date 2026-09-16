/**
 * Integration tests for Firebase Storage Security Rules.
 *
 * These tests exercise `storage.rules` against the Firebase Local Emulator
 * Suite using `@firebase/rules-unit-testing`. They are EXCLUDED from the default
 * `npm run test` run and are only executed via `npm run test:integration` with
 * the emulator running (see CONTRIBUTING.md).
 *
 * Validates: Requirements 16.3, 16.4, 16.5, 16.6
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterAll, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../../storage.rules');

const PROJECT_ID = 'kot-fc-storage-rules-test';

// A tiny (~4 byte) blob that we tag with the desired content type.
const smallJpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' });
const smallText = () => new Blob(['hello'], { type: 'text/plain' });
// An 11 MB blob to exceed the 10 MB limit, tagged as a valid image type.
const oversizedImage = () =>
  new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/jpeg' });

// Skip the entire suite unless the Storage emulator is running.
const emulatorRunning = !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;

describe.skipIf(!emulatorRunning)('Storage Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      storage: {
        rules: readFileSync(rulesPath, 'utf8')
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  // ── delete: admin only ──────────────────────────────────────────────────────
  it('admin can delete Storage objects', async () => {
    // Seed an object with rules disabled.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'players/p1/photo.jpg'), smallJpeg());
    });

    const storage = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).storage();
    await assertSucceeds(deleteObject(ref(storage, 'players/p1/photo.jpg')));
  });

  it('editor cannot delete Storage objects', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'players/p2/photo.jpg'), smallJpeg());
    });

    const storage = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).storage();
    await assertFails(deleteObject(ref(storage, 'players/p2/photo.jpg')));
  });

  // ── upload validation (isValidImage) ────────────────────────────────────────
  it('admin can upload a valid image/jpeg', async () => {
    const storage = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).storage();
    await assertSucceeds(uploadBytes(ref(storage, 'players/p3/photo.jpg'), smallJpeg()));
  });

  it('upload with text/plain is denied (invalid MIME)', async () => {
    const storage = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).storage();
    await assertFails(uploadBytes(ref(storage, 'players/p4/notes.txt'), smallText()));
  });

  it('upload over 10MB is denied', async () => {
    const storage = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).storage();
    await assertFails(uploadBytes(ref(storage, 'players/p5/huge.jpg'), oversizedImage()));
  });

  // ── assets/**: admin-only read/write ────────────────────────────────────────
  it('editor cannot read assets/**', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'assets/branding/logo.png'), smallJpeg());
    });

    const storage = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).storage();
    await assertFails(getBytes(ref(storage, 'assets/branding/logo.png')));
  });
});
