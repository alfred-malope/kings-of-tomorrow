// src/lib/repositories/settings.repository.ts
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import type { AppSettings } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for application settings. */
const COLLECTION = 'settings';

/**
 * Id of the single global settings document. All application-level
 * configuration lives in `settings/global` (Req 13.2).
 */
export const SETTINGS_DOC_ID = 'global';

/**
 * Shape accepted by {@link updateSettings} — any subset of the editable
 * settings fields. `id` and the server-managed `updatedAt` timestamp are
 * excluded because they are never written by the caller.
 */
export type SettingsUpdate = Partial<Omit<AppSettings, 'id' | 'updatedAt'>>;

/**
 * Fetches the global settings document (`settings/global`), or `null` if it
 * does not yet exist (Req 13.2).
 */
export async function getSettings(db: Firestore): Promise<AppSettings | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, SETTINGS_DOC_ID));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as AppSettings;
  } catch (err) {
    throw new RepositoryError('Failed to load settings', err, 'read');
  }
}

/**
 * Updates the changed fields on the global settings document and refreshes
 * `updatedAt` with `serverTimestamp()` (Req 13.3, 15.5).
 */
export async function updateSettings(db: Firestore, data: SettingsUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, SETTINGS_DOC_ID), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update settings', err, 'update');
  }
}
