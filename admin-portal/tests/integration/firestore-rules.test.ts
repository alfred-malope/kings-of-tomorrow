/**
 * Integration tests for Firestore Security Rules.
 *
 * These tests exercise `firestore.rules` against the Firebase Local Emulator
 * Suite using `@firebase/rules-unit-testing`. They are EXCLUDED from the default
 * `npm run test` run and are only executed via `npm run test:integration` with
 * the emulator running (see CONTRIBUTING.md).
 *
 * Validates: Requirements 3.4, 3.5, 3.6, 3.7, 3.8, 16.3, 16.4, 16.5, 16.6
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../../firestore.rules');

const PROJECT_ID = 'kot-fc-firestore-rules-test';

// Skip the entire suite unless the Firestore emulator is running.
const emulatorRunning = !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!emulatorRunning)('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(rulesPath, 'utf8')
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // ── users collection: admin only ──────────────────────────────────────────
  it('admin can write to the users collection', async () => {
    const db = testEnv.authenticatedContext('admin-uid', { role: 'admin' }).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users', 'user-1'), { displayName: 'Ada', role: 'editor', active: true })
    );
  });

  it('editor cannot write to the users collection', async () => {
    const db = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).firestore();
    await assertFails(
      setDoc(doc(db, 'users', 'user-1'), { displayName: 'Ada', role: 'editor', active: true })
    );
  });

  it('viewer cannot write to the users collection', async () => {
    const db = testEnv.authenticatedContext('viewer-uid', { role: 'viewer' }).firestore();
    await assertFails(
      setDoc(doc(db, 'users', 'user-1'), { displayName: 'Ada', role: 'viewer', active: true })
    );
  });

  // ── members collection: no unauthenticated access ───────────────────────────
  it('unauthenticated users cannot read the members collection', async () => {
    // Seed a member document with rules disabled.
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'members', 'member-1'), {
        firstName: 'Jane',
        lastName: 'Doe',
        membershipNumber: 'KOT-001'
      });
    });

    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'members', 'member-1')));
  });

  // ── players collection: admin/editor write, viewer read-only ────────────────
  it('editor can write to the players collection', async () => {
    const db = testEnv.authenticatedContext('editor-uid', { role: 'editor' }).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'players', 'player-1'), { displayName: 'Striker', squadNumber: 9 })
    );
  });

  it('viewer cannot write to the players collection', async () => {
    const db = testEnv.authenticatedContext('viewer-uid', { role: 'viewer' }).firestore();
    await assertFails(
      setDoc(doc(db, 'players', 'player-1'), { displayName: 'Striker', squadNumber: 9 })
    );
  });
});
