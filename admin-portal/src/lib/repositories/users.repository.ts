// src/lib/repositories/users.repository.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import type { UserRecord } from '$lib/types/firestore.types';
import { RepositoryError } from './repository-error';

/** Firestore collection name for user records. */
const COLLECTION = 'users';

/**
 * Shape accepted by {@link createUser} — the document minus the id (which is
 * the Firebase Auth UID passed separately) and the server-managed timestamps.
 */
export type UserInput = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;

/** Shape accepted by {@link updateUser} — any subset of fields except id/createdAt. */
export type UserUpdate = Partial<Omit<UserRecord, 'id' | 'createdAt'>>;

/**
 * Fetches all user records, ordered by `createdAt` DESC (most recently created
 * first) to back the Users management table (Req 14.2).
 */
export async function getUsers(db: Firestore): Promise<UserRecord[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as UserRecord);
  } catch (err) {
    throw new RepositoryError('Failed to load users', err, 'read');
  }
}

/**
 * Fetches a single user record by id (the Firebase Auth UID), or `null` if no
 * such document exists.
 */
export async function getUser(db: Firestore, id: string): Promise<UserRecord | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as UserRecord;
  } catch (err) {
    throw new RepositoryError('Failed to load user', err, 'read');
  }
}

/**
 * Creates a user record at `users/{uid}` with `createdAt`/`updatedAt` set to
 * `serverTimestamp()` (Req 14.4, 15.5).
 *
 * The document id must equal the Firebase Auth UID, so `uid` is passed
 * explicitly and used as the document id via `setDoc(doc(db, 'users', uid))`
 * rather than an auto-generated id.
 */
export async function createUser(db: Firestore, uid: string, data: UserInput): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTION, uid), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to create user', err, 'create');
  }
}

/**
 * Updates the changed fields on a user record (e.g. role or active status) and
 * refreshes `updatedAt` with `serverTimestamp()` (Req 14.5, 15.5).
 */
export async function updateUser(db: Firestore, id: string, data: UserUpdate): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    throw new RepositoryError('Failed to update user', err, 'update');
  }
}

/**
 * Deletes a user record.
 */
export async function deleteUser(db: Firestore, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (err) {
    throw new RepositoryError('Failed to delete user', err, 'delete');
  }
}
